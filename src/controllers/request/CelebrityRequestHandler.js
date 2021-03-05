const User = require('@/models/user/User');
const UserBan = require('@/models/user/UserBan.js');
const Video = require('@/models/video/Video.js');
const Request = require('@/models/request/Request.js');
const { madeErr } = require('@/helpers/buildErrors');

const {
  IN_PROGRESS_STATUS,
  DONE_STATUS,
  REJECTED_STATUS,
} = require('@/config/constants.js');


const viewRequest = async (req, res, next) => {
  const { id: requestId } = req.params;
  const { id: userId } = req.info;

  const request = await Request.findOne({
    where: {
      id: requestId,
    },
    include: Video
  });

  if (!request) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('request')
        .setMessage('Request is not found')
        .v()
    );
  }

  const requestData = request.toJSON();

  if (requestData.toUserId !== userId) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('request')
        .setMessage('Request is not found')
        .v()
    );
  }

  return res.status(200).json({
    success: true,
    ...requestData,
  });
};

const sendRequest = async (req, res, next) => {
  const { requestId } = req.body;
  const { id: currUserId } = req.info;

  const request = await Request.findOne({
    where: {
      id: requestId,
      toUserId: currUserId,
    },
    include: Video
  });

  if (!request) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('request')
        .setMessage('Request is not found')
        .v()
    );
  }

  if (request.isSent) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('request')
        .setMessage('This request was sent already')
        .v()
    );
  }

  if (request.declined) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('request')
        .setMessage('This request was declined')
        .v()
    );
  }

  const currDate = +Date.now();

  if (+new Date(request.dueDate) < currDate) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('request')
        .setMessage('This request is deprecated')
        .v()
    );
  }

  if (!request.video || !request.video.isUploaded) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('request')
        .setMessage('Video is not uploaded')
        .v()
    );
  }

  request.status = DONE_STATUS
  request.isSent = true

  await request.save()

  return res.status(200).json({
    success: true,
  });
};

const createBan = async (
  { userOwnerId, addressedToUserId, relativeRequestId },
  next
) => {
  const alreadyExistingBan = await UserBan.findOne({
    where: {
      userOwnerId,
      addressedToUserId,
    },
  });

  if (alreadyExistingBan) {
    return alreadyExistingBan;
  }

  const ban = await UserBan.create({
    userOwnerId,
    addressedToUserId,
    relativeRequestId,
  }).catch((err) => {
    next(err);
  });

  return ban;
};

const declineRequest = async (req, res, next) => {
  const { requestId, reason, preventNewRequests } = req.body;
  const { id } = req.info;

  let request;

  try {
    request = await Request.findOne({
      where: {
        id: requestId,
        toUserId: id,
      },
    });
  } catch (err) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('request')
        .setMessage('Request not found')
        .v()
    );
  }

  if (!request) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('request')
        .setMessage('Request not found')
        .v()
    );
  }

  const requestData = request.toJSON();

  if (requestData.declined) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('request')
        .setMessage('Request was declined already')
        .v()
    );
  }

  if (requestData.isSent) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('request')
        .setMessage('Request was sent already')
        .v()
    );
  }

  request.declined = true;
  request.declinedReason = reason;
  request.status = REJECTED_STATUS;

  if (preventNewRequests) {
    const ban = await createBan(
      {
        userOwnerId: id,
        addressedToUserId: request.fromUserId,
        relativeRequestId: request.id,
      },
      next
    );

    if (!ban) {
      return;
    }
  }

  await request.save();

  return res.status(200).json({
    success: true,
  });
};

module.exports = {
  viewRequest,
  sendRequest,
  declineRequest,
};
