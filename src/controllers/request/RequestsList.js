const User = require('@/models/user/User');
const Request = require('@/models/request/Request.js');
const Video = require('@/models/video/Video.js');

const USER_ATTRIBUTES = [
  'id',
  'name',
  'category',
  'pricePerVideo',
  'pricePerVideoBusiness',
  'currency',
  'availableForBusinessRequest',
  'description',
  'imageUrl',
];

const getMadeRequests = async (req, res, next) => {
  const { id } = req.info;

  const madeRequests = await Request.findAll({
    where: {
      fromUserId: id,
    },
    include: [
      {
        association: 'toUser',
        attributes: USER_ATTRIBUTES,
      },
      Video,
    ],
  });

  return res.status(200).json({
    requests: madeRequests,
  });
};

const getIncomingRequests = async (req, res, next) => {
  const { id } = req.info;

  const madeRequests = await Request.findAll({
    where: {
      toUserId: id,
    },
    include: [
      {
        association: 'fromUser',
        attributes: USER_ATTRIBUTES,
      },
      Video,
    ],
  });

  return res.status(200).json({
    requests: madeRequests,
  });
};

module.exports = {
  getMadeRequests,
  getIncomingRequests,
};
