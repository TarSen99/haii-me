const bcrypt = require('bcrypt');
const User = require('@/models/user/User');
const { madeErr } = require('@/helpers/buildErrors');
const { setToken } = require('@/services/AuthService.js')

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const emailFormatted = email && email.toLowerCase();

  const user = await User.findOne({
    where: {
      email: emailFormatted
    }
  })

  if(!user) {
    return next(
      madeErr()
      .setStatus(400)
      .setField('user')
      .setMessage('Please check your credentials')
      .v()
    )
  }

  const passwordIsValid = await bcrypt.compare(password, user.password); 

  if(!passwordIsValid) {
    return next(
      madeErr()
      .setStatus(400)
      .setField('user')
      .setMessage('Please check your credentials')
      .v()
    )
  }

  if(!user.isActivated) {
    return next(
      madeErr()
      .setStatus(403)
      .setField('user')
      .setMessage('User is not activated')
      .v()
    )
  }

  setToken({email: user.email, id: user.id}, res)

  const data = user.toJSON();

  delete data.password;
  delete data.activationToken;

  res.status(200).json({
    success: true,
    ...data,
  });
};

module.exports = {
  login
}