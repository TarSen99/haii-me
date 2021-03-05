const request = require('supertest');
const app = require('../src/app');

const sequelize = require('../src/config/database');
const User = require('./../src/models/user/User');

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

  const login = (dataInput) => {
    const data = {
      ...DEFAULT_DATA,
      ...dataInput
    }
    return request(app).post(`/api/1.0/users/login`).send(data);
  }

  const postData = (token) => {
    return request(app).get(`/api/1.0/users/verification/${token}`).send();
  };

  it('Dont verify user by invalid token', async (done) => {
    await User.create(DEFAULT_DATA)

    const request = await postData('test')
    expect(request.status).toBe(400)
    done()
  });

  it('Verify user by valid token', async (done) => {
    await User.create(DEFAULT_DATA)
    const currUser = await User.findOne({where: {
      email: DEFAULT_DATA.email
    }})
    const token = currUser.activationToken
    const request = await postData(token)

    const updatedUser = await User.findOne({where: {
      email: DEFAULT_DATA.email
    }})

    expect(request.status).toBe(200)
    expect(updatedUser.isActivated).toBe(true)
    done()
  });

  it('set signUpStep as 1 after verification', async (done) => {
    await User.create(DEFAULT_DATA)
    const currUser = await User.findOne({where: {
      email: DEFAULT_DATA.email
    }})

    const token = currUser.activationToken
    await postData(token)

    const updatedUser = await User.findOne({where: {
      email: DEFAULT_DATA.email
    }})

    expect(updatedUser.signUpStep).toBe(1)
    done()
  });

  it('Removes token after activation', async (done) => {
    await User.create(DEFAULT_DATA)
    const currUser = await User.findOne({where: {
      email: DEFAULT_DATA.email
    }})

    const token = currUser.activationToken
    await postData(token)

    const updatedUser = await User.findOne({where: {
      email: DEFAULT_DATA.email
    }})

    expect(updatedUser.activationToken).toBeFalsy()
    done()
  });

  it('Add Auth cookie after activation', async (done) => {
    await User.create(DEFAULT_DATA)
    const currUser = await User.findOne({where: {
      email: DEFAULT_DATA.email
    }})

    const token = currUser.activationToken
    const req = await postData(token)
    const cookieHeader = req.headers['set-cookie']
    const authCookie = cookieHeader.find(item => item.includes('auth='))

    expect(authCookie.length).toBeTruthy()
    done()
  });

  it('Dont login user when credentials are not valid', async (done) => {
    await User.create(DEFAULT_DATA)

    const res = await login({
      email: 'notexist@test.com'
    })

    expect(res.status).toBe(400)
    done()
  });

  it('Show error when login email is not valid', async (done) => {
    await User.create(DEFAULT_DATA)

    const res = await login({
      email: 'notexist@test.com'
    })

    expect(res.body.error.user).toBeTruthy()
    done()
  });

  it('Show error when login password is not valid', async (done) => {
    await User.create(DEFAULT_DATA)

    const res = await login({
      password: 'notexist'
    })

    expect(res.body.error.user).toBeTruthy()
    done()
  });

  it('Dont allow login is user is not activated', async (done) => {
    await User.create(DEFAULT_DATA)

    const res = await login()

    expect(res.status).toBe(403)
    done()
  });

  it('Login user when credentials are valid', async (done) => {
    await User.create(DEFAULT_DATA)
    const user = await User.findOne({
      where: {
        email: DEFAULT_DATA.email
      }
    })

    user.isActivated = true
    await user.save()

    const res = await login()

    expect(res.status).toBe(200)
    done()
  });

  it('Add auth cookie when login is success', async (done) => {
    await User.create(DEFAULT_DATA)
    const user = await User.findOne({
      where: {
        email: DEFAULT_DATA.email
      }
    })

    user.isActivated = true
    await user.save()

    const req = await login()

    const cookieHeader = req.headers['set-cookie']
    const authCookie = cookieHeader.find(item => item.includes('auth='))

    expect(authCookie.length).toBeTruthy()
    done()
  });
});
