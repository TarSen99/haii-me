const request = require('supertest');
const app = require('@/app');
const sequelize = require('@/config/database');
const User = require('@/models/user/User');

const DEFAULT_DATA = {
  email: 'test@test.com',
  password: 'Taras123456',
};
jest.mock('@/middlewares/auth.js', () =>
  jest.fn((req, res, next) => {
    req.info = { id: 1, email: DEFAULT_DATA.email };
    next();
  })
);

const agent = request.agent(app);

beforeAll(() => {
  return sequelize.sync();
});

beforeEach(async () => {
  await sequelize.query("UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='users'");

  return await User.destroy({ truncate: true, restartIdentity: true });
});

const USER_ADD_CELEBRITY_DATA = {
  name: 'Taras Seniv',
  category: 'Blogger',
  availableForBusinessRequest: true,
  pricePerVideo: 100,
  pricePerVideoBusiness: 1000,
  description: 'Hello world',
  currency: 'UAN',
};

const USER_ADD_SIMPLE_DATA = {
  name: 'Taras Seniv',
  description: 'Hello world',
};

const checkCelebrity = (updatedUser) => {
  const data = updatedUser.toJSON();
  expect(data.name).toBe(USER_ADD_CELEBRITY_DATA.name);
  expect(data.category).toBe(USER_ADD_CELEBRITY_DATA.category);
  expect(data.pricePerVideo).toBe(USER_ADD_CELEBRITY_DATA.pricePerVideo);
  expect(data.pricePerVideoBusiness).toBe(
    USER_ADD_CELEBRITY_DATA.pricePerVideoBusiness
  );
  expect(data.currency).toBe(USER_ADD_CELEBRITY_DATA.currency);
  expect(data.availableForBusinessRequest).toBe(
    USER_ADD_CELEBRITY_DATA.availableForBusinessRequest
  );
  expect(data.description).toBe(USER_ADD_CELEBRITY_DATA.description);
};

const checkSimple = (updatedUser) => {
  const data = updatedUser.toJSON();

  expect(data.name).toBe(USER_ADD_SIMPLE_DATA.name);
  expect(data.description).toBe(USER_ADD_SIMPLE_DATA.description);
};

const findUser = async () => {
  return await User.findOne({
    where: {
      email: DEFAULT_DATA.email,
    },
  });
};

describe('User registration', () => {
  const postData = (user, data = {}) => {
    let currData = {};
    if (user.spendMoney) {
      currData = { ...USER_ADD_CELEBRITY_DATA, ...data };
    } else {
      currData = { ...USER_ADD_SIMPLE_DATA, ...data };
    }

    return agent.post(`/api/1.0/users/sign-up/step-1`).send(currData);
  };

  it('Post step 1 data to celebrity user', async (done) => {
    await User.create(DEFAULT_DATA);

    const user = await findUser();

    user.isActivated = true;
    user.spendMoney = true;
    user.signUpStep = 1;

    await user.save();
    await postData(user);

    const updatedUser = await findUser();

    checkCelebrity(updatedUser);

    done();
  });

  it('Post step 1 data to simple user', async (done) => {
    await User.create(DEFAULT_DATA);

    const user = await findUser();

    user.isActivated = true;
    user.signUpStep = 1;

    await user.save();
    await postData(user);

    const updatedUser = await findUser();

    checkSimple(updatedUser);

    done();
  });

  it('After post step should be 2', async (done) => {
    await User.create(DEFAULT_DATA);

    const user = await findUser();

    user.isActivated = true;
    user.signUpStep = 1;

    await user.save();
    await postData(user);

    const updatedUser = await findUser();

    expect(updatedUser.signUpStep).toBe(2);

    done();
  });

  it.each`
    field              | value   | expectedMsg
    ${'name'}          | ${null} | ${'validation error'}
    ${'category'}      | ${null} | ${'validation error'}
    ${'pricePerVideo'} | ${null} | ${'validation error'}
    ${'currency'}      | ${null} | ${'validation error'}
    ${'description'}   | ${null} | ${'validation error'}
  `(
    'Celebrity user returns $expectedMsg when $field is $value',
    async ({ field, value }) => {
      await User.create(DEFAULT_DATA);

      const user = await findUser();

      user.isActivated = true;
      user.signUpStep = 1;
      user.spendMoney = true;

      await user.save();

      const req = await postData(user, {
        [field]: value,
      });

      expect(req.status).toBe(400);
    }
  );

  it.each`
    field            | value   | expectedMsg
    ${'name'}        | ${null} | ${'validation error'}
    ${'description'} | ${null} | ${'validation error'}
  `(
    'Simple user returns $expectedMsg when $field is $value',
    async ({ field, value }) => {
      await User.create(DEFAULT_DATA);

      const user = await findUser();

      user.isActivated = true;
      user.signUpStep = 1;

      await user.save();

      const req = await postData(user, {
        [field]: value
      });

      expect(req.status).toBe(400);
    }
  );
});
