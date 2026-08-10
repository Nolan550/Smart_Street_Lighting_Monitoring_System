require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const streetlightRoutes = require('./routes/streetlights');
const dashboardRoutes = require('./routes/dashboard');
const energyDataRoutes = require('./routes/energyData');
const faultRoutes = require('./routes/faults');
const motionRoutes = require('./routes/motion');
const reportRoutes = require('./routes/reports');
const zonesRoutes = require('./routes/zones');
const scheduleRoutes = require("./routes/schedule");
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');



// In server.js — add this line so MQTT starts with the server
require('./mqtt/mqttClient');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/streetlights', streetlightRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/energy_data', energyDataRoutes);
app.use('/api/energyreports', reportRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/motion', motionRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/schedule', scheduleRoutes);
app.get('/', (req, res) => {
    res.send('Smart Street Lighting Backend Running');
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);


// Database test route
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({
            success: true,
            databaseTime: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});