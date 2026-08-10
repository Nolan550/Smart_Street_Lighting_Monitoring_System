const express = require('express');
const router = express.Router();

const { login, getCurrentUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', requireAuth, getCurrentUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;