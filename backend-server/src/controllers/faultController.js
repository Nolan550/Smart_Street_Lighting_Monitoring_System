const pool = require('../config/db');

// GET /faults/active
const getActiveFaults = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                f.fault_id,
                f.light_id,
                sl.location_area,
                f.fault_type,
                f.status,
                f.reported_at
            FROM faults f
            LEFT JOIN streetlights sl ON f.light_id = sl.light_id
            WHERE f.status = 'Open'
            ORDER BY f.reported_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// GET /faults
const getAllFaults = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                f.fault_id,
                f.light_id,
                sl.location_area,
                f.fault_type,
                f.status,
                f.reported_at,
                f.resolved_at,
                f.resolved_by,
                u.full_name AS resolved_by_name
            FROM faults f
            LEFT JOIN streetlights sl ON f.light_id = sl.light_id
            LEFT JOIN users u ON f.resolved_by = u.user_id
            ORDER BY f.reported_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// PATCH /faults/:id/resolve
// No body needed anymore — resolved_by comes from the logged-in
// user's token (req.user.user_id), set by requireAuth middleware.
const resolveFault = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(`
            UPDATE faults
            SET status = 'Resolved',
                resolved_at = NOW(),
                resolved_by = $1
            WHERE fault_id = $2
            RETURNING *
        `, [req.user.user_id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Fault not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getActiveFaults,
    getAllFaults,
    resolveFault
};