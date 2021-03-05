const User = require('@/models/user/User');
const Request = require('@/models/request/Request.js');
const Video = require('@/models/video/Video.js');

const {
  MEDIA_TYPES_KEYS,
  VIDEO_TYPE,
  VIDEO_OPTIMIZED,
} = require('@/config/constants.js');

const { madeErr, handleSchemaError } = require('@/helpers/buildErrors');

const {
  getPresignedUrl,
  getFullFilePath,
  getName,
  getFileRelativePath,
  deleteObject,
} = require('@/services/Aws.js');
const { runOptimizeVideo } = require('@/services/OptimizeVideoService.js');

const getCurrVideoInstance = async (data) => {
  let videoAlreadyUploaded;

  try {
    await Video.update(
      {
        assignedUrl: data.assignedUrl,
        name: data.name,
        fileType: data.fileType,
        originalUrl: getFullFilePath(data.relativePath),
      },
      {
        where: {
          requestId: data.requestId,
        },
      }
    );

    videoAlreadyUploaded = await Video.findOne({
      where: {
        requestId: data.requestId,
      },
    });
  } catch (e) {
    console.log('Request doesnt exist yet');
  }

  if (videoAlreadyUploaded) {
    return videoAlreadyUploaded;
  }

  const video = await Video.create({
    userId: data.userId,
    name: data.name,
    fileType: data.fileType,
    originalUrl: data.originalUrl,
    requestId: data.requestId,
  });

  return video;
};

const getVideoUrl = async (req, res, next) => {
  const { id } = req.info;
  const { requestId } = req.query;
  const headers = req.headers;
  const type = headers['content-type'];

  let request;

  try {
    request = await Request.findOne({
      where: {
        id: +requestId,
        toUserId: id,
      },
    });
  } catch (e) {
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

  let videoFileType;

  try {
    videoFileType = type.split('/')[1];
  } catch (e) {
    return res.status(400).json({
      'Content-type': 'Please provide Content-type header',
    });
  }

  const fileName = getName();
  const relativePath = getFileRelativePath(videoFileType, VIDEO_TYPE, fileName);

  const assignedUrl = await getPresignedUrl(relativePath).catch((err) => {
    res.status(400).json(err);
  });

  if (!assignedUrl) {
    return next(
      madeErr()
        .setStatus(400)
        .setField('assignedUrl')
        .setMessage('Error with assigned url')
        .v()
    );
  }

  const currVideo = await getCurrVideoInstance({
    userId: id,
    name: fileName,
    fileType: videoFileType,
    originalUrl: getFullFilePath(relativePath),
    requestId: requestId,
    assignedUrl,
    relativePath,
  });

  return res.status(200).json({
    success: true,
    assignedUrl,
    currVideo: currVideo.toJSON(),
  });
};

const videoUploaded = async (req, res, next) => {
  const { videoId } = req.query;
  const { id } = req.info;

  let video;

  try {
    video = await Video.findOne({
      where: {
        id: videoId,
        userId: id,
      },
    });
  } catch (e) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('video')
        .setMessage('Video not found')
        .v()
    );
  }

  if (!video) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('video')
        .setMessage('Video not found')
        .v()
    );
  }

  const FILE_TYPE = 'mp4';

  const optimizedRelativePath = getFileRelativePath(
    FILE_TYPE,
    VIDEO_OPTIMIZED,
    video.name
  );

  video.isUploaded = true;
  video.optimizedUrl = getFullFilePath(optimizedRelativePath);
  video.optimizedFileType = FILE_TYPE;

  await video.save();

  try {
    await runOptimizeVideo({
      src: video.originalUrl,
      vid: video.name,
    });
  } catch (e) {
    return next(
      madeErr()
        .setStatus(404)
        .setField('video')
        .setMessage('Error with video service')
        .v()
    );
  }

  return res.status(200).json({
    success: true,
    url: video.originalUrl,
    videoData: video.toJSON(),
  });
};

const videoOptimized = async (req, res, next) => {
  const { videoName } = req.params;

  let video;

  try {
    video = await Video.findOne({
      where: {
        name: videoName,
      },
    });
  } catch (e) {
    console.log('Video optimize error');
    console.log(e);

    return res.status(400).json({});
  }

  if (!video) {
    console.log('Video optimize error');
    return res.status(400).json({});
  }

  video.isOptimized = true;

  await video.save()

  return res.status(200).json({});
};

module.exports = {
  getVideoUrl,
  videoUploaded,
  videoOptimized
};
