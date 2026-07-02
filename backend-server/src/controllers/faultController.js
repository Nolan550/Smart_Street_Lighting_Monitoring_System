const pool = require('../config/db');

const getAllFaults = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM faults
            ORDER BY reported_at DESC
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });

    }
};

module.exports = {
    getAllFaults
};