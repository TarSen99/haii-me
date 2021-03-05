const Sequelize = require('sequelize');
const sequelize = require('@/config/database');

const Model = Sequelize.Model;

class UserBan extends Model {}

UserBan.init(
  {
    userOwnerId: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'User owner can not be blank',
        },
      },
    },
    addressedToUserId: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Addressed user can not be blank',
        },
      },
    },
    relativeRequestId: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'relativeRequestId can not be blank',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'userBanes',
  }
);

module.exports = UserBan;
