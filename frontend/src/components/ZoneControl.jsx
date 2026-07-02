// frontend/src/components/ZoneControl.jsx
import { useState } from "react";
import api from "../services/api";
import "./ZoneControl.css";

function ZoneControl({ zone, onUpdate }) {
  const [brightness, setBrightness] = useState(
    Math.round(zone.avg_brightness) || 0
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const isOn = parseInt(zone.active_lights) > 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/zones/${zone.zone_id}/brightness`, { brightness });
      setLastUpdated(new Date());
      onUpdate();
    } catch (err) {
      console.error("Failed to save brightness:", err);
      alert("Failed to update brightness. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const action = isOn ? "off" : "on";
      await api.put(`/zones/${zone.zone_id}/toggle`, { action });
      setLastUpdated(new Date());
      onUpdate();
    } catch (err) {
      console.error("Failed to toggle zone:", err);
      alert("Failed to toggle zone. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="zc-card">
      {/* Card Header */}
      <div className="zc-card-header">
        <div className="zc-icon-wrap">
          <span className="zc-icon">📍</span>
        </div>
        <div className="zc-zone-info">
          <h3 className="zc-zone-name">{zone.zone_name}</h3>
          <p className="zc-zone-sub">
            {zone.active_lights}/{zone.total_lights} lights active
          </p>
        </div>
        <span className={`zc-status-dot ${isOn ? "zc-dot-on" : "zc-dot-off"}`}></span>
      </div>

      {/* Brightness Slider */}
      <div className="zc-brightness-row">
        <span className="zc-bright-label">Brightness</span>
        <span className="zc-bright-value">{brightness}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={brightness}
        onChange={(e) => setBrightness(Number(e.target.value))}
        className="zc-slider"
        disabled={!isOn}
      />

      {/* Action Buttons */}
      <div className="zc-btn-row">
        <button
          className={`zc-btn zc-btn-toggle ${isOn ? "zc-btn-off" : "zc-btn-on"}`}
          onClick={handleToggle}
          disabled={toggling}
        >
          {toggling ? "..." : isOn ? "⏻  Turn OFF" : "⏻  Turn ON"}
        </button>
        <button
          className="zc-btn zc-btn-save"
          onClick={handleSave}
          disabled={saving || !isOn}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Last Updated */}
      <p className="zc-last-updated">
        Last updated: {lastUpdated.toLocaleTimeString()}
      </p>
    </div>
  );
}

export default ZoneControl;
