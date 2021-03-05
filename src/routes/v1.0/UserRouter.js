const express = require('express');
const { signUp, verify } = require('@/controllers/user/User.js');
const { stepOne, stepTwo } = require('@/controllers/user/SignUpSteps.js');
const { login } = require('@/controllers/user/Auth.js');
const checkAuth = require('@/middlewares/auth.js');
const userNotFound = require('@/middlewares/userNotFound.js');
const requireFullProfile = require('@/middlewares/requireFullProfile.js');
const {
  getUserOwnDetails,
  updateUserDetails,
  updateImage,
  handleImageWasUploaded,
} = require('@/controllers/user/UserDetails.js');

const router = express.Router();

router.post('/sign-up', signUp);
router.post('/sign-up/step-1', checkAuth, stepOne);
router.post('/sign-up/step-2', checkAuth, stepTwo);
router.get('/verification/:token', verify);
router.post('/login', login);
router.get('/info', checkAuth, userNotFound, getUserOwnDetails);
router.put('/info', checkAuth, userNotFound, requireFullProfile, updateUserDetails);
router.get('/info/image-url', checkAuth, userNotFound, requireFullProfile, updateImage);
router.get('/info/image-uploaded', checkAuth, userNotFound, requireFullProfile, handleImageWasUploaded);

module.exports = router;
