const pool = require('../config/db');

const getAllMotionData = async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM motiondata
            ORDER BY timestamp DESC
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
    getAllMotionData
};