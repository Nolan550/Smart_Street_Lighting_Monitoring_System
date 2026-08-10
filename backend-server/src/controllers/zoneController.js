// backend-server/src/controllers/zoneController.js
const pool = require("../config/db");
const mqttClient = require("../mqtt/mqttClient");

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

// POST /api/zones — create a new zone (Administrator only)
const createZone = async (req, res) => {
  const { zone_name, description } = req.body;

  if (!zone_name || !zone_name.trim()) {
    return res.status(400).json({ error: "zone_name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO zones (zone_name, description)
       VALUES ($1, $2)
       RETURNING zone_id, zone_name, description`,
      [zone_name.trim(), description?.trim() || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // unique_violation, in case zone_name is unique
      return res.status(409).json({ error: "A zone with this name already exists" });
    }
    console.error("Create zone error:", error);
    res.status(500).json({ error: "Failed to create zone" });
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
// This both updates the database (for the UI) AND publishes an MQTT
// command to the physical nodes, so the hardware actually overrides
// its own darkness/motion sensor logic — not just the dashboard number.
const toggleZone = async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'on' or 'off'

  if (!action || !["on", "off"].includes(action.toLowerCase())) {
    return res.status(400).json({ error: "Action must be 'on' or 'off'" });
  }

  const normalizedAction = action.toUpperCase(); // "ON" or "OFF"
  const newStatus = action.toLowerCase() === "on" ? "Online" : "Offline";
  const newBrightness = action.toLowerCase() === "on" ? 100 : 0;

  try {
    await pool.query(
      "UPDATE streetlights SET status = $1, brightness = $2 WHERE zone_id = $3",
      [newStatus, newBrightness, id]
    );

    // Publish the override command to this zone's MQTT command topic.
    // Node firmware listens on streetlight/zone{id}/command and will
    // force the light ON/OFF regardless of its local sensors until
    // it receives an "AUTO" command to resume automatic behavior.
    const commandTopic = `streetlight/zone${id}/command`;
    const payload = JSON.stringify({ command: normalizedAction });

    mqttClient.publish(commandTopic, payload, (err) => {
      if (err) {
        console.error(`Failed to publish MQTT command to ${commandTopic}:`, err.message);
      } else {
        console.log(`Published to ${commandTopic}: ${payload}`);
      }
    });

    res.json({
      success: true,
      message: `Zone ${id} turned ${normalizedAction}`,
      status: newStatus,
    });
  } catch (error) {
    console.error("Toggle zone error:", error);
    res.status(500).json({ error: "Failed to toggle zone" });
  }
};

// DELETE /api/zones/:id — delete a zone (Administrator only)
// Blocked if lights are still assigned to it, to avoid orphaning data.
const deleteZone = async (req, res) => {
  const { id } = req.params;

  try {
    const lightCheck = await pool.query(
      "SELECT COUNT(*) FROM streetlights WHERE zone_id = $1",
      [id]
    );

    const scheduleCheck = await pool.query(
      "SELECT COUNT(*) FROM schedules WHERE zone_id = $1",
      [id]
    );

    const lightCount = parseInt(lightCheck.rows[0].count, 10);
    const scheduleCount = parseInt(scheduleCheck.rows[0].count, 10);

    if (lightCount > 0 || scheduleCount > 0) {
      const parts = [];
      if (lightCount > 0) parts.push(`${lightCount} light(s)`);
      if (scheduleCount > 0) parts.push(`${scheduleCount} schedule(s)`);

      return res.status(409).json({
        error: `Cannot delete this zone — ${parts.join(' and ')} still reference it. Reassign or remove them first.`
      });
    }

    const result = await pool.query(
      "DELETE FROM zones WHERE zone_id = $1 RETURNING zone_id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Zone not found" });
    }

    res.json({ success: true, message: "Zone deleted successfully" });

  } catch (error) {
    console.error("Delete zone error:", error);
    res.status(500).json({ error: "Failed to delete zone" });
  }
};

module.exports = { getAllZones, createZone, updateZoneBrightness, toggleZone, deleteZone };