import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';

function StreetLights() {

  const [lights, setLights] = useState([]);

  useEffect(() => {

    api.get('/streetlights')
      .then((response) => {
        setLights(response.data);
      })
      .catch((error) => {
        console.error(error);
      });

  }, []);

  return (
    <MainLayout>

      <h1>Street Lights</h1>

      <table
        border="1"
        cellPadding="10"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginTop: '20px'
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Node ID</th>
            <th>Zone</th>
            <th>Location</th>
            <th>Status</th>
            <th>Brightness</th>
          </tr>
        </thead>

        <tbody>

          {lights.map((light) => (
            <tr key={light.light_id}>
              <td>{light.light_id}</td>
              <td>{light.node_id}</td>
              <td>{light.zone_id}</td>
              <td>{light.location_area}</td>
              <td>{light.status}</td>
              <td>{light.brightness}%</td>
            </tr>
          ))}

        </tbody>
      </table>

    </MainLayout>
  );
}

export default StreetLights;