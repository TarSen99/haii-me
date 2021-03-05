const User = require('@/models/user/User');
const Category = require('@/models/category/Category.js');

const { SIGN_UP_STEPS } = require('@/config/constants.js');
const { madeErr, handleSchemaError } = require('@/helpers/buildErrors');
const {
  StepOneSchemaCelebrity,
  StepOneSchemaSimple,
} = require('@/validators/user/StepOne.js');

const stepOne = async (req, res, next) => {
  const { id } = req.info;

  const user = await User.findOne({
    where: {
      id,
    },
  });

  if (!user) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('user')
        .setMessage("User doen't exist")
        .v()
    );
  }

  if (user.signUpStep > SIGN_UP_STEPS.STEP_1) {
    return next(
      madeErr()
        .setStatus(403)
        .setField('user')
        .setMessage('This step has been already filled')
        .v()
    );
  }

  if (user.signUpStep < SIGN_UP_STEPS.STEP_1) {
    return next(
      madeErr()
        .setStatus(403)
        .setField('user')
        .setMessage('Please verify your account')
        .v()
    );
  }

  const isCelebrity = user.spendMoney;

  try {
    if (isCelebrity) {
      await StepOneSchemaCelebrity.validate(req.body, { abortEarly: false });
    } else {
      await StepOneSchemaSimple.validate(req.body, { abortEarly: false });
    }
  } catch (err) {
    return handleSchemaError(err, next);
  }

  const {
    name,
    category,
    availableForBusinessRequest = false,
    pricePerVideo,
    pricePerVideoBusiness = null,
    description,
    currency,
  } = req.body;

  user.name = name;
  user.signUpStep = SIGN_UP_STEPS.STEP_2;
  user.description = description;

  if (isCelebrity) {
    user.category = category;
    user.availableForBusinessRequest = availableForBusinessRequest;
    user.pricePerVideo = pricePerVideo;
    user.pricePerVideoBusiness = pricePerVideoBusiness;
    user.currency = currency;
  }

  await user.save();

  res.status(200).json({
    success: true,
  });
};

const stepTwo = async (req, res, next) => {
  const { id } = req.info;
  const { categories = []} = req.body;

  const user = await User.findOne({
    where: {
      id,
    },
  });

  if (!user) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('user')
        .setMessage("User doen't exist")
        .v()
    );
  }

  if (user.signUpStep < SIGN_UP_STEPS.STEP_2) {
    return next(
      madeErr()
        .setStatus(403)
        .setField('user')
        .setMessage('Please finish previous step')
        .v()
    );
  }

  if (user.signUpStep > SIGN_UP_STEPS.STEP_2) {
    return next(
      madeErr()
        .setStatus(403)
        .setField('user')
        .setMessage('This step is already done')
        .v()
    );
  }

  try {
    await user.addCategories(categories)
  } catch {
    return next(
      madeErr()
        .setStatus(403)
        .setField('user')
        .setMessage('This step is already done')
        .v()
    );
  }

  user.signUpStep = SIGN_UP_STEPS.STEP_3

  await user.save()

  res.status(200).json({
    success: true,
  });
};

module.exports = {
  stepOne,
  stepTwo,
};
