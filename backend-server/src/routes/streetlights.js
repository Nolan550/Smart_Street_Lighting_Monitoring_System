const express = require('express');
const router = express.Router();

const {
    getAllStreetLights,
    createStreetLight,
    deleteStreetLight
} = require('../controllers/streetlightController');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');

router.get('/', requireAuth, getAllStreetLights);
router.post('/', requireAuth, requireRole('Infrastructure Engineer'), createStreetLight);
router.delete('/:id', requireAuth, requireRole('Infrastructure Engineer'), deleteStreetLight);

module.exports = router;