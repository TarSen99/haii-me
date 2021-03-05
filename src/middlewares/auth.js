const { verifyToken } = require('@/services/AuthService.js');
const { madeErr, buildErrors } = require('@/helpers/buildErrors.js');

module.exports = (req, res, next) => {
  const auth = req.cookies.auth;
  const data = verifyToken(auth);

  if (!data) {
    const err = madeErr(401, 'user', 'Token is invalid').v();
  
    return res.status(err.status).json(buildErrors(err));
  }

  req.info = data;

  next();
};
