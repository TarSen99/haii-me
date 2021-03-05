const express = require('express');
const checkAuth = require('@/middlewares/auth.js');
const userNotFound = require('@/middlewares/userNotFound.js');
const requireFullProfile = require('@/middlewares/requireFullProfile.js');

const { createRequest } = require('@/controllers/request/Request.js');
const {
  viewRequest,
  sendRequest,
  declineRequest,
} = require('@/controllers/request/CelebrityRequestHandler.js');
const {
  getVideoUrl,
  videoUploaded,
  videoOptimized,
} = require('@/controllers/request/UploadVideo.js');

const {
  getMadeRequests,
  getIncomingRequests,
} = require('@/controllers/request/RequestsList.js');

const router = express.Router();

router.post(
  '/request',
  checkAuth,
  userNotFound,
  requireFullProfile,
  createRequest
);
router.get('', checkAuth, userNotFound, requireFullProfile, getMadeRequests);
router.get(
  '/incoming',
  checkAuth,
  userNotFound,
  requireFullProfile,
  getIncomingRequests
);
router.get(
  '/view-from-customer/:id',
  checkAuth,
  userNotFound,
  requireFullProfile,
  viewRequest
);
router.put('/send', checkAuth, userNotFound, requireFullProfile, sendRequest);
router.put(
  '/decline',
  checkAuth,
  userNotFound,
  requireFullProfile,
  declineRequest
);
router.get(
  '/get-presigned-url',
  checkAuth,
  userNotFound,
  requireFullProfile,
  getVideoUrl
);

router.get(
  '/video-uploaded',
  checkAuth,
  userNotFound,
  requireFullProfile,
  videoUploaded
);

router.post(
  '/video-optimized/:videoName',
  checkAuth,
  userNotFound,
  requireFullProfile,
  videoOptimized
);

module.exports = router;
