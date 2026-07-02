import { Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import StreetLights from './pages/StreetLights';
import EnergyMonitoring from './pages/EnergyMonitoring';
import Faults from './pages/Faults';
import Reports from './pages/Reports';
import Zones from './pages/Zones';
import Scheduling from "./pages/Scheduling";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/streetlights" element={<StreetLights />} />
      <Route path="/energy" element={<EnergyMonitoring />} />
      <Route path="/faults" element={<Faults />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/zones" element={<Zones />} />
      <Route path="/scheduling" element={<Scheduling />} />
    </Routes>
  );
}

export default App;