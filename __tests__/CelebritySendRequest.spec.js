jest.mock('@/middlewares/auth.js');
jest.mock('@/middlewares/userNotFound.js');

const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const User = require('./../src/models/user/User');
const Request = require('./../src/models/request/Request');
const auth = require('@/middlewares/auth.js');
const userNotFound = require('@/middlewares/userNotFound.js');

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

const sendRequest = async (data) => {
  const currData = {
    requestId: 1,
    ...data,
  };

  return request(app).put('/api/1.0/requests/send').send(currData);
};

const declineRequest = async (newData) => {
  const data = {
    ...newData
  };

  return request(app).put('/api/1.0/requests/decline').send(data);
};

describe('Handle celebrity send request', () => {
  it('Request should be sent if video was uploaded', async () => {
    const dueDate = +new Date() + 1000 * 60;

    await createRequest({ toUserId: 2, dueDate: dueDate });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.videoUrl = 'test';
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(200);
  });

  it('Request status should change to done if success', async () => {
    const dueDate = +new Date() + 1000 * 60;

    await createRequest({ toUserId: 2, dueDate: dueDate });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.videoUrl = 'test';
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: req.id,
    });

    const updatedReq = await Request.findOne({
      where: {
        id: req.id
      }
    })

    expect(sendRequestObject.status).toBe(200);
    expect(updatedReq.toJSON().status).toBe(2);
    expect(updatedReq.toJSON().statusAsString).toBe('Done');
  });

  it('Cant approve non existing request', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.videoUrl = null;
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: 10,
    });

    expect(sendRequestObject.status).toBe(404);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'Request is not found'
    );
  });

  it('Should return error if video is not uploaded', async () => {
    const dueDate = +new Date() + 1000 * 60;

    await createRequest({ toUserId: 2, dueDate });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.videoUrl = null;
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(400);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'Video is not uploaded'
    );
  });

  it('Cant approve request if it was declined', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.declined = true;
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(400);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'This request was declined'
    );
  });

  it('Cant approve request if it was sent already', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.isSent = true;
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(400);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'This request was sent already'
    );
  });

  it('Cant send request if it is not for current celebrity', async () => {
    await createRequest({ toUserId: 1 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.declined = true;
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(404);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'Request is not found'
    );
  });

  it('Cant send request if its expire', async () => {
    //date now minus 1 day - so yesterday it expired
    await createRequest({
      toUserId: 2,
      dueDate: new Date() - 1000 * 60 * 60 * 24,
    });
    const reqs = await Request.findAll();
    const req = reqs[0];
    await req.save();

    const sendRequestObject = await sendRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(400);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'This request is deprecated'
    );
  });

  it('Cant decline if it was sent already', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.isSent = true;
    await req.save();

    const sendRequestObject = await declineRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(400);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'Request was sent already'
    );
  });

  it('After decline declined should be true', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    await req.save();

    const sendRequestObject = await declineRequest({
      requestId: req.id,
    });

    const updatedRequest = await Request.findOne({
      where: {
        id: req.id
      }
    })

    expect(sendRequestObject.status).toBe(200);
    expect(updatedRequest.toJSON().declined).toBe(true);
  });

  it('Change status after decline', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    await req.save();

    const sendRequestObject = await declineRequest({
      requestId: req.id,
    });

    const updatedRequest = await Request.findOne({
      where: {
        id: req.id
      }
    })

    expect(sendRequestObject.status).toBe(200);
    expect(updatedRequest.toJSON().status).toBe(3);
    expect(updatedRequest.toJSON().statusAsString).toBe('Declined');
  });

  it('After decline declined should add reason', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    await req.save();

    const sendRequestObject = await declineRequest({
      requestId: req.id,
      reason: 'Bad request'
    });

    const updatedRequest = await Request.findOne({
      where: {
        id: req.id
      }
    })

    expect(sendRequestObject.status).toBe(200);
    expect(updatedRequest.toJSON().declinedReason).toBe('Bad request');
  });

  it('Cant decline if it was declined', async () => {
    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    req.declined = true;
    await req.save();

    const sendRequestObject = await declineRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(400);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'Request was declined already'
    );
  });

  it('Cant decline if it request was addressed to another user', async () => {
    jest.unmock('@/middlewares/auth.js')

    jest.mock('@/middlewares/auth.js');

    auth.mockImplementation((req, res, next) => {
      req.info = { id: 1, email: DEFAULT_EMAIL };
      next();
    });

    await createRequest({ toUserId: 2 });
    const reqs = await Request.findAll();
    const req = reqs[0];
    await req.save();

    const sendRequestObject = await declineRequest({
      requestId: req.id,
    });

    expect(sendRequestObject.status).toBe(404);
    expect(sendRequestObject.body.error.request[0]).toBe(
      'Request not found'
    );
  });
});
