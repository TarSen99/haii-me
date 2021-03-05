const request = require('supertest');
const app = require('../src/app');

const sequelize = require('../src/config/database');
const User = require('./../src/models/user/User');
const {
  madeErr,
  NewError,
  handleSchemaError,
} = require('@/helpers/buildErrors.js');

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

describe('Check testBuilder', () => {
  const DEFAULT_DATA = {
    email: 'test@test.com',
    password: 'Taras123456',
  };

  const postData = (token) => {
    return request(app).get(`/api/1.0/users/verification/${token}`).send();
  };

  it('Return status field if error', async (done) => {
    await User.create(DEFAULT_DATA);

    const request = await postData('test');
    expect(request.status).toBe(400);
    done();
  });

  it('Error field should be as object', async (done) => {
    await User.create(DEFAULT_DATA);

    const request = await postData('test');
    expect(request.body.error).toBeInstanceOf(Object);
    done();
  });

  it('Token field should be as array', async (done) => {
    await User.create(DEFAULT_DATA);

    const request = await postData('test');
    expect(request.body.error.token).toBeInstanceOf(Array);
    done();
  });

  it('Token field should not be empty', async (done) => {
    await User.create(DEFAULT_DATA);

    const request = await postData('test');
    expect(request.body.error.token.length).toBeTruthy();
    done();
  });

  it('Check made Error', () => {
    const newErr = madeErr(400, 'test', 'test msg');

    expect(newErr).toBeInstanceOf(NewError);
    expect(newErr.status).toBe(400);
    expect(newErr.field).toBe('test');
    expect(newErr.message).toBe('test msg');
  });

  it('Check made Error formatted', () => {
    const newErr = madeErr(400, 'test', 'test msg').v();

    expect(newErr).toEqual({
      status: 400,
      errors: [
        {
          path: 'test',
          message: 'test msg',
        },
      ],
    });
  });

  it('Check made Error multiple', () => {
    const TEST_ERRORS = [
      {
        path: 'test',
        message: 'Test msg',
      },
      {
        path: 'test2',
        message: 'Test msg 2',
      },
    ];

    const newErr = madeErr(400).setMultiple(TEST_ERRORS).v();

    expect(newErr).toEqual({
      status: 400,
      errors: TEST_ERRORS,
    });
  });

  it('Check handleSchemaError error multiple', () => {
    const next = jest.fn();

    const RECEIVED_ERROR = {
      status: 400,
      errors: [
        {
          path: 'testField',
          message: 'Test Error',
        },
        {
          path: 'testField1',
          message: 'Test Error1',
        },
      ],
    };

    const err = {
      path: null,
      inner: [
        {
          path: 'testField',
          errors: ['Test Error'],
        },
        {
          path: 'testField1',
          errors: ['Test Error1'],
        },
      ],
    };

    handleSchemaError(err, next);

    expect(next).toBeCalledWith(RECEIVED_ERROR);
  });

  it('Check handleSchemaError error single', () => {
    const next = jest.fn();

    const RECEIVED_ERROR = {
      status: 400,
      errors: [
        {
          path: 'testField',
          message: 'Test Error',
        },
      ],
    };

    const err = {
      path: 'testField',
      errors: ['Test Error']
    };

    handleSchemaError(err, next);

    expect(next).toBeCalledWith(RECEIVED_ERROR);
  });
});
