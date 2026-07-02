const express = require('express');
const router = express.Router();

const {
    getAllStreetLights
} = require('../controllers/streetlightController');

router.get('/', getAllStreetLights);

module.exports = router;