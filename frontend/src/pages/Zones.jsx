// frontend/src/pages/Zones.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";
import ZoneControl from "../components/ZoneControl";
import { useAuth } from "../context/AuthContext";
import "./Zones.css";

function Zones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const canAddZone = user?.role === "Administrator";
  const canDeleteZone = user?.role === "Administrator";

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

  const openAddModal = () => {
    setZoneName("");
    setZoneDescription("");
    setFormError("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddZone = (e) => {
    e.preventDefault();
    setFormError("");

    if (!zoneName.trim()) {
      setFormError("Zone name is required.");
      return;
    }

    setSubmitting(true);

    api
      .post("/zones", {
        zone_name: zoneName.trim(),
        description: zoneDescription.trim(),
      })
      .then(() => {
        setShowAddModal(false);
        fetchZones();
      })
      .catch((err) => {
        setFormError(err.response?.data?.error || "Failed to create zone. Please try again.");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const confirmDeleteZone = () => {
    if (!zoneToDelete) return;

    setDeleting(true);
    setDeleteError("");

    api.delete(`/zones/${zoneToDelete.zone_id}`)
      .then(() => {
        setZoneToDelete(null);
        fetchZones();
      })
      .catch((err) => {
        setDeleteError(err.response?.data?.error || "Failed to delete zone. Please try again.");
      })
      .finally(() => {
        setDeleting(false);
      });
  };

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
      <div className="zones-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="zones-title">Zone Control</h1>
          <p className="zones-subtitle">
            Manage brightness and power settings for each zone
          </p>
        </div>

        {canAddZone && (
          <button
            onClick={openAddModal}
            style={{
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              background: "#2563eb",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            + Add Zone
          </button>
        )}
      </div>

      {/* Zone Cards Grid */}
      <div className="zones-grid">
        {zones.map((zone) => (
          <ZoneControl
            key={zone.zone_id}
            zone={zone}
            onUpdate={fetchZones}
            canDelete={canDeleteZone}
            onDelete={() => { setDeleteError(""); setZoneToDelete(zone); }}
          />
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

      {/* Add Zone Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={closeAddModal}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              width: "380px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: 700, color: "#111827" }}>
              Add New Zone
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "13px", color: "#6b7280" }}>
              Create a new zone to group street lights under.
            </p>

            {formError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", fontSize: "13px", padding: "10px 12px", borderRadius: "8px", marginBottom: "14px" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleAddZone}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px", display: "block" }}>
                Zone Name
              </label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Zone D"
                autoFocus
                style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "14px", boxSizing: "border-box" }}
              />

              <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px", display: "block" }}>
                Description (optional)
              </label>
              <textarea
                value={zoneDescription}
                onChange={(e) => setZoneDescription(e.target.value)}
                placeholder="e.g. Northern residential area"
                rows={3}
                style={{ width: "100%", padding: "10px 12px", fontSize: "14px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "18px", boxSizing: "border-box", resize: "vertical" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={submitting}
                  style={{ padding: "9px 16px", fontSize: "14px", fontWeight: 600, color: "#374151", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "9px 16px", fontSize: "14px", fontWeight: 600, color: "#ffffff", background: "#2563eb", border: "none", borderRadius: "6px", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Creating…" : "Create Zone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Zone Confirmation */}
      {zoneToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setZoneToDelete(null)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "24px",
              width: "360px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700, color: "#111827" }}>
              Delete "{zoneToDelete.zone_name}"?
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>
              This cannot be undone. If any lights are still assigned to this zone, deletion will be blocked until they're reassigned.
            </p>

            {deleteError && (
              <div style={{ background: "#fee2e2", color: "#dc2626", fontSize: "13px", padding: "10px 12px", borderRadius: "8px", marginBottom: "14px" }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setZoneToDelete(null)}
                disabled={deleting}
                style={{ padding: "9px 16px", fontSize: "14px", fontWeight: 600, color: "#374151", background: "#f3f4f6", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteZone}
                disabled={deleting}
                style={{ padding: "9px 16px", fontSize: "14px", fontWeight: 600, color: "#ffffff", background: "#dc2626", border: "none", borderRadius: "6px", cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? "Deleting…" : "Delete Zone"}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Zones;