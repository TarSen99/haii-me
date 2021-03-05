const Sequelize = require('sequelize');
const sequelize = require('@/config/database');
const {
  VIDEO_TYPES,
  IN_PROGRESS_STATUS,
  DONE_STATUS,
  REJECTED_STATUS,
  STATUSES,
  STRING_STATUSES,
} = require('@/config/constants.js');
const Model = Sequelize.Model;

const TYPES = [VIDEO_TYPES.SIMPLE_TYPE, VIDEO_TYPES.BUSINESS_TYPE];

class Request extends Model {}

Request.init(
  {
    price: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Price can not be blank',
        },
      },
    },
    currency: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Currency can not be blank',
        },
      },
    },
    dueDate: {
      type: Sequelize.DATE,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'dueDate can not be blank',
        },
      },
    },
    fromUserId: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'From user can not be blank',
        },
      },
    },
    toUserId: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'To user can not be blank',
        },
      },
    },
    type: {
      type: Sequelize.NUMBER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Type can not be blank',
        },
        checkType(value) {
          const newValue = +value;

          if (!TYPES.includes(newValue)) {
            throw new Error("Such type doen't exist!");
          }
        },
      },
    },
    status: {
      type: Sequelize.NUMBER,
      defaultValue: IN_PROGRESS_STATUS,
      validate: {
        checkStatus(value) {
          const newValue = +value;

          if (!STATUSES.includes(newValue)) {
            throw new Error("Such status doen't exist!");
          }
        },
      },
    },
    statusAsString: {
      type: Sequelize.STRING,
      defaultValue: STRING_STATUSES[IN_PROGRESS_STATUS]
    },
    to: {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        lenMorehan64(v) {
          const currV = v || '';
          if (currV.length > 64) {
            throw new Error('To length cannot be greater than 64 symbols');
          }
        },
      },
    },
    from: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'From can not be blank',
        },
        notLessThan1(v) {
          const currV = (v || '').trim();

          if (currV < 1) {
            throw new Error('From length cannot be less than 1 symbol');
          }
        },
        lenMorehan64(v) {
          if (v.length > 64) {
            throw new Error('From length cannot be greater than 64 symbols');
          }
        },
      },
    },
    instructions: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Instructions can not be blank',
        },
        notLessThan20(v) {
          const currV = (v || '').trim();

          if (currV < 20) {
            throw new Error(
              'Instructions length cannot be less than 20 symbols'
            );
          }
        },
        lenMorehan64(v) {
          if (v.length > 64) {
            throw new Error(
              'Instructions length cannot be greater than 64 symbols'
            );
          }
        },
      },
    },
    category: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Category can not be blank',
        },
        notLessThan5(v) {
          const currV = (v || '').trim().length;

          if (currV < 5) {
            throw new Error('Category length cannot be less than 5 symbols');
          }
        },
        lenMorehan64(v) {
          if (v.length > 64) {
            throw new Error(
              'Category length cannot be greater than 64 symbols'
            );
          }
        },
      },
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      validate: {
        isEmail: {
          msg: 'Email is not valid',
        },
        notNull: {
          msg: 'Email can not be blank',
        },
      },
    },
    forMe: {
      type: Sequelize.BOOLEAN,
    },
    isSent: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    videoUrl: {
      type: Sequelize.STRING,
    },
    videoUrlOptimized: {
      type: Sequelize.STRING,
    },
    declined: {
      type: Sequelize.BOOLEAN,
    },
    declinedReason: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'requests',
    validate: {
      toRequiredOnlyIfForMeIsFalse() {
        const { forMe, to } = this;
        const currTo = to || '';

        if (forMe && currTo.trim()) {
          throw new Error("To shouldn't be specified for own request");
        }

        if (this.forMe) {
          return;
        }

        if (!currTo.trim()) {
          throw new Error('To can not be blank');
        }
      },
    },
    hooks: {
      async beforeSave(instance) {
        instance.statusAsString = STRING_STATUSES[instance.status];
      },
    },
  }
);

module.exports = Request;
