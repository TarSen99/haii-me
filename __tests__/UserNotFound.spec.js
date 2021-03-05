jest.mock('@/models/user/User');
jest.mock('@/helpers/buildErrors.js');

const { madeErr, buildErrors } = require('@/helpers/buildErrors.js');
const userNotFound = require('@/middlewares/userNotFound.js')
const User = require('@/models/user/User');

madeErr.mockImplementation(() => {
  return {
    v() {
      return {
        status: 1,
      }
    }
  }
})

describe('UserNotFound', () => {
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
    info: {
      id: 1
    },
  }

  const user = {
    toJSON() {
      return {

      }
    }
  }

  it('Sould call next if founds user', async () => {
    User.findOne.mockResolvedValue(user)
    await userNotFound(req, res, next)

    expect(next).toBeCalledTimes(1)
  })

  it('Made err should be called if user not found', async () => {
    User.findOne.mockRejectedValue(res)
    await userNotFound(req, res, next)

    expect(json).toBeCalledTimes(1)
  })
})