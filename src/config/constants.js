const SECRET_KEY = 'haii_me_APP_MADE_BY_TARAS_SENIV_2021_PRIVATE_ONLY:15:29'
const SIGN_UP_STEPS = {
  STEP_1: 1,
  STEP_2: 2,
  STEP_3: 3,
}

const SIMPLE_TYPE = 1
const BUSINESS_TYPE = 2

const VIDEO_TYPES = {
  SIMPLE_TYPE,
  BUSINESS_TYPE
}

const IMAGES_FOLDER = 'images/';
const VIDEOS_FOLDER = 'videos/';
const OPTIMIZED_VIDEOS = 'optimized-videos/';
const OPTIMIZED_IMAGES = 'optimized-images/';
const BUCKET_NAME = 'haii-me';

const IMAGE_TYPE = 'image'
const VIDEO_TYPE = 'video'
const VIDEO_OPTIMIZED = 'video_optimized'
const IMAGE_OPTIMIZED = 'image_optimized'

const MEDIA_TYPES_KEYS = {
  [IMAGE_TYPE]: IMAGES_FOLDER,
  [VIDEO_TYPE]: VIDEOS_FOLDER,
  [IMAGE_OPTIMIZED]: OPTIMIZED_IMAGES,
  [VIDEO_OPTIMIZED]: OPTIMIZED_VIDEOS,
}

const IN_PROGRESS_STATUS = 1;
const DONE_STATUS = 2;
const REJECTED_STATUS = 3;

const STATUSES = [IN_PROGRESS_STATUS, DONE_STATUS, REJECTED_STATUS];
const STRING_STATUSES = {
  [IN_PROGRESS_STATUS]: 'In progress',
  [DONE_STATUS]: 'Done',
  [REJECTED_STATUS]: 'Declined',
};

module.exports = {
  SECRET_KEY,
  SIGN_UP_STEPS,
  VIDEO_TYPES,
  MEDIA_TYPES_KEYS,
  OPTIMIZED_VIDEOS,
  VIDEO_OPTIMIZED,
  IMAGE_TYPE,
  VIDEO_TYPE,
  IMAGE_OPTIMIZED,
  IN_PROGRESS_STATUS,
  DONE_STATUS,
  REJECTED_STATUS,
  STATUSES,
  STRING_STATUSES,
  BUCKET_NAME,
  VIDEOS_FOLDER
}