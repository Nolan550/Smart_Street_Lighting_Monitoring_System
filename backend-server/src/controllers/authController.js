const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../config/db');
const { sendPasswordResetEmail } = require('../services/emailService');

// POST /auth/login
// Body: { email, password }
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const result = await pool.query(
            `SELECT user_id, full_name, email, password_hash, role, is_active, must_change_password
             FROM users
             WHERE email = $1`,
            [email.toLowerCase().trim()]
        );

        const user = result.rows[0];

        // Same error for "no such user" and "wrong password" on purpose —
        // this stops someone probing which emails exist in the system.
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'This account has been deactivated' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        res.json({
            token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                must_change_password: user.must_change_password
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// GET /auth/me
// Returns the currently logged-in user's info, based on their token.
// Frontend calls this on page load to restore the session.
const getCurrentUser = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT user_id, full_name, email, role, is_active
             FROM users
             WHERE user_id = $1`,
            [req.user.user_id]
        );

        const user = result.rows[0];

        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Account no longer active' });
        }

        res.json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// POST /auth/forgot-password
// Body: { email }
// Always responds with the same generic message, whether or not the
// email exists — this stops someone from using this endpoint to
// discover which emails are registered in the system.
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const genericMessage = { message: 'If that email is registered, a reset link has been sent.' };

    try {
        const userResult = await pool.query(
            'SELECT user_id, full_name, email, is_active FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        const user = userResult.rows[0];

        if (!user || !user.is_active) {
            // Don't reveal whether the account exists.
            return res.json(genericMessage);
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await pool.query(
            `INSERT INTO password_reset_tokens (user_id, token, expires_at)
             VALUES ($1, $2, $3)`,
            [user.user_id, token, expiresAt]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        await sendPasswordResetEmail(user.email, user.full_name, resetLink);

        res.json(genericMessage);

    } catch (error) {
        console.error(error);
        // Still return the generic message even on failure, so the
        // frontend behavior doesn't leak information either way.
        res.json(genericMessage);
    }
};

// POST /auth/reset-password
// Body: { token, new_password }
const resetPassword = async (req, res) => {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
        const tokenResult = await pool.query(
            `SELECT * FROM password_reset_tokens
             WHERE token = $1 AND used = FALSE AND expires_at > NOW()`,
            [token]
        );

        const resetRequest = tokenResult.rows[0];

        if (!resetRequest) {
            return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
        }

        const newHash = await bcrypt.hash(new_password, 10);

        await pool.query(
            `UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE user_id = $2`,
            [newHash, resetRequest.user_id]
        );

        await pool.query(
            `UPDATE password_reset_tokens SET used = TRUE WHERE token_id = $1`,
            [resetRequest.token_id]
        );

        res.json({ message: 'Password reset successfully. You can now log in with your new password.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    login,
    getCurrentUser,
    forgotPassword,
    resetPassword
};