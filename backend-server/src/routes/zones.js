// backend-server/src/routes/zones.js
const express = require("express");
const router = express.Router();
const {
  getAllZones,
  createZone,
  updateZoneBrightness,
  toggleZone,
  deleteZone,
} = require("../controllers/zoneController");

const { requireAuth, requireRole } = require("../middleware/authMiddleware");

// GET /api/zones — any logged-in user can view
router.get("/", requireAuth, getAllZones);

// POST /api/zones — Administrator only
router.post("/", requireAuth, requireRole("Administrator"), createZone);

// PUT /api/zones/:id/brightness — Maintenance Engineer only
router.put("/:id/brightness", requireAuth, requireRole("Maintenance Engineer"), updateZoneBrightness);

// PUT /api/zones/:id/toggle — Maintenance Engineer only
router.put("/:id/toggle", requireAuth, requireRole("Maintenance Engineer"), toggleZone);

// DELETE /api/zones/:id — Administrator only
router.delete("/:id", requireAuth, requireRole("Administrator"), deleteZone);

module.exports = router;