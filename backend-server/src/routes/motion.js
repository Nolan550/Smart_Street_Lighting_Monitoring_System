const express = require('express');
const router = express.Router();

const {
    getAllMotionData
} = require('../controllers/motionController');

router.get('/', getAllMotionData);

module.exports = router;