const pool = require('../config/db');

// GET /api/energy_data
// Raw readings, most recent first, limited so the "Recent Records"
// table stays readable instead of rendering thousands of rows.
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
            ORDER BY recorded_at DESC
            LIMIT 20
        `);

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: error.message
        });
    }
};

// GET /api/energy_data/summary?interval=hour|day|week|month
// Aggregated buckets across all lights, at whatever granularity the
// person picks. Raw per-reading data (every ~20s) produces far too
// many points to render meaningfully, so the charts always plot one
// of these aggregated views instead.
const getEnergySummary = async (req, res) => {

    const allowedIntervals = ['hour', 'day', 'week', 'month'];
    const interval = allowedIntervals.includes(req.query.interval)
        ? req.query.interval
        : 'hour';

    try {

        const result = await pool.query(`
            SELECT
                date_trunc('${interval}', recorded_at) AS bucket,
                AVG(voltage) AS avg_voltage,
                AVG(current) AS avg_current,
                AVG(power) AS avg_power,
                SUM(energy) AS total_energy
            FROM energy_data
            GROUP BY bucket
            ORDER BY bucket ASC
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
    getEnergyData,
    getEnergySummary
};