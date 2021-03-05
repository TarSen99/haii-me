const User = require('@/models/user/User');
const Request = require('@/models/request/Request.js');
const UserBan = require('@/models/user/UserBan.js');
const { madeErr } = require('@/helpers/buildErrors');
const { VIDEO_TYPES } = require('@/config/constants.js');
const { SIGN_UP_STEPS } = require('@/config/constants.js');
const replacePathInError = require('@/helpers/replacePathInError.js');
const DAYS_TO_EXPIRE_REQUEST = 3;
const DEFAULT_STATUS = 1;

const createRequest = async (req, res, next) => {
  const { id, user } = req.info;
  const {
    toUserId,
    type,
    to,
    from,
    instructions,
    category,
    email,
    forMe = false,
  } = req.body;

  if (user.signUpStep < SIGN_UP_STEPS.STEP_3) {
    return next(
      madeErr()
        .setStatus(403)
        .setField('user')
        .setMessage('Please complete your profile')
        .v()
    );
  }

  if (+id === +toUserId) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('toUserId')
        .setMessage('You can not send request to yourself')
        .v()
    );
  }

  const toUserDetailsModel = await User.findOne({ where: { id: toUserId } });

  const banForThisUser = await UserBan.findOne({
    where: {
      userOwnerId: toUserId,
      addressedToUserId: id
    }
  })

  if(banForThisUser) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('request')
        .setMessage("You can not send request to this user")
        .v()
    );
  }

  if (!toUserDetailsModel) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('toUserId')
        .setMessage("Such celebrity doesn't exist")
        .v()
    );
  }

  const toUserDetails = toUserDetailsModel.toJSON();

  if (toUserDetails.signUpStep < SIGN_UP_STEPS.STEP_3) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('toUserId')
        .setMessage("Such celebrity doesn't exist")
        .v()
    );
  }

  if (!toUserDetails.spendMoney) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('toUserId')
        .setMessage("Such celebrity doesn't exist")
        .v()
    );
  }

  const dateNow = +new Date();
  const dueDate = dateNow + 1000 * 60 * 60 * 24 * DAYS_TO_EXPIRE_REQUEST;

  const isBusiness = type === VIDEO_TYPES.BUSINESS_TYPE;

  if (!toUserDetails.availableForBusinessRequest && isBusiness) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('type')
        .setMessage("This celebrity doesn't support business request")
        .v()
    );
  }

  const price = isBusiness
    ? toUserDetails.pricePerVideoBusiness
    : toUserDetails.pricePerVideo;

  const requestData = {
    price: price,
    currency: toUserDetails.currency,
    dueDate: dueDate,
    fromUserId: id,
    toUserId: toUserDetails.id,
    type: type,
    status: DEFAULT_STATUS,
    to,
    from,
    instructions,
    category,
    email,
    forMe,
  };

  const request = await Request.create(requestData).catch((err) => {
    const newErr = replacePathInError(err, [
      ['toRequiredOnlyIfForMeIsFalse', 'to'],
    ]);

    next(newErr);
  });

  if (!request) {
    return;
  }

  res.status(201).json({
    success: true,
    ...request.toJSON(),
  });
};

module.exports = {
  createRequest,
};
