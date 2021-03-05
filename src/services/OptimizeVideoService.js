var coconut = require('coconutjs');

const config = require('config');
const { BUCKET_NAME, OPTIMIZED_VIDEOS } = require('@/config/constants.js');
const AWS_CONFIG = config.get('s3');
const API_KEY = config.get('coconut');

const bucket = BUCKET_NAME;

const access_key = AWS_CONFIG.accessKeyId;
const secret_key = AWS_CONFIG.secretAccessKey;
const videosFolderWithoutSlash = OPTIMIZED_VIDEOS.slice(
  0,
  OPTIMIZED_VIDEOS.length - 1
);

const s3 = `s3://${access_key}:${secret_key}@${bucket}/${videosFolderWithoutSlash}`;

let webhook = 'https://app.coconut.co/tools/webhooks/f4e1e4e8/taras99if';

const runOptimizeVideo = async ({ src, vid }) => {
  if(process.env.NODE_ENV === 'production') {
    webhook = `https://app.haii-me/videos/video-optimized/${vid}`
  }

  const data = {
    api_key: API_KEY,
    source: src,
    webhook: webhook,
    outputs: {
      mp4: s3 + '/' + vid + '.mp4',
      'jpg:300x': `${s3}/previews/thumb_${vid}.jpg, number=1`,
    },
  };

  return new Promise((resolve, reject) => {
    coconut.createJob(data, function (job) {
      if (job.status == 'processing' || job.status == 'ok') {
        resolve(job);
      } else {
        reject({
          errorCode: job.error_code,
          error: job.error_message,
        });
      }
    });
  });
};

module.exports = {
  runOptimizeVideo,
};
