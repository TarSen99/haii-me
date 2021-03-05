const request = require('supertest');
const app = require('../src/app');

const sequelize = require('../src/config/database');
const User = require('./../src/models/user/User');

const DEFAULT_EMAIL = 'test@test.com';
const DEFAULT_PASSWORD = 'test@test.com';

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(async () => {
  await sequelize.query("UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='users'");

  return await User.destroy({ truncate: true, restartIdentity: true });
});

jest.mock('@/middlewares/auth.js', () =>
  jest.fn((req, res, next) => {
    req.info = { id: 1, email: DEFAULT_EMAIL };
    next();
  })
);

jest.mock('@/middlewares/userNotFound.js', () =>
  jest.fn((req, res, next) => {
    req.info.user = { signUpStep: 1 };
    next();
  })
);

const DEFAULT_REQUEST_DATA = {
  to: 'John',
  from: 'Taras',
  instructions: 'Please may him all the best to his birthday',
  category: 'Congratulations with birthday',
  email: 'john@mail.com',
};

const createUsers = async () => {
  const simpleUser = await User.create({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
  }); //will have id 1

  const celebrityUser = await User.create({
    email: DEFAULT_EMAIL + 'celebrity',
    password: DEFAULT_PASSWORD,
  }); //will have id 2

  return { simpleUser, celebrityUser };
};

