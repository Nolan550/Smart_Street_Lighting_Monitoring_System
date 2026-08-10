const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    createUser,
    updateUser,
    changeOwnPassword,
    keepCurrentPassword,
    deleteUser,
    setUserActiveStatus
} = require('../controllers/userController');

const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Admin-only: manage accounts
router.get('/', requireAuth, requireRole('Administrator'), getAllUsers);
router.post('/', requireAuth, requireRole('Administrator'), createUser);
router.put('/:id', requireAuth, requireRole('Administrator'), updateUser);
router.delete('/:id', requireAuth, requireRole('Administrator'), deleteUser);
router.patch('/:id/deactivate', requireAuth, requireRole('Administrator'), setUserActiveStatus);

// Any logged-in user: manage their own password
router.patch('/me/password', requireAuth, changeOwnPassword);
router.patch('/me/keep-password', requireAuth, keepCurrentPassword);

module.exports = router;