const pool = require('../config/db');

const getAllStreetLights = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM streetlights
            ORDER BY light_id
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
    getAllStreetLights
};