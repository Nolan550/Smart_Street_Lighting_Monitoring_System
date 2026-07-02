// frontend/src/pages/Zones.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";
import ZoneControl from "../components/ZoneControl";
import "./Zones.css";

function Zones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchZones = useCallback(() => {
    api
      .get("/zones")
      .then((res) => {
        setZones(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch zones:", err);
        setError("Failed to load zones. Is the backend running?");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  if (loading) {
    return (
      <MainLayout>
        <div className="zones-loading">
          <div className="zones-spinner"></div>
          <p>Loading zones...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="zones-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button onClick={fetchZones} className="zones-retry-btn">
            Retry
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="zones-header">
        <h1 className="zones-title">Zone Control</h1>
        <p className="zones-subtitle">
          Manage brightness and power settings for each zone
        </p>
      </div>

      {/* Zone Cards Grid */}
      <div className="zones-grid">
        {zones.map((zone) => (
          <ZoneControl key={zone.zone_id} zone={zone} onUpdate={fetchZones} />
        ))}
      </div>

      {/* Zone Status Overview Table */}
      <div className="zones-table-card">
        <h3 className="zones-table-title">Zone Status Overview</h3>
        <table className="zones-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Status</th>
              <th>Brightness</th>
              <th>Active Lights</th>
              <th>Total Lights</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => {
              const isOn = parseInt(zone.active_lights) > 0;
              return (
                <tr key={zone.zone_id}>
                  <td>{zone.zone_name}</td>
                  <td>
                    <span className={`zones-badge ${isOn ? "zones-badge-on" : "zones-badge-off"}`}>
                      {isOn ? "ON" : "OFF"}
                    </span>
                  </td>
                  <td>{Math.round(zone.avg_brightness)}%</td>
                  <td>{zone.active_lights}</td>
                  <td>{zone.total_lights}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </MainLayout>
  );
}

export default Zones;
