const express = require('express');
const router = express.Router();

const {
    getAllFaults
} = require('../controllers/faultController');

router.get('/', getAllFaults);

module.exports = router;