jest.mock('@/services/AuthService.js');
jest.mock('@/helpers/buildErrors.js');

const Auth = require('@/middlewares/auth.js');
const { verifyToken } = require('@/services/AuthService.js');
const { madeErr, buildErrors } = require('@/helpers/buildErrors.js');

describe('Auth', () => {
  const json = jest.fn()
  const next = jest.fn();

  beforeEach(() => {
    next.mockClear()
  })

  const res = {
    status() {
      return {
        json
      }
    }
  }

  const req = {
    cookies: {
      auth: 'test'
    }
  }

  it('Auth should call next if token is valid', () => {
    verifyToken.mockReturnValue(true);

    Auth(req, res, next)

    expect(next).toBeCalledTimes(1)
  })

  it('Auth should call madeErr if token is invalid', () => {
    verifyToken.mockReturnValue(false);
    madeErr.mockReturnValue({v: () => {
      return {
        ...res
      }
    }})

    Auth(req, res, next)

    expect(madeErr).toBeCalledTimes(1)
  })
})