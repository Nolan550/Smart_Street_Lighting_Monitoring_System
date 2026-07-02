import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";
import "./Scheduling.css";

function Scheduling() {
  const [schedules, setSchedules]   = useState([]);
  const [zones, setZones]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [localSchedules, setLocalSchedules] = useState([]);

  // New schedule form state
  const [form, setForm] = useState({
    zone_id:          "",
    start_time:       "06:00",
    end_time:         "22:00",
    brightness_level: 50,
  });

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get("/schedule");
      setSchedules(res.data);
      setLocalSchedules(res.data);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchZones = useCallback(async () => {
    try {
      const res = await api.get("/zones");
      setZones(res.data);
      if (res.data.length > 0) {
        setForm((f) => ({ ...f, zone_id: res.data[0].zone_id }));
      }
    } catch (err) {
      console.error("Failed to fetch zones:", err);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchZones();
  }, [fetchSchedules, fetchZones]);

  // ── Brightness preview colour ──
  const brightnessToColor = (level) => {
    const b = Math.round((level / 100) * 220 + 35);
    return `rgb(${b}, ${b}, ${Math.round(b * 1.15)})`;
  };

  // ── Format time for display ──
  const formatTime = (t) => {
    if (!t) return "--:--";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${String(display).padStart(2, "0")}:${m} ${ampm}`;
  };

  // ── Local slider change (before saving) ──
  const handleLocalBrightness = (scheduleId, value) => {
    setLocalSchedules((prev) =>
      prev.map((s) =>
        s.schedule_id === scheduleId
          ? { ...s, brightness_level: parseInt(value) }
          : s
      )
    );
  };

  // ── Save all changes ──
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(
        localSchedules.map((s) =>
          api.put(`/schedule/${s.schedule_id}`, {
            start_time:       s.start_time,
            end_time:         s.end_time,
            brightness_level: s.brightness_level,
          })
        )
      );
      await fetchSchedules();
      alert("All schedules saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save schedules.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete schedule ──
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await api.delete(`/schedule/${id}`);
      await fetchSchedules();
    } catch (err) {
      console.error(err);
      alert("Failed to delete schedule.");
    }
  };

  // ── Add new schedule ──
  const handleAddSchedule = async () => {
    if (!form.zone_id) return alert("Please select a zone.");
    try {
      await api.post("/schedule", form);
      await fetchSchedules();
      alert("Schedule added!");
    } catch (err) {
      console.error(err);
      alert("Failed to add schedule.");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="sch-loading">
          <div className="sch-spinner"></div>
          <p>Loading schedules...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="sch-header">
        <h1 className="sch-title">Scheduling</h1>
        <p className="sch-subtitle">
          Set automatic brightness schedules for your street lights
        </p>
      </div>

      <div className="sch-layout">
        {/* ── LEFT: Current Schedule table ── */}
        <div className="sch-main">
          <div className="sch-card">
            <h3 className="sch-card-title">Current Schedule</h3>

            <table className="sch-table">
              <thead>
                <tr>
                  <th>Zone</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Brightness</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="sch-empty">
                      No schedules found. Add one using the form →
                    </td>
                  </tr>
                ) : (
                  localSchedules.map((s) => (
                    <tr key={s.schedule_id}>
                      <td className="sch-zone-name">{s.zone_name}</td>
                      <td>
                        <span className="sch-time-badge">
                          🕐 {formatTime(s.start_time)}
                        </span>
                      </td>
                      <td>
                        <span className="sch-time-badge">
                          🕐 {formatTime(s.end_time)}
                        </span>
                      </td>
                      <td className="sch-slider-cell">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={s.brightness_level}
                          onChange={(e) =>
                            handleLocalBrightness(s.schedule_id, e.target.value)
                          }
                          className="sch-slider"
                        />
                        <span className="sch-bright-pct">
                          {s.brightness_level}%
                        </span>
                      </td>
                      <td>
                        <div
                          className="sch-preview-box"
                          style={{
                            backgroundColor: brightnessToColor(
                              s.brightness_level
                            ),
                          }}
                        />
                      </td>
                      <td>
                        <button
                          className="sch-delete-btn"
                          onClick={() => handleDelete(s.schedule_id)}
                          title="Delete schedule"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {localSchedules.length > 0 && (
              <div className="sch-save-row">
                <button
                  className="sch-save-btn"
                  onClick={handleSaveAll}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save All Changes"}
                </button>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="sch-tips">
            <span className="sch-tips-icon">🕐</span>
            <div>
              <strong>Smart Scheduling Tips</strong>
              <p>
                For optimal energy savings, set higher brightness during peak
                hours (18:00–22:00) and lower brightness during late night hours
                (00:00–05:00). The system will automatically interpolate
                brightness levels between scheduled times.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Add New Schedule form ── */}
        <div className="sch-sidebar">
          <div className="sch-card">
            <h3 className="sch-card-title">Add New Schedule</h3>

            {/* Zone select */}
            <label className="sch-label">Zone</label>
            <select
              className="sch-input"
              value={form.zone_id}
              onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
            >
              {zones.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>
                  {z.zone_name}
                </option>
              ))}
            </select>

            {/* Start time */}
            <label className="sch-label">Start Time</label>
            <input
              type="time"
              className="sch-input"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />

            {/* End time */}
            <label className="sch-label">End Time</label>
            <input
              type="time"
              className="sch-input"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />

            {/* Brightness slider */}
            <label className="sch-label">
              Brightness: {form.brightness_level}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.brightness_level}
              onChange={(e) =>
                setForm({ ...form, brightness_level: parseInt(e.target.value) })
              }
              className="sch-slider"
            />

            {/* Preview */}
            <label className="sch-label">Preview</label>
            <div className="sch-preview-row">
              <div
                className="sch-preview-box-lg"
                style={{
                  backgroundColor: brightnessToColor(form.brightness_level),
                }}
              />
              <p className="sch-preview-text">
                From {formatTime(form.start_time)} to{" "}
                {formatTime(form.end_time)}, lights will be at{" "}
                {form.brightness_level}% brightness
              </p>
            </div>

            <button className="sch-add-btn" onClick={handleAddSchedule}>
              + Add Schedule
            </button>
          </div>

          {/* Schedule Info */}
          <div className="sch-info-card">
            <strong>Schedule Info</strong>
            <p>
              Schedules automatically adjust street light brightness based on
              the time of day. The system will smoothly transition between
              scheduled brightness levels.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Scheduling;