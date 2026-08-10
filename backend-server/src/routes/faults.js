const express = require('express');
const router = express.Router();

const {
    getActiveFaults,
    getAllFaults,
    resolveFault
} = require('../controllers/faultController');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/active', requireAuth, getActiveFaults);
router.get('/', requireAuth, getAllFaults);
router.patch('/:id/resolve', requireAuth, requireRole('Maintenance Engineer'), resolveFault);

module.exports = router;