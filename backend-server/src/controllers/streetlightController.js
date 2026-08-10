const pool = require('../config/db');

// GET /api/streetlights
const getAllStreetLights = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sl.light_id,
                sl.node_id,
                sl.location_area,
                sl.status,
                sl.brightness,
                z.zone_id,
                z.zone_name
            FROM streetlights sl
            LEFT JOIN zones z ON sl.zone_id = z.zone_id
            ORDER BY sl.light_id
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/streetlights
// Infrastructure Engineer only. Registers a new light node under a zone.
// Body: { node_id, location_area, zone_id }
const createStreetLight = async (req, res) => {
    const { node_id, location_area, zone_id } = req.body;

    if (!node_id || !location_area || !zone_id) {
        return res.status(400).json({ error: 'node_id, location_area, and zone_id are required' });
    }

    try {
        const existing = await pool.query(
            'SELECT light_id FROM streetlights WHERE node_id = $1',
            [node_id]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: `Node ID "${node_id}" is already registered` });
        }

        const result = await pool.query(`
            INSERT INTO streetlights (node_id, location_area, zone_id, status, brightness)
            VALUES ($1, $2, $3, 'Offline', 0)
            RETURNING light_id, node_id, location_area, zone_id, status, brightness
        `, [node_id, location_area.trim(), zone_id]);

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// DELETE /api/streetlights/:id
// Infrastructure Engineer only. Blocked if the light has related
// faults, energy data, motion data, or schedules, to avoid orphaning
// historical records.
const deleteStreetLight = async (req, res) => {
    const { id } = req.params;

    try {
        const checks = await Promise.all([
            pool.query('SELECT COUNT(*) FROM faults WHERE light_id = $1', [id]),
            pool.query('SELECT COUNT(*) FROM energydata WHERE light_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] })),
            pool.query('SELECT COUNT(*) FROM motiondata WHERE light_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] })),
            pool.query('SELECT COUNT(*) FROM schedules WHERE light_id = $1', [id]).catch(() => ({ rows: [{ count: 0 }] })),
        ]);

        const [faultCount, energyCount, motionCount, scheduleCount] = checks.map(
            (r) => parseInt(r.rows[0].count, 10)
        );

        const blockers = [];
        if (faultCount > 0) blockers.push(`${faultCount} fault record(s)`);
        if (energyCount > 0) blockers.push(`${energyCount} energy record(s)`);
        if (motionCount > 0) blockers.push(`${motionCount} motion record(s)`);
        if (scheduleCount > 0) blockers.push(`${scheduleCount} schedule(s)`);

        if (blockers.length > 0) {
            return res.status(409).json({
                error: `Cannot delete this light — it has ${blockers.join(', ')} linked to it.`
            });
        }

        const result = await pool.query(
            'DELETE FROM streetlights WHERE light_id = $1 RETURNING light_id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Light not found' });
        }

        res.json({ success: true, message: 'Light deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllStreetLights,
    createStreetLight,
    deleteStreetLight
};