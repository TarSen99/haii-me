const Sequelize = require('sequelize');
const sequelize = require('@/config/database');
const { SECRET_KEY } = require('@/config/constants.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendVerificationEmail } = require('@/services/MailService.js');
const Category = require('@/models/category/Category.js');
const Request = require('@/models/request/Request.js');
const Image = require('@/models/image/Image.js');
const Video = require('@/models/video/Video.js');
const UserBan = require('@/models/user/UserBan.js');

const SALT_ROUNDS = 10;

const Model = Sequelize.Model;

class User extends Model {}

User.init(
  {
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: 'Email can not be blank',
        },
        notEmpty: {
          msg: 'Email can not be blank',
        },
        isEmail: {
          msg: 'Email is not valid',
        },
        async isNotUsed(value) {
          const user = await User.findAll({
            where: {
              email: value.toLowerCase(),
            },
          });

          if (user.length) {
            throw new Error('Email is already used');
          }
        },
      },
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Password can not be blank',
        },
        lenLessThan10(v) {
          if (v.length < 10) {
            throw new Error('Password length cannot be less than 10 symbols');
          }
        },
        lenMorehan64(v) {
          if (v.length > 64) {
            throw new Error(
              'Password length cannot be greater than 64 symbols'
            );
          }
        },
        is: {
          args: [/^[0-9a-zA-Z!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]{10,}$/i],
          msg: 'Password is not valid',
        },
      },
    },
    spendMoney: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    isActivated: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    signUpStep: {
      type: Sequelize.NUMBER,
      defaultValue: 0,
    },
    activationToken: {
      type: Sequelize.STRING,
    },
    name: {
      type: Sequelize.STRING,
    },
    category: {
      type: Sequelize.STRING,
    },
    pricePerVideo: {
      type: Sequelize.NUMBER,
    },
    pricePerVideoBusiness: {
      type: Sequelize.NUMBER,
      defaultValue: 0,
    },
    currency: {
      type: Sequelize.STRING,
    },
    availableForBusinessRequest: {
      type: Sequelize.BOOLEAN,
    },
    description: {
      type: Sequelize.STRING,
    },
    imageUrl: {
      type: Sequelize.STRING,
    },
    originalImage: {
      type: Sequelize.STRING,
    },
    optimizedImage: {
      type: Sequelize.STRING,
    },
  },
  {
    modelName: 'user',
    hooks: {
      async beforeCreate(instance) {
        const hashedPassword = await bcrypt.hash(
          instance.password,
          SALT_ROUNDS
        );
        instance.password = hashedPassword;

        const hash = crypto
          .createHmac('sha256', SECRET_KEY)
          .update(instance.email)
          .digest('hex');

        instance.activationToken = hash;

        await sendVerificationEmail({ email: instance.email, hash });
      },
    },
    sequelize,
  }
);

User.belongsToMany(Category, {
  through: 'Users_And_Categories',
  uniqueKey: 'my_custom_unique',
});

User.hasMany(Request, {
  foreignKey: 'toUserId',
  as: 'toUser',
});

User.hasMany(Request, {
  foreignKey: 'fromUserId',
  as: 'fromUser',
});

User.hasMany(Image, {
  foreignKey: 'userId',
});

User.hasMany(UserBan, {
  foreignKey: 'userOwnerId',
});

User.hasMany(UserBan, {
  addressedToUserId: 'addressedToUserId',
});

UserBan.belongsTo(User, {
  foreignKey: 'addressedToUserId',
  as: 'addressedToUserIdAs',
});

UserBan.belongsTo(User, {
  foreignKey: 'userOwnerId',
  as: 'userOwnerIdAs',
});

UserBan.belongsTo(Request, {
  foreignKey: 'relativeRequestId',
});

Request.hasOne(UserBan, {
  foreignKey: 'relativeRequestId',
});

Image.belongsTo(User, {
  foreignKey: 'userId',
});

Video.belongsTo(Request, {
  foreignKey: 'requestId',
});

Request.hasOne(Video, {
  foreignKey: 'requestId',
});

Request.belongsTo(User, {
  foreignKey: 'toUserId',
  as: 'toUser',
});

Request.belongsTo(User, {
  foreignKey: 'fromUserId',
  as: 'fromUser',
});

Category.belongsToMany(User, {
  through: 'Users_And_Categories',
  uniqueKey: 'my_custom_unique',
});

module.exports = User;
