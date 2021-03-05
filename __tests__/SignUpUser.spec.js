const request = require('supertest');
const app = require('../src/app');

const sequelize = require('../src/config/database');
const User = require('./../src/models/user/User');
const nodeMailerStub = require('nodemailer-stub');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

describe('User registration', () => {
  const DEFAULT_DATA = {
    email: 'test@test.com',
    password: 'Taras123456',
  };

  const postData = (data = {}) => {
    const localData = {
      ...DEFAULT_DATA,
      ...data,
    };

    return request(app).post('/api/1.0/users/sign-up').send(localData);
  };

  it('return 201 when reuest is valid', (done) => {
    postData().then((res) => {
      expect(res.status).toBe(201);
      done();
    });
  });

  it('return success field when valid', (done) => {
    postData().then((res) => {
      expect(res.body.success).toBe(true);
      done();
    });
  });

  it('saves user to db', (done) => {
    postData().then(() => {
      User.findAll().then((userList) => {
        const user = userList[0];
        expect(userList.length).toBe(1);
        expect(user.email).toBe('test@test.com');
        done();
      });
    });
  });

  it('set signUpStep as 0', (done) => {
    postData().then(() => {
      User.findAll().then((userList) => {
        const user = userList[0];
        expect(user.signUpStep).toBe(0);
        done();
      });
    });
  });

  it('set spendMoney as default false', (done) => {
    postData().then(() => {
      User.findAll().then((userList) => {
        const user = userList[0];
        expect(user.spendMoney).toBe(false)
        done();
      });
    });
  });

  it('saves user to db with spendMoney', (done) => {
    postData({
      spendMoney: true
    }).then(() => {
      User.findAll().then((userList) => {
        const user = userList[0];
        expect(user.spendMoney).toBe(true)
        done();
      });
    });
  });

  it('hashes the password', (done) => {
    postData().then(() => {
      User.findAll().then((userList) => {
        const user = userList[0];
        expect(user.password).not.toBe('test123');
        done();
      });
    });
  });

  it.each([['email'], ['password']])(
    'returns 400 when %s is null',
    async (field) => {
      postData({
        [field]: null,
      }).then((response) => {
        expect(response.status).toBe(400);
      });
    }
  );

  it.each`
    field         | value             | expectedMsg
    ${'password'} | ${'test'}         | ${'validation error'}
    ${'password'} | ${'Test1234'}     | ${'validation error'}
    ${'password'} | ${'s'.repeat(65)} | ${'validation error'}
    ${'email'}    | ${'test'}         | ${'validation error'}
  `('returns $expectedMsg when $field is $value', async ({ field, value }) => {
    postData({
      [field]: value,
    }).then((response) => {
      expect(response.status).toBe(400);
    });
  });

  it('Return error if user already exists', async (done) => {
    await User.create(DEFAULT_DATA)

    postData(DEFAULT_DATA).then(res => {
      expect(res.body.error.email).toBeTruthy()
      done()
    });
  });

  it('Returns emails is user and password error at the same time', async (done) => {
    await User.create(DEFAULT_DATA)

    postData({password: null}).then(res => {
      expect(res.body.error.email).toBeTruthy()
      expect(res.body.error.password).toBeTruthy()
      done()
    });
  });

  it('Creates user with isActive false', (done) => {
    postData().then(async () => {
      const users = await User.findAll()
      const user = users[0]
      expect(user.isActivated).toBe(false)
      done()
    });
  });

  it('Creates an activation token for user', (done) => {
    postData().then(async () => {
      const users = await User.findAll()
      const user = users[0]
      expect(user.activationToken).toBeTruthy()
      done()
    });
  });

  it('Sends activation email after sign-up', async (done) => {
    await postData()
    const lastEmail = nodeMailerStub.interactsWithMail.lastMail()
    const users = await User.findAll()
    const userToken = users[0].activationToken

    expect(lastEmail.to).toContain(DEFAULT_DATA.email)
    expect(lastEmail.content).toContain(userToken)
    done()
  });
});
