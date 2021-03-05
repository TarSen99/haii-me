const User = require('@/models/user/User');
const { madeErr, buildErrors } = require('@/helpers/buildErrors.js');

module.exports = async (req, res, next) => {
  const { id } = req.info;
  let user;

  try {
    user = await User.findOne({ where: { id } });
  } catch (e) {
    const err = madeErr(401, 'user', 'Token is invalid').v();

    return res.status(err.status).json(buildErrors(err));
  }

  if (!user) {
    const err = madeErr(401, 'user', 'Token is invalid').v();

    return res.status(err.status).json(buildErrors(err));
  }

  req.info.user = user.toJSON();

  next();
};
