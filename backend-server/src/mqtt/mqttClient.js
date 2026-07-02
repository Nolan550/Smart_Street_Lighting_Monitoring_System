const mqtt = require('mqtt');
const pool = require('../config/db');

const client = mqtt.connect('mqtt://192.168.0.47:1883');

// Subscribe to all 3 node topics
const topics = ['streetlight/node1', 'streetlight/node2', 'streetlight/node3'];

// Map topic → light_id (must match your streetlights table)
const topicToLightId = {
  'streetlight/node1': 1,
  'streetlight/node2': 2,
  'streetlight/node3': 3,
};

client.on('connect', () => {
  console.log('MQTT broker connected');
  topics.forEach(topic => {
    client.subscribe(topic, (err) => {
      if (err) console.error(`Failed to subscribe to ${topic}:`, err);
      else console.log(`Subscribed to ${topic}`);
    });
  });
});

client.on('message', async (topic, message) => {
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.error('JSON parse error:', err.message);
    return;
  }

  const light_id = topicToLightId[topic];
  if (!light_id) {
    console.warn('Unknown topic:', topic);
    return;
  }

  console.log(`Node ${light_id} data:`, data);

  try {
    // 1. Save motion/presence data
    await pool.query(
      `INSERT INTO motiondata (light_id, motion_detected, distance, dark, timestamp)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        light_id,
        data.light === 'ON',          // motion_detected = true when light is ON
        data.distance ?? null,
        data.dark ?? false,
      ]
    );

    // 2. Save energy data
    await pool.query(
      `INSERT INTO energy_data (light_id, voltage, current, power, energy, recorded_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        light_id,
        data.voltage ?? 0,
        data.current ?? 0,
        data.power   ?? 0,
        0,  // energy (kWh) — PZEM can provide this too if you add it to payload
      ]
    );

    // 3. Update streetlights status and brightness
    const brightness = data.light === 'ON' ? 100 : 30; // 30% when dimmed
    await pool.query(
      `UPDATE streetlights
       SET status = $1, brightness = $2
       WHERE light_id = $3`,
      [
        data.light === 'ON' ? 'active' : 'dimmed',
        brightness,
        light_id,
      ]
    );

    // 4. Auto-detect faults (zero voltage when light should be ON)
    if (data.light === 'ON' && data.voltage === 0) {
      // Check if this fault is already open to avoid duplicates
      const existing = await pool.query(
        `SELECT fault_id FROM faults
         WHERE light_id = $1 AND fault_type = 'no_voltage' AND status = 'open'`,
        [light_id]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO faults (light_id, fault_type, status, reported_at)
           VALUES ($1, 'no_voltage', 'open', NOW())`,
          [light_id]
        );
        console.warn(`Fault logged for light_id ${light_id}: no voltage`);
      }
    }

  } catch (dbErr) {
    console.error(`DB error for light_id ${light_id}:`, dbErr.message);
  }
});

client.on('error', (err) => {
  console.error('MQTT error:', err.message);
});

module.exports = client;