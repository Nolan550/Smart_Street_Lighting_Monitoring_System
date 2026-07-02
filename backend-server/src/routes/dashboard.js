// routes/dashboard.js

const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
  getRecentAlerts
}
=
require(
  "../controllers/dashboardController"
);

router.get(
  "/stats",
  getDashboardStats
);

router.get(
  "/alerts",
  getRecentAlerts
);

module.exports = router;