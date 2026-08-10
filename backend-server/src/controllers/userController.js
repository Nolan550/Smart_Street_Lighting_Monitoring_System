const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// GET /api/users
// Admin-only. Lists all accounts (never returns password_hash).
const getAllUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT user_id, full_name, email, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/users
// Admin-only. Creates a new account with a temporary password.
// Body: { full_name, email, role, temporary_password }
const createUser = async (req, res) => {
    const { full_name, email, role, temporary_password } = req.body;

    const allowedRoles = ['Administrator', 'Infrastructure Engineer', 'Maintenance Engineer'];

    if (!full_name || !email || !role || !temporary_password) {
        return res.status(400).json({ error: 'full_name, email, role, and temporary_password are required' });
    }

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: `role must be one of: ${allowedRoles.join(', ')}` });
    }

    if (temporary_password.length < 6) {
        return res.status(400).json({ error: 'Temporary password must be at least 6 characters' });
    }

    try {
        const password_hash = await bcrypt.hash(temporary_password, 10);

        const result = await pool.query(`
            INSERT INTO users (full_name, email, password_hash, role, must_change_password)
            VALUES ($1, $2, $3, $4, TRUE)
            RETURNING user_id, full_name, email, role, is_active, created_at
        `, [full_name.trim(), email.toLowerCase().trim(), password_hash, role]);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(409).json({ error: 'A user with this email already exists' });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/users/me/password
// Any logged-in user. Changes their own password.
// Body: { current_password, new_password }
const changeOwnPassword = async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'current_password and new_password are required' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    try {
        const result = await pool.query(
            `SELECT password_hash FROM users WHERE user_id = $1`,
            [req.user.user_id]
        );

        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const matches = await bcrypt.compare(current_password, user.password_hash);

        if (!matches) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(new_password, 10);

        await pool.query(
            `UPDATE users
             SET password_hash = $1, must_change_password = FALSE
             WHERE user_id = $2`,
            [newHash, req.user.user_id]
        );

        res.json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/users/me/keep-password
// Any logged-in user. Chooses to keep their temporary password —
// just clears the "must change" flag so they aren't prompted again.
const keepCurrentPassword = async (req, res) => {
    try {
        await pool.query(
            `UPDATE users SET must_change_password = FALSE WHERE user_id = $1`,
            [req.user.user_id]
        );

        res.json({ message: 'Preference saved. You can change your password anytime later.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/users/:id
// Admin-only. Blocked if: deleting yourself, deleting the last
// Administrator, or the user has resolved faults linked to them
// (in that case, deactivate instead to preserve history).
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const targetId = parseInt(id, 10);

    if (targetId === req.user.user_id) {
        return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    try {
        const targetResult = await pool.query(
            `SELECT role FROM users WHERE user_id = $1`,
            [targetId]
        );

        const target = targetResult.rows[0];

        if (!target) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (target.role === 'Administrator') {
            const adminCount = await pool.query(
                `SELECT COUNT(*) FROM users WHERE role = 'Administrator'`
            );

            if (parseInt(adminCount.rows[0].count, 10) <= 1) {
                return res.status(409).json({ error: 'Cannot delete the last remaining Administrator.' });
            }
        }

        const faultCheck = await pool.query(
            `SELECT COUNT(*) FROM faults WHERE resolved_by = $1`,
            [targetId]
        );

        const faultCount = parseInt(faultCheck.rows[0].count, 10);

        if (faultCount > 0) {
            return res.status(409).json({
                error: `Cannot delete this user — they've resolved ${faultCount} fault(s), which are part of the fault history. Deactivate the account instead to keep that history intact.`
            });
        }

        await pool.query(`DELETE FROM users WHERE user_id = $1`, [targetId]);

        res.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/users/:id/deactivate
// Admin-only. Alternative to deleting — keeps the account and its
// history intact but blocks them from logging in.
const setUserActiveStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active (true/false) is required' });
    }

    if (parseInt(id, 10) === req.user.user_id) {
        return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    try {
        const result = await pool.query(
            `UPDATE users SET is_active = $1 WHERE user_id = $2 RETURNING user_id, full_name, is_active`,
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PUT /api/users/:id
// Admin-only. Edits full_name, email, and role.
// Blocked from demoting the last remaining Administrator away from
// the role, for the same reason deletion is blocked.
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, role } = req.body;

    const allowedRoles = ['Administrator', 'Infrastructure Engineer', 'Maintenance Engineer'];

    if (!full_name || !email || !role) {
        return res.status(400).json({ error: 'full_name, email, and role are required' });
    }

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ error: `role must be one of: ${allowedRoles.join(', ')}` });
    }

    try {
        const currentResult = await pool.query(
            'SELECT role FROM users WHERE user_id = $1',
            [id]
        );

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentRole = currentResult.rows[0].role;

        if (currentRole === 'Administrator' && role !== 'Administrator') {
            const adminCount = await pool.query(
                `SELECT COUNT(*) FROM users WHERE role = 'Administrator'`
            );

            if (parseInt(adminCount.rows[0].count, 10) <= 1) {
                return res.status(409).json({
                    error: 'Cannot change this user\'s role — they are the last remaining Administrator.'
                });
            }
        }

        const result = await pool.query(
            `UPDATE users
             SET full_name = $1, email = $2, role = $3
             WHERE user_id = $4
             RETURNING user_id, full_name, email, role, is_active, created_at`,
            [full_name.trim(), email.toLowerCase().trim(), role, id]
        );

        res.json(result.rows[0]);

    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A user with this email already exists' });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    changeOwnPassword,
    keepCurrentPassword,
    deleteUser,
    setUserActiveStatus
};