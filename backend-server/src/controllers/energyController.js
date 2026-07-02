const pool = require('../config/db');

const getEnergyData = async (req, res) => {
    try {

        const result = await pool.query(`
            SELECT
                energy_id,
                light_id,
                voltage,
                current,
                power,
                energy,
                recorded_at
            FROM energy_data
            ORDER BY recorded_at ASC
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
    getEnergyData
};