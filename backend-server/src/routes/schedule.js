const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/**
 * GET all schedules with zone name
 */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, z.zone_name
      FROM schedules s
      JOIN zones z ON s.zone_id = z.zone_id
      ORDER BY s.start_time ASC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("GET schedules error:", err.message);
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
});

/**
 * POST new schedule (with duplicate prevention)
 */
router.post("/", async (req, res) => {
  const { zone_id, start_time, end_time, brightness_level } = req.body;

  try {
    // Check for duplicate schedule (same zone + time range)
    const existing = await pool.query(
      `
      SELECT * FROM schedules
      WHERE zone_id = $1
      AND start_time = $2
      AND end_time = $3
      `,
      [zone_id, start_time, end_time]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "A schedule already exists for this zone and time range"
      });
    }

    // Insert new schedule
    const result = await pool.query(
      `
      INSERT INTO schedules (zone_id, start_time, end_time, brightness_level)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [zone_id, start_time, end_time, brightness_level]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("POST schedule error:", err.message);
    res.status(500).json({ error: "Failed to create schedule" });
  }
});

/**
 * UPDATE schedule (brightness/time changes)
 */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { start_time, end_time, brightness_level } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE schedules
      SET start_time = $1,
          end_time = $2,
          brightness_level = $3
      WHERE schedule_id = $4
      RETURNING *
      `,
      [start_time, end_time, brightness_level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("PUT schedule error:", err.message);
    res.status(500).json({ error: "Failed to update schedule" });
  }
});

/**
 * DELETE schedule
 */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM schedules WHERE schedule_id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    res.json({ message: "Schedule deleted successfully" });

  } catch (err) {
    console.error("DELETE schedule error:", err.message);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
});

module.exports = router;

// Debug log (optional)
console.log("SCHEDULE ROUTE LOADED");