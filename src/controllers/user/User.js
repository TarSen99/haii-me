const User = require('@/models/user/User');
const { madeErr } = require('@/helpers/buildErrors');
const { setToken } = require('@/services/AuthService.js')
const { SIGN_UP_STEPS } = require('@/config/constants.js');

const signUp = async (req, res, next) => {
  const { email, password, spendMoney = false } = req.body;
  const emailFormatted = email && email.toLowerCase();

  const user = await User.create({
    email: emailFormatted,
    password: password,
    spendMoney
  }).catch(function (err) {
    next(err);
  });

  // if user was not created of validation errors
  // don't continue
  if (!user) {
    return;
  }

  const data = user.toJSON();

  delete data.password;

  if(process.env.NODE_ENV === 'production') {
    delete data.activationToken;
  }

  res.status(201).json({
    success: true,
    ...data,
  });
};

const verify = async (req, res, next) => {
  const { token } = req.params;

  const userToVerify = await User.findOne({
    where: {
      activationToken: token,
    },
  });

  if (!userToVerify) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('token')
        .setMessage('Token is not valid')
        .v()
    );
  }

  if (userToVerify.isActivated) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('token')
        .setMessage('Token is not valid')
        .v()
    );
  }

  userToVerify.isActivated = true;
  userToVerify.activationToken = null;
  userToVerify.signUpStep = SIGN_UP_STEPS.STEP_1;
    
  setToken({ email: userToVerify.email, id: userToVerify.id }, res)

  await userToVerify.save();

  res.status(200).json({
    success: true,
  });
};

module.exports = {
  signUp,
  verify,
};
