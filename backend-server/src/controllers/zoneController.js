// backend-server/src/controllers/zoneController.js
const pool = require("../config/db");

// GET /api/zones — get all zones with their light stats
const getAllZones = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        z.zone_id,
        z.zone_name,
        z.description,
        COUNT(s.light_id) AS total_lights,
        COUNT(CASE WHEN LOWER(s.status) = 'online' THEN 1 END) AS active_lights,
        COALESCE(AVG(CASE WHEN LOWER(s.status) = 'online' THEN s.brightness END), 0) AS avg_brightness
      FROM zones z
      LEFT JOIN streetlights s ON z.zone_id = s.zone_id
      GROUP BY z.zone_id, z.zone_name, z.description
      ORDER BY z.zone_id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Get zones error:", error);
    res.status(500).json({ error: "Failed to fetch zones" });
  }
};

// PUT /api/zones/:id/brightness — update brightness for all lights in a zone
const updateZoneBrightness = async (req, res) => {
  const { id } = req.params;
  const { brightness } = req.body;

  if (brightness === undefined || brightness < 0 || brightness > 100) {
    return res.status(400).json({ error: "Brightness must be between 0 and 100" });
  }

  try {
    await pool.query(
      "UPDATE streetlights SET brightness = $1 WHERE zone_id = $2",
      [brightness, id]
    );
    res.json({ success: true, message: `Brightness updated to ${brightness}% for zone ${id}` });
  } catch (error) {
    console.error("Update brightness error:", error);
    res.status(500).json({ error: "Failed to update brightness" });
  }
};

// PUT /api/zones/:id/toggle — turn all lights in a zone ON or OFF
const toggleZone = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'on' or 'off'

  if (!action || !["on", "off"].includes(action.toLowerCase())) {
    return res.status(400).json({ error: "Action must be 'on' or 'off'" });
  }

  const newStatus = action.toLowerCase() === "on" ? "Online" : "Offline";
  const newBrightness = action.toLowerCase() === "on" ? 100 : 0;

  try {
    await pool.query(
      "UPDATE streetlights SET status = $1, brightness = $2 WHERE zone_id = $3",
      [newStatus, newBrightness, id]
    );
    res.json({
      success: true,
      message: `Zone ${id} turned ${action.toUpperCase()}`,
      status: newStatus,
    });
  } catch (error) {
    console.error("Toggle zone error:", error);
    res.status(500).json({ error: "Failed to toggle zone" });
  }
};

module.exports = { getAllZones, updateZoneBrightness, toggleZone };