describe('Request', () => {
  const DEFAULT_DATA = {
    ...DEFAULT_REQUEST_DATA,
    toUserId: 1,
    type: 1,
  };

  const postData = (data = {}) => {
    const localData = {
      ...DEFAULT_DATA,
      ...data,
    };

    return request(app).post('/api/1.0/requests/request').send(localData);
  };

  it('Returns 404 if user celebrity doesnt exist', (done) => {
    const userNotFound = require('@/middlewares/userNotFound.js');
    userNotFound.mockImplementation((req, res, next) => {
      req.info.user = { signUpStep: 3 };
      next();
    });

    postData({
      toUserId: 100,
    }).then((res) => {
      expect(res.status).toBe(404);
      expect(res.body.error.toUserId[0]).toBe("Such celebrity doesn't exist");
      done();
    });
  });

  it('Returns 400 if user want to send request to himself', async (done) => {
    const user = await User.create({
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
    });

    postData({
      toUserId: user.id,
      type: 1,
    }).then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error.toUserId[0]).toBe(
        'You can not send request to yourself'
      );
      done();
    });
  });

  it('Cant send request if user doesnt finish profile registration', async (done) => {
    const userNotFound = require('@/middlewares/userNotFound.js');
    userNotFound.mockImplementation((req, res, next) => {
      req.info.user = { signUpStep: 2 };
      next();
    });

    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 2;
    celebrityUser.signUpStep = 3;
    await simpleUser.save();
    await celebrityUser.save();

    postData({
      toUserId: celebrityUser.id,
      type: 1,
    }).then((res) => {
      expect(res.status).toBe(403);
      done();
    });
  });

  it('Cant send request if celebrity doesnt finish profile registration', async (done) => {
    const userNotFound = require('@/middlewares/userNotFound.js');
    userNotFound.mockImplementation((req, res, next) => {
      req.info.user = { signUpStep: 3 };
      next();
    });

    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;
    celebrityUser.signUpStep = 2;
    await simpleUser.save();
    await celebrityUser.save();

    postData({
      toUserId: celebrityUser.id,
      type: 1,
    }).then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error.toUserId[0]).toBe("Such celebrity doesn't exist");
      done();
    });
  });

  it('Create request with simple video type', async (done) => {
    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;

    celebrityUser.signUpStep = 3;
    celebrityUser.spendMoney = true;
    celebrityUser.pricePerVideo = 100;
    celebrityUser.currency = 'UAN';

    await simpleUser.save();
    await celebrityUser.save();

    postData({
      toUserId: celebrityUser.id,
      type: 1,
    }).then((res) => {
      expect(res.status).toBe(201);
      done();
    });
  });

  it('Business req should have business price', async (done) => {
    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;

    celebrityUser.signUpStep = 3;
    celebrityUser.spendMoney = true;
    celebrityUser.pricePerVideo = 100;
    celebrityUser.pricePerVideoBusiness = 1000;
    celebrityUser.currency = 'UAN';
    celebrityUser.availableForBusinessRequest = true;

    await simpleUser.save();
    await celebrityUser.save();

    const req = await postData({
      toUserId: celebrityUser.id,
      type: 2,
    });

    expect(req.body.price).toBe(1000);
    done();
  });

  it('Create simple req even if business exists', async (done) => {
    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;

    celebrityUser.signUpStep = 3;
    celebrityUser.spendMoney = true;
    celebrityUser.pricePerVideo = 100;
    celebrityUser.pricePerVideoBusiness = 1000;
    celebrityUser.currency = 'UAN';
    celebrityUser.availableForBusinessRequest = true;

    await simpleUser.save();
    await celebrityUser.save();

    const req = await postData({
      toUserId: celebrityUser.id,
      type: 1,
    });

    expect(req.body.price).toBe(100);
    done();
  });

  it('Due date should be currDate + 3 days', async (done) => {
    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;

    celebrityUser.signUpStep = 3;
    celebrityUser.spendMoney = true;
    celebrityUser.pricePerVideo = 100;
    celebrityUser.currency = 'UAN';

    await simpleUser.save();
    await celebrityUser.save();

    const request = await postData({
      toUserId: celebrityUser.id,
      type: 1,
    });

    const dueDate = +new Date() + 1000 * 60 * 60 * 24 * 3;
    const reqDate = +new Date(request.body.dueDate);

    expect(
      dueDate >= reqDate && dueDate < reqDate + 1000 * 60 //60 seconds error
    ).toBeTruthy();
    done();
  });

  it('Dont create business request if celebrity doesnt support it', async (done) => {
    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;

    celebrityUser.signUpStep = 3;
    celebrityUser.spendMoney = true;
    celebrityUser.pricePerVideo = 100;
    celebrityUser.currency = 'UAN';
    celebrityUser.availableForBusinessRequest = false;

    await simpleUser.save();
    await celebrityUser.save();

    postData({
      toUserId: celebrityUser.id,
      type: 2,
    }).then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error.type[0]).toBe(
        "This celebrity doesn't support business request"
      );
      done();
    });
  });

  it('Dont create request to user which is not celebrity', async (done) => {
    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;

    celebrityUser.signUpStep = 3;
    celebrityUser.spendMoney = false;

    await simpleUser.save();
    await celebrityUser.save();

    postData({
      toUserId: celebrityUser.id,
      type: 1,
    }).then((res) => {
      expect(res.status).toBe(400);
      expect(res.body.error.toUserId[0]).toBe('Such celebrity doesn\'t exist');
      done();
    });
  });

  it('Dont require "to" if forMe is selected', async (done) => {
    const { simpleUser, celebrityUser } = await createUsers();

    simpleUser.signUpStep = 3;

    celebrityUser.signUpStep = 3;
    celebrityUser.spendMoney = true;
    celebrityUser.pricePerVideo = 100;
    celebrityUser.currency = 'UAN';
    celebrityUser.availableForBusinessRequest = false;

    await simpleUser.save();
    await celebrityUser.save();

    postData({
      toUserId: celebrityUser.id,
      type: 1,
      forMe: true,
      to: null
    }).then((res) => {
      expect(res.status).toBe(201);
      done();
    });
  });

  it.each`
    field             | value   | expectedMsg
    ${'to'}           | ${null} | ${'To can not be blank'}
    ${'from'}         | ${null} | ${'From can not be blank'}
    ${'instructions'} | ${null} | ${'Instructions can not be blank'}
    ${'category'}     | ${null} | ${'Category can not be blank'}
    ${'email'}        | ${null} | ${'Email can not be blank'}
  `(
    'Request returns "$expectedMsg" when $field is $value',
    async ({ field, value, expectedMsg }) => {
      const { simpleUser, celebrityUser } = await createUsers();

      simpleUser.signUpStep = 3;
  
      celebrityUser.signUpStep = 3;
      celebrityUser.spendMoney = true;
      celebrityUser.pricePerVideo = 100;
      celebrityUser.currency = 'UAN';
  
      await simpleUser.save();
      await celebrityUser.save();
  
      const req = await postData({
        [field]: value,
        toUserId: celebrityUser.id
      });

      expect(req.status).toBe(400);
      expect(req.body.error[field][0]).toBe(expectedMsg);
    }
  );
});
