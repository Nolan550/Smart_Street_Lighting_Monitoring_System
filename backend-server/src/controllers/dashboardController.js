
const pool = require("../config/db");

const getDashboardStats = async (req, res) => {
  try {

    const totalLightsResult =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM streetlights
      `);

    const activeLightsResult =
      await pool.query(`
        SELECT COUNT(*) AS active
        FROM streetlights
        WHERE LOWER(status)='online'
      `);

    const offlineLightsResult =
      await pool.query(`
        SELECT COUNT(*) AS offline
        FROM streetlights
        WHERE LOWER(status)='offline'
      `);

    const faultyLightsResult =
      await pool.query(`
        SELECT COUNT(*) AS faulty
        FROM streetlights
        WHERE LOWER(status)='faulty'
      `);

    const energyResult =
      await pool.query(`
        SELECT
        COALESCE(
          SUM(energy),
          0
        ) AS total_energy
        FROM energy_data
      `);

    const savingsResult =
      await pool.query(`
        SELECT
        COALESCE(
          SUM(
            before_consumption -
            after_consumption
          ),
          0
        ) AS total_savings
        FROM energyreports
      `);

    const brightnessResult =
      await pool.query(`
        SELECT
        COALESCE(
          AVG(brightness),
          0
        ) AS avg_brightness
        FROM streetlights
      `);

    const motionResult =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM motiondata
        WHERE motion_detected=true
        AND timestamp >
        NOW() - INTERVAL '10 minutes'
      `);

    res.json({

      totalLights:
        Number(
          totalLightsResult.rows[0].total
        ),

      activeLights:
        Number(
          activeLightsResult.rows[0].active
        ),

      offlineLights:
        Number(
          offlineLightsResult.rows[0].offline
        ),

      faultyLights:
        Number(
          faultyLightsResult.rows[0].faulty
        ),

      energyConsumption:
        Number(
          energyResult.rows[0].total_energy
        ).toFixed(2),

      energySavings:
        Number(
          savingsResult.rows[0].total_savings
        ).toFixed(2),

      averageBrightness:
        Math.round(
          brightnessResult.rows[0]
          .avg_brightness
        ),

      motionDetection:
        Number(
          motionResult.rows[0].total
        ) > 0
          ? "Active"
          : "Inactive"
    });

  }
  catch (error) {

  console.error("Dashboard alerts error:", error);

  res.status(500).json({
    error: error.message
  });
  }
};
const getRecentAlerts = async (req,res)=>{

  try{

    const result =
      await pool.query(`
        SELECT
          fault_id,
          light_id,
          fault_type,
          reported_at
        FROM faults
        ORDER BY reported_at DESC
        LIMIT 5
      `);

    res.json(result.rows);

  }
  catch(error){

    console.error(error);

    res.status(500).json({
      error:error.message
    });

  }

};

module.exports = {
  getDashboardStats,
  getRecentAlerts
};