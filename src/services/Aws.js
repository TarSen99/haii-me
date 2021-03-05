const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const {
  MEDIA_TYPES_KEYS,
  IMAGE_TYPE,
  VIDEO_TYPE,
  IMAGE_OPTIMIZED,
  BUCKET_NAME,
  VIDEO_OPTIMIZED,
} = require('@/config/constants.js');
const config = require('config');
const AWS_CONFIG = config.get('s3');

const credentials = {
  secretAccessKey: AWS_CONFIG.secretAccessKey,
  accessKeyId: AWS_CONFIG.accessKeyId,
};

AWS.config.update({
  region: 'eu-central-1',
  credentials,
  signatureVersion: 'v4',
});

// AWS.config.update({region: 'us-west-2'});
const s3 = new AWS.S3();

const EXPIRES = 3600;

const ROOT_PATH = 'https://haii-me.s3.eu-central-1.amazonaws.com/';

const getFileRelativePath = (fileType, type, name) => {
  let folder;

  if (type === IMAGE_TYPE) {
    folder = MEDIA_TYPES_KEYS[IMAGE_TYPE];
  } else if (type === VIDEO_TYPE) {
    folder = MEDIA_TYPES_KEYS[VIDEO_TYPE];
  } else if (type === IMAGE_OPTIMIZED) {
    folder = MEDIA_TYPES_KEYS[IMAGE_OPTIMIZED];
  } else if (type === VIDEO_OPTIMIZED) {
    folder = MEDIA_TYPES_KEYS[VIDEO_OPTIMIZED];
  } else {
    throw new Error('Type is not valid');
  }

  return `${folder}${name}.${fileType}`;
};

const getName = () => {
  return uuidv4();
};

const getPresignedUrl = (relativePath) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: relativePath,
    Expires: EXPIRES,
    ACL: 'public-read',
  };

  return new Promise((res, rej) => {
    s3.getSignedUrl('putObject', params, function (err, url) {
      if (err) {
        rej(err);
        return;
      }

      res(url);
    });
  });
};

const getFullFilePath = (fileRelativePath) => {
  return `${ROOT_PATH}${fileRelativePath}`;
};

const deleteObject = (relativePath) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: relativePath,
  };

  return new Promise((res, rej) => {
    s3.deleteObject(params, function (err, response) {
      if (err) {
        console.log(4444);
        console.log(err);
        rej(err);
        return;
      }

      res(response);
    });
  });
};

module.exports = {
  s3,
  getPresignedUrl,
  getFullFilePath,
  getFileRelativePath,
  getName,
  deleteObject,
};
