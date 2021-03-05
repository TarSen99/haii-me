jest.mock('@/middlewares/auth.js');
jest.mock('@/middlewares/userNotFound.js');

const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('./../src/models/user/User');
const Request = require('./../src/models/request/Request');
const UserBan = require('./../src/models/user/UserBan.js');
const auth = require('@/middlewares/auth.js');
const userNotFound = require('@/middlewares/userNotFound.js');
const createRequestToDb = require('@/../test_helpers/createRequest.js');

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
    currency: 'UAN',
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
  await UserBan.destroy({ truncate: true, restartIdentity: true });

  await createUsers();
});

auth.mockImplementation((req, res, next) => {
  req.info = { id: 2, email: DEFAULT_EMAIL };
  next();
});

userNotFound.mockImplementation((req, res, next) => {
  req.info.user = { signUpStep: 3 };
  next();
});

const createRequest = async (data = {}) => {
  const DEFAULT_REQUEST_DATA = {
    to: 'John',
    from: 'Taras',
    instructions: 'Please may him all the best to his birthday',
    category: 'Congratulations with birthday',
    email: 'john@mail.com',
    toUserId: 2,
    fromUserId: 1,
    dueDate: new Date(),
    type: 1,
    currency: 'UAN',
    price: 100,
    ...data,
  };

  const req = await Request.create({
    ...DEFAULT_REQUEST_DATA,
  });

  return req;
};

const declineRequest = async (newData) => {
  const data = {
    ...newData,
  };

  return request(app).put('/api/1.0/requests/decline').send(data);
};

describe('UserBan', () => {
  it('Creates userBan if preventNewRequests was true', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];

    const sendRequestObject = await declineRequest({
      requestId: req.id,
      preventNewRequests: true,
    });

    const userBan = await UserBan.findOne({
      where: {
        userOwnerId: 2,
        addressedToUserId: 1,
        relativeRequestId: req.id,
      },
    });

    expect(userBan).toBeTruthy();
  });

  it('Cant create more than 1 ban', async () => {
    await createRequest({ toUserId: 2 });
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    const req2 = reqs[1];

    await declineRequest({
      requestId: req.id,
      preventNewRequests: true,
    });

    await declineRequest({
      requestId: req2.id,
      preventNewRequests: true,
    });

    const bans = await UserBan.findAll({
      where: {
        userOwnerId: 2,
        addressedToUserId: 1,
      }
    })

    expect(bans.length).toBe(1);
  });

  it('Cant create new request if user is banned', async () => {
    const req = await createRequest();

    auth.mockImplementation((req, res, next) => {
      req.info = { id: 1, email: DEFAULT_EMAIL };
      next();
    });

    await UserBan.create({
      userOwnerId: 2,
      addressedToUserId: 1,
      relativeRequestId: req.id,
    });

    const HTTPrequestToCreateRequest = await createRequestToDb({
      fromUserId: 1,
      toUserId: 2,
    });

    expect(HTTPrequestToCreateRequest.status).toBe(400);
    expect(HTTPrequestToCreateRequest.body.error.request[0]).toBe(
      'You can not send request to this user'
    );
  });
});
