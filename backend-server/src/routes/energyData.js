const express = require('express');

const router = express.Router();

const {
    getEnergyData
} = require('../controllers/energyController');

router.get('/', getEnergyData);

module.exports = router;