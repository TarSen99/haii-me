const request = require('supertest');
const app = require('../src/app');

const sequelize = require('../src/config/database');
const User = require('./../src/models/user/User');
const Request = require('./../src/models/request/Request');

const DEFAULT_EMAIL = 'test@test.com';
const DEFAULT_PASSWORD = 'test@test.com';

const createUsers = async () => {
  const simpleUser = await User.create({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
  }); //will have id 1

  const celebrityUser = await User.create({
    email: DEFAULT_EMAIL + 'celebrity',
    password: DEFAULT_PASSWORD,
    spendMoney: true,
    signUpStep: 3,
    price: 100,
    currency: 'UAN'
  }); //will have id 2

  return { simpleUser, celebrityUser };
};

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(async () => {
  await sequelize.query("UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='users'");

  await User.destroy({ truncate: true, restartIdentity: true });
  await Request.destroy({ truncate: true, restartIdentity: true });

  await createUsers()
});

jest.mock('@/middlewares/auth.js', () =>
  jest.fn((req, res, next) => {
    req.info = { id: 1, email: DEFAULT_EMAIL };
    next();
  })
);

jest.mock('@/middlewares/userNotFound.js', () =>
  jest.fn((req, res, next) => {
    req.info.user = { signUpStep: 3 };
    next();
  })
);

const createRequest = async (data = {}) => {
  const DEFAULT_REQUEST_DATA = {
    to: 'John',
    from: 'Taras',
    instructions: 'Please may him all the best to his birthday',
    category: 'Congratulations with birthday',
    email: 'john@mail.com',
    toUserId: 2,
    fromUserId: 1,
    dueDate: new Date,
    type: 1,
    currency: 'UAN',
    price: 100,
    ...data
  };

  const req = await Request.create({
    ...DEFAULT_REQUEST_DATA
  })

  return req
}

describe('Request for celebrity', () => {
  const getData = (id) => {
    return request(app).get(`/api/1.0/requests/view-from-customer/${id}`).send();
  };

  it('Return 404 if request is not found', async () => {
    const request = await getData(1)
    
    expect(request.status).toBe(404)
    expect(request.body.error.request[0]).toBe('Request is not found')
  })

  it('Return 404 if request is not addressed to current celebrity', async () => {
    await createRequest({toUserId: 2})

    const viewRequest = await getData(1)

    expect(viewRequest.status).toBe(404)
    expect(viewRequest.body.error.request[0]).toBe('Request is not found')
  })

  it('View request if its addressed to current user (celebrity)', async () => {
    const auth = require('@/middlewares/auth.js');
    auth.mockImplementation((req, res, next) => {
      req.info = { id: 2, email: DEFAULT_EMAIL };
      next();
    });

    await createRequest({toUserId: 2})
    const reqs = await Request.findAll()
    const req = reqs[0]

    const viewRequest = await getData(req.id)

    expect(viewRequest.status).toBe(200)
    expect(Object.keys(viewRequest.body).length > 2).toBeTruthy();
  })
});
