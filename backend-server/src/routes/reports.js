const express = require('express');
const router = express.Router();

const {
    getReports,
    generateReport
} = require('../controllers/reportController');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Any logged-in user can view reports
router.get('/', requireAuth, getReports);

// Only Administrators can generate new reports
router.post('/generate', requireAuth, requireRole('Administrator'), generateReport);

module.exports = router;