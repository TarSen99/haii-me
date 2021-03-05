const { madeErr, buildErrors } = require('@/helpers/buildErrors.js');

module.exports = async (req, res, next) => {
  const { signUpStep } = req.info.user;

  if (signUpStep < 3) {
    const err = madeErr(403, 'user', 'Please complete your profile').v();

    return res.status(err.status).json(buildErrors(err));
  }

  next();
};
