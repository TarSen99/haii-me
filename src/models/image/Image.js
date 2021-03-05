const Sequelize = require('sequelize');
const sequelize = require('@/config/database');

const Model = Sequelize.Model;

class Image extends Model {}

Image.init(
  {
    name: {
      type: Sequelize.STRING,
    },
    originalUrl: {
      type: Sequelize.STRING,
    },
    optimizedUrl: {
      type: Sequelize.STRING,
    },
    fileType: {
      type: Sequelize.STRING,
    },
    userId: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'User can not be blank',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'images',
  }
);

module.exports = Image;
