import { useEffect, useState } from "react";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";
import "./Dashboard.css";

function Dashboard() {

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const loadDashboard = async () => {

    try {

      const statsResponse =
        await api.get("/dashboard/stats");

      const alertsResponse =
        await api.get("/dashboard/alerts");

      setStats(statsResponse.data);
      setAlerts(alertsResponse.data);

    }
    catch (error) {

      console.error(error);

    }

  };

  useEffect(() => {

    loadDashboard();

    const interval =
      setInterval(
        loadDashboard,
        5000
      );

    return () =>
      clearInterval(interval);

  }, []);

  if (!stats) {

    return (
      <MainLayout>
        <div className="db-loading">
          <div className="db-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </MainLayout>
    );

  }

  return (

    <MainLayout>

      <div className="db-header">

        <h1 className="db-title">
          Dashboard Overview
        </h1>

        <p className="db-subtitle">
          Real-time monitoring of your smart street lighting system
        </p>

      </div>

      {/* KPI CARDS */}

      <div className="db-kpi-grid">

        <div className="db-kpi-card">
          <div
            className="db-kpi-icon"
            style={{ backgroundColor: "#f5f6f8" }}
          >
            💡
          </div>

          <p className="db-kpi-label">
            Total Lights
          </p>

          <h2 className="db-kpi-value">
            {stats.totalLights}
          </h2>
        </div>

        <div className="db-kpi-card">
          <div
            className="db-kpi-icon"
            style={{ backgroundColor: "#fafbfa" }}
          >
            🟢
          </div>

          <p className="db-kpi-label">
            Active Lights
          </p>

          <h2 className="db-kpi-value">
            {stats.activeLights}
          </h2>
        </div>

        <div className="db-kpi-card">
          <div
            className="db-kpi-icon"
            style={{ backgroundColor: "#fafbfd" }}
          >
            ⚫
          </div>

          <p className="db-kpi-label">
            Offline Lights
          </p>

          <h2 className="db-kpi-value">
            {stats.offlineLights}
          </h2>
        </div>

        <div className="db-kpi-card">
          <div
            className="db-kpi-icon"
            style={{ backgroundColor: "#ffffff" }}
          >
            ⚠️
          </div>

          <p className="db-kpi-label">
            Faulty Lights
          </p>

          <h2 className="db-kpi-value">
            {stats.faultyLights}
          </h2>
        </div>

        <div className="db-kpi-card">
          <div
            className="db-kpi-icon"
            style={{ backgroundColor: "#ffffff" }}
          >
            ⚡
          </div>

          <p className="db-kpi-label">
            Energy Usage
          </p>

          <h2 className="db-kpi-value">
            {stats.energyConsumption} kWh
          </h2>
        </div>

        <div className="db-kpi-card">
          <div
            className="db-kpi-icon"
            style={{ backgroundColor: "#ffffff" }}
          >
            📉
          </div>

          <p className="db-kpi-label">
            Energy Savings
          </p>

          <h2 className="db-kpi-value">
            {stats.energySavings} kWh
          </h2>
        </div>

      </div>

      {/* BOTTOM SECTION */}

      <div className="db-bottom-grid">

        {/* SYSTEM STATUS */}

        <div className="db-card">

          <h3 className="db-card-title">
            System Status
          </h3>

          <div className="db-status-list">

            <div className="db-status-row">
              <span className="db-status-label">
                Average Brightness
              </span>

              <span className="db-status-value">
                {stats.averageBrightness}%
              </span>
            </div>

            <div className="db-status-row">
              <span className="db-status-label">
                Motion Detection
              </span>

              <span className="db-status-bold">
                {stats.motionDetection}
              </span>
            </div>

            <div className="db-status-row">
              <span className="db-status-label">
                Active Lights
              </span>

              <span className="db-badge db-badge-green">
                {stats.activeLights}
              </span>
            </div>

            <div className="db-status-row">
              <span className="db-status-label">
                Faulty Lights
              </span>

              <span className="db-badge db-badge-red">
                {stats.faultyLights}
              </span>
            </div>

          </div>

        </div>

        {/* RECENT ALERTS */}

        <div className="db-card">

          <h3 className="db-card-title">
            Recent Alerts
          </h3>

          <div className="db-alerts-list">

            {alerts.length === 0 ? (

              <p className="db-no-alerts">
                No recent alerts
              </p>

            ) : (

              alerts.map(alert => (

                <div
                  key={alert.fault_id}
                  className="db-alert-item db-alert-error"
                >

                  <span className="db-alert-icon">
                    🔴
                  </span>

                  <div>

                    <p className="db-alert-msg">
                      Light {alert.light_id} - {alert.fault_type}
                    </p>

                    <p className="db-alert-time">
                      {new Date(
                        alert.reported_at
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

    </MainLayout>

  );

}

export default Dashboard;