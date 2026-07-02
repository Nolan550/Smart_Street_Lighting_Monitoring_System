// backend-server/src/routes/zones.js
const express = require("express");
const router = express.Router();
const {
  getAllZones,
  updateZoneBrightness,
  toggleZone,
} = require("../controllers/zoneController");

// GET /api/zones
router.get("/", getAllZones);

// PUT /api/zones/:id/brightness
router.put("/:id/brightness", updateZoneBrightness);

// PUT /api/zones/:id/toggle
router.put("/:id/toggle", toggleZone);

module.exports = router;