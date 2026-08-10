import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  bar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '20px',
  },
  info: {
    textAlign: 'right',
  },
  name: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
  role: {
    fontSize: '12px',
    color: '#6b7280',
  },
  logoutButton: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

function UserBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={styles.bar}>
      <div style={styles.info}>
        <div style={styles.name}>{user.full_name}</div>
        <div style={styles.role}>{user.role}</div>
      </div>
      <button style={styles.logoutButton} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default UserBar;
