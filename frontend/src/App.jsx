import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import StreetLights from './pages/StreetLights';
import EnergyMonitoring from './pages/EnergyMonitoring';
import Faults from './pages/Faults';
import Reports from './pages/Reports';
import Zones from './pages/Zones';
import Scheduling from "./pages/Scheduling";
import Login from './pages/Login';
import Users from './pages/Users';
import AccountSettings from './pages/AccountSettings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PasswordChangePrompt from './components/PasswordChangePrompt';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/streetlights" element={<ProtectedRoute><StreetLights /></ProtectedRoute>} />
        <Route path="/energy" element={<ProtectedRoute><EnergyMonitoring /></ProtectedRoute>} />
        <Route path="/faults" element={<ProtectedRoute><Faults /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/zones" element={<ProtectedRoute><Zones /></ProtectedRoute>} />
        <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
        <Route path="/account-settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['Administrator']}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Routes>

      {user?.must_change_password && <PasswordChangePrompt />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;