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

  const [energyData, setEnergyData] = useState([]);

  useEffect(() => {

    api
      .get("/energy_data")
      .then((response) => {

        console.log(response.data);

        setEnergyData(response.data);

      })
      .catch((error) => {

        console.error(error);

      });

  }, []);

  const labels = energyData.map(item =>
    new Date(item.recorded_at)
      .toLocaleDateString()
  );

  const voltageData =
    energyData.map(item =>
      Number(item.voltage)
    );

  const currentData =
    energyData.map(item =>
      Number(item.current)
    );

  const powerData =
    energyData.map(item =>
      Number(item.power)
    );

  const energyValues =
    energyData.map(item =>
      Number(item.energy)
    );

  const totalEnergy =
    energyValues.reduce(
      (sum, value) => sum + value,
      0
    );

  const avgVoltage =
    voltageData.length
      ? (
          voltageData.reduce(
            (a, b) => a + b,
            0
          ) /
          voltageData.length
        ).toFixed(2)
      : 0;

  const avgCurrent =
    currentData.length
      ? (
          currentData.reduce(
            (a, b) => a + b,
            0
          ) /
          currentData.length
        ).toFixed(2)
      : 0;

  const avgPower =
    powerData.length
      ? (
          powerData.reduce(
            (a, b) => a + b,
            0
          ) /
          powerData.length
        ).toFixed(2)
      : 0;

  const energyLineData = {
    labels,
    datasets: [
      {
        label: "Energy (kWh)",
        data: energyValues,
        borderColor: "#2563eb",
        backgroundColor:
          "rgba(37,99,235,0.2)",
        tension: 0.4
      }
    ]
  };

  const powerBarData = {
    labels,
    datasets: [
      {
        label: "Power (W)",
        data: powerData,
        backgroundColor:
          "rgba(34,197,94,0.7)"
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
        tension: 0.4
      },
      {
        label: "Current (A)",
        data: currentData,
        borderColor: "#ef4444",
        tension: 0.4
      }
    ]
  };

  return (
    <MainLayout>

      <h1>Energy Monitoring</h1>

      <p>
        Real-time energy monitoring of
        street lights.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(4,1fr)",
          gap: "20px",
          marginBottom: "20px"
        }}
      >
        <div style={cardStyle}>
          <h4>Total Energy</h4>
          <h2>
            {totalEnergy.toFixed(2)}
            {" "}kWh
          </h2>
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

      <div style={chartCard}>
        <h3>Energy Consumption</h3>

        <Line data={energyLineData} />
      </div>

      <div
        style={{
          ...chartCard,
          marginTop: "20px"
        }}
      >
        <h3>Power Consumption</h3>

        <Bar data={powerBarData} />
      </div>

      <div
        style={{
          ...chartCard,
          marginTop: "20px"
        }}
      >
        <h3>Voltage vs Current</h3>

        <Line data={voltageCurrentData} />
      </div>

      <div
        style={{
          ...chartCard,
          marginTop: "20px"
        }}
      >
        <h3>Recent Energy Records</h3>

        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse"
          }}
        >
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

            {energyData.map(item => (

              <tr key={item.energy_id}>

                <td>{item.light_id}</td>

                <td>{item.voltage}</td>

                <td>{item.current}</td>

                <td>{item.power}</td>

                <td>{item.energy}</td>

                <td>
                  {new Date(
                    item.recorded_at
                  ).toLocaleString()}
                </td>

              </tr>

            ))}

          </tbody>
        </table>
      </div>

    </MainLayout>
  );
}

const chartCard = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.1)"
};

const cardStyle = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.1)"
};

export default EnergyMonitoring;