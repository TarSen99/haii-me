const requireFullProfile = require('@/middlewares/requireFullProfile.js')

const next = jest.fn();

beforeEach(() => {
  next.mockClear()
})

describe('requireFullProfile', () => {
  const json = jest.fn()

  const res = {
    status() {
      return {
        json
      }
    }
  }
  const req = {
    info: {
      user: {
        signUpStep: 3
      }
    }
  }

  it('requireFullProfile should call next', () => {
    requireFullProfile(req, res, next)

    expect(next).toBeCalledTimes(1)
  })

  it('requireFullProfile shouldnt call next when signUpStep < 3', () => {
    req.info.user.signUpStep = 2
    requireFullProfile(req, res, next)

    expect(next).toBeCalledTimes(0)
  })

  it('requireFullProfile should call status with 403 when signUpStep < 3', () => {
    req.info.user.signUpStep = 2
    const spy = jest.spyOn(res, 'status');

    requireFullProfile(req, res, next)

    expect(spy).toHaveBeenCalled();
    expect(spy).toBeCalledWith(403);
  })

  it('requireFullProfile should call status.json() when signUpStep < 3', () => {
    req.info.user.signUpStep = 2
    requireFullProfile(req, res, next)

    expect(json).toHaveBeenCalled();
  })
})