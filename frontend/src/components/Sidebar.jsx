import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      style={{
        width: '250px',
        background: '#1e293b',
        color: 'white',
        height: '100vh',
        padding: '20px',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}
    >
      <h2>Smart Street Lights</h2>

      <hr />

      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          flex: 1,
          overflowY: 'auto'
        }}
      >
        <li style={{ padding: '15px 0' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            Dashboard
          </Link>
        </li>

        <li style={{ padding: '15px 0' }}>
          <Link to="/streetlights" style={{ color: 'white', textDecoration: 'none' }}>
            Street Lights
          </Link>
        </li>

        <li style={{ padding: '15px 0' }}>
          <Link to="/energy" style={{ color: 'white', textDecoration: 'none' }}>
            Energy Monitoring
          </Link>
        </li>

        <li style={{ padding: '15px 0' }}>
          <Link to="/faults" style={{ color: 'white', textDecoration: 'none' }}>
            Faults
          </Link>
        </li>

        <li style={{ padding: '15px 0' }}>
          <Link to="/reports" style={{ color: 'white', textDecoration: 'none' }}>
            Reports
          </Link>
        </li>

        <li style={{ padding: '15px 0' }}>
          <Link to="/zones" style={{ color: 'white', textDecoration: 'none' }}>
            Zones
          </Link>
        </li>

        <li style={{ padding: '15px 0' }}>
          <Link to="/scheduling" style={{ color: 'white', textDecoration: 'none' }}>
            Scheduling
          </Link>
        </li>

        {user?.role === 'Administrator' && (
          <li style={{ padding: '15px 0' }}>
            <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>
              Users
            </Link>
          </li>
        )}
      </ul>

      {user && (
        <div
          style={{
            borderTop: '1px solid #334155',
            paddingTop: '16px',
            marginTop: '16px'
          }}
        >
          <Link
            to="/account-settings"
            style={{
              display: 'block',
              fontSize: '13px',
              color: '#cbd5e1',
              textDecoration: 'none',
              marginBottom: '12px'
            }}
          >
            ⚙ Account Settings
          </Link>

          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {user.role}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '9px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#1e293b',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

export default Sidebar;