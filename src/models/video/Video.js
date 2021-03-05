const Sequelize = require('sequelize');
const sequelize = require('@/config/database');

const Model = Sequelize.Model;

class Video extends Model {}

Video.init(
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
    optimizedFileType: {
      type: Sequelize.STRING,
    },
    isUploaded: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    isOptimized: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
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
    requestId: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Request can not be blank',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'videos',
  }
);

module.exports = Video;
