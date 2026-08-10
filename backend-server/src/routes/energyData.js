const express = require('express');

const router = express.Router();

const {
    getEnergyData,
    getEnergySummary
} = require('../controllers/energyController');

router.get('/summary', getEnergySummary);
router.get('/', getEnergyData);

module.exports = router;