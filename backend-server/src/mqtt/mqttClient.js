const mqtt = require('mqtt');
const pool = require('../config/db');

// MQTT Broker
const client = mqtt.connect('mqtt://172.20.10.3:1883');

// Subscribe to all node topics (must match ESP32)
const topics = [
  'smartlight/node1',
  'smartlight/node2',
  'smartlight/node3'
];

// Map topic to light_id
const topicToLightId = {
  'smartlight/node1': 1,
  'smartlight/node2': 2,
  'smartlight/node3': 3,
};

// Distance (cm) below which a light node is considered to have detected
// presence/motion. Matches DISTANCE_THRESHOLD_CM on the ESP32 firmware.
const MOTION_DISTANCE_THRESHOLD_CM = 10.0;

// How often (ms) an energy_data row is written, per light. Motion is
// no longer throttled (see below) — this only applies to energy now.
const DB_WRITE_INTERVAL_MS = 20000;

// Tracks, per light_id, the last time an energy row was written —
// used both to decide whether 20s has passed, and to calculate a real
// elapsed-time energy figure instead of assuming a fixed interval.
const lastWrite = {}; // { [light_id]: { ms: number } }

client.on('connect', () => {
  console.log('====================================');
  console.log('MQTT Broker Connected');
  console.log('====================================');

  topics.forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`Subscribed to ${topic}`);
      }
    });
  });
});

client.on('message', async (topic, message) => {

  let data;

  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    console.error('JSON Parse Error:', err);
    return;
  }

  const light_id = topicToLightId[topic];

  if (!light_id) {
    console.warn('Unknown Topic:', topic);
    return;
  }

  console.log('\n==============================');
  console.log(`Message from Node ${light_id}`);
  console.log(data);
  console.log('==============================');

  //---------------------------------------------------
  // Normalize light state once, reused everywhere below.
  // Firmware sends "ON", "DIM", or "OFF" in data.light.
  //---------------------------------------------------
  const lightState = (data.light || '').toUpperCase();
  const isPowered = lightState === 'ON' || lightState === 'DIM';

  const status = isPowered ? 'Online' : 'Offline';
  const brightness =
    lightState === 'ON' ? 100 :
    lightState === 'DIM' ? 20 :
    0;

  const motionDetected =
    typeof data.distance === 'number' && data.distance <= MOTION_DISTANCE_THRESHOLD_CM;

  try {

    //---------------------------------------------------
    // 1. Update live streetlight status/brightness — every message,
    // no throttling, so the dashboard stays responsive in real time.
    //---------------------------------------------------
    await pool.query(
      `
      UPDATE streetlights
      SET
          status=$1,
          brightness=$2
      WHERE light_id=$3
      `,
      [
        status,
        brightness,
        light_id
      ]
    );

    //---------------------------------------------------
    // 2. Motion is written on EVERY message, unthrottled — a real
    // detection only lasts an instant, so throttling this to 20s
    // (like energy) was silently dropping most motion events before
    // they ever reached the database.
    //---------------------------------------------------
    await pool.query(
      `
      INSERT INTO motiondata
      (
        light_id,
        motion_detected,
        distance,
        dark,
        timestamp
      )
      VALUES ($1,$2,$3,$4,NOW())
      `,
      [
        light_id,
        motionDetected,
        data.distance ?? null,
        data.dark ?? false
      ]
    );

    //---------------------------------------------------
    // 3. Energy stays throttled to once every DB_WRITE_INTERVAL_MS
    // per light, since it's slow-changing and high-frequency writes
    // here would just bloat the table without adding useful signal.
    //---------------------------------------------------
    const now = Date.now();
    const prev = lastWrite[light_id];
    const dueForWrite = !prev || (now - prev.ms) >= DB_WRITE_INTERVAL_MS;

    if (dueForWrite) {

      const elapsedSeconds = prev
        ? (now - prev.ms) / 1000
        : (DB_WRITE_INTERVAL_MS / 1000);

      const power = data.power ?? 0;

      // energy (kWh) = power (W) * time (h) / 1000
      const energyKwh = (power * (elapsedSeconds / 3600)) / 1000;

      await pool.query(
        `
        INSERT INTO energy_data
        (
          light_id,
          voltage,
          current,
          power,
          energy,
          recorded_at
        )
        VALUES ($1,$2,$3,$4,$5,NOW())
        `,
        [
          light_id,
          data.voltage ?? 0,
          data.current ?? 0,
          power,
          energyKwh
        ]
      );

      lastWrite[light_id] = { ms: now };

      console.log(`Logged energy for Node ${light_id} (+${energyKwh.toFixed(5)} kWh)`);
    }

    //---------------------------------------------------
    // 4. Fault Detection
    //---------------------------------------------------

    if (isPowered && Number(data.voltage) === 0) {

      const existing = await pool.query(
        `
        SELECT fault_id
        FROM faults
        WHERE
            light_id=$1
        AND fault_type='no_voltage'
        AND status='Open'
        `,
        [light_id]
      );

      if (existing.rows.length === 0) {

        await pool.query(
          `
          INSERT INTO faults
          (
            light_id,
            fault_type,
            status,
            reported_at
          )
          VALUES
          (
            $1,
            'no_voltage',
            'Open',
            NOW()
          )
          `,
          [light_id]
        );

        console.log(`Fault recorded for Light ${light_id}`);
      }
    }

    console.log(`Database updated successfully for Node ${light_id}`);

  }
  catch (err) {

    console.log('\n========= DATABASE ERROR =========');
    console.error(err);
    console.log('==================================\n');

  }

});

client.on('error', (err) => {
  console.error('MQTT Error:', err);
});

module.exports = client;