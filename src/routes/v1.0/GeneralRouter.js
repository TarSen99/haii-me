const express = require('express');
const { getCategories } = require('@/controllers/category/Categories.js');
const getCelebrities = require('@/controllers/celebrities/CelebritiesList.js');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/celebrities', getCelebrities);

module.exports = router;
