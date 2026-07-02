const express = require('express');
const router = express.Router();

const {
    getReports,
    generateReport
} = require('../controllers/reportController');

router.get('/', getReports);

router.post('/generate', generateReport);

module.exports = router;