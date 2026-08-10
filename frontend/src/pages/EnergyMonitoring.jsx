import { useEffect, useState } from "react";
import api from "../services/api";
import MainLayout from "../layouts/MainLayout";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function EnergyMonitoring() {

  const [summaryData, setSummaryData] = useState([]);
  const [recentData, setRecentData] = useState([]);
  const [interval, setInterval] = useState("hour");
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {

    setLoadingSummary(true);

    api
      .get(`/energy_data/summary?interval=${interval}`)
      .then((response) => {
        setSummaryData(response.data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoadingSummary(false);
      });

  }, [interval]);

  useEffect(() => {

    api
      .get("/energy_data")
      .then((response) => {
        setRecentData(response.data);
      })
      .catch((error) => {
        console.error(error);
      });

  }, []);

  // Label format adapts to the selected interval so it stays readable
  // whether we're showing hours, days, weeks, or months.
  const labels = summaryData.map(item => {
    const date = new Date(item.bucket);
    if (interval === "hour") {
      return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", hour12: true });
    }
    if (interval === "day") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (interval === "week") {
      return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    // month
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  });

  const voltageData = summaryData.map(item => Number(item.avg_voltage));
  const currentData = summaryData.map(item => Number(item.avg_current));
  const powerData = summaryData.map(item => Number(item.avg_power));
  const energyValues = summaryData.map(item => Number(item.total_energy));

  const totalEnergy = energyValues.reduce((sum, value) => sum + value, 0);

  const avgVoltage =
    voltageData.length
      ? (voltageData.reduce((a, b) => a + b, 0) / voltageData.length).toFixed(2)
      : 0;

  const avgCurrent =
    currentData.length
      ? (currentData.reduce((a, b) => a + b, 0) / currentData.length).toFixed(2)
      : 0;

  const avgPower =
    powerData.length
      ? (powerData.reduce((a, b) => a + b, 0) / powerData.length).toFixed(2)
      : 0;

  const energyLineData = {
    labels,
    datasets: [
      {
        label: "Energy (kWh)",
        data: energyValues,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.2)",
        tension: 0.4,
        pointRadius: 2
      }
    ]
  };

  const powerBarData = {
    labels,
    datasets: [
      {
        label: "Power (W)",
        data: powerData,
        backgroundColor: "rgba(34,197,94,0.7)"
      }
    ]
  };

  const voltageCurrentData = {
    labels,
    datasets: [
      {
        label: "Voltage (V)",
        data: voltageData,
        borderColor: "#f59e0b",
        tension: 0.4,
        pointRadius: 2
      },
      {
        label: "Current (A)",
        data: currentData,
        borderColor: "#ef4444",
        tension: 0.4,
        pointRadius: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" }
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 20
        }
      }
    }
  };

  return (
    <MainLayout>

      <h1>Energy Monitoring</h1>

      <p>
        Energy monitoring summary across all street lights.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>View by:</span>

        {[
          { value: "hour", label: "Hourly" },
          { value: "day", label: "Daily" },
          { value: "week", label: "Weekly" },
          { value: "month", label: "Monthly" }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setInterval(option.value)}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              cursor: "pointer",
              background: interval === option.value ? "#2563eb" : "#ffffff",
              color: interval === option.value ? "#ffffff" : "#374151"
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "20px",
          marginBottom: "20px"
        }}
      >
        <div style={cardStyle}>
          <h4>Total Energy</h4>
          <h2>{totalEnergy.toFixed(4)} kWh</h2>
        </div>

        <div style={cardStyle}>
          <h4>Average Voltage</h4>
          <h2>{avgVoltage} V</h2>
        </div>

        <div style={cardStyle}>
          <h4>Average Current</h4>
          <h2>{avgCurrent} A</h2>
        </div>

        <div style={cardStyle}>
          <h4>Average Power</h4>
          <h2>{avgPower} W</h2>
        </div>
      </div>

      {loadingSummary ? (
        <div style={chartCard}>
          <p style={{ textAlign: "center", color: "#9ca3af", margin: 0 }}>
            Loading...
          </p>
        </div>
      ) : summaryData.length === 0 ? (
        <div style={chartCard}>
          <p style={{ textAlign: "center", color: "#9ca3af", margin: 0 }}>
            No energy data recorded yet.
          </p>
        </div>
      ) : (
        <>
          <div style={chartCard}>
            <h3>Energy Consumption</h3>
            <Line data={energyLineData} options={chartOptions} />
          </div>

          <div style={{ ...chartCard, marginTop: "20px" }}>
            <h3>Power Consumption</h3>
            <Bar data={powerBarData} options={chartOptions} />
          </div>

          <div style={{ ...chartCard, marginTop: "20px" }}>
            <h3>Voltage vs Current</h3>
            <Line data={voltageCurrentData} options={chartOptions} />
          </div>
        </>
      )}

      <div style={{ ...chartCard, marginTop: "20px" }}>
        <h3>Recent Energy Records</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Light</th>
              <th>Voltage</th>
              <th>Current</th>
              <th>Power</th>
              <th>Energy</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {recentData.map(item => (
              <tr key={item.energy_id}>
                <td>{item.light_id}</td>
                <td>{Number(item.voltage).toFixed(2)}</td>
                <td>{Number(item.current).toFixed(2)}</td>
                <td>{Number(item.power).toFixed(2)}</td>
                <td>{Number(item.energy).toFixed(6)}</td>
                <td>{new Date(item.recorded_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {recentData.length === 0 && (
          <p style={{ textAlign: "center", color: "#9ca3af" }}>
            No records yet.
          </p>
        )}
      </div>

    </MainLayout>
  );
}

const chartCard = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
};

const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
};

export default EnergyMonitoring;