import { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const styles = {
  header: { marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', maxWidth: '820px' },
  card: {
    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px',
    padding: '24px',
  },
  cardTitle: { fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '18px' },
  infoRow: {
    display: 'flex', justifyContent: 'space-between', padding: '12px 0',
    borderBottom: '1px solid #f3f4f6', fontSize: '14px',
  },
  infoLabel: { color: '#6b7280' },
  infoValue: { color: '#111827', fontWeight: 600 },
  label: {
    fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block',
  },
  input: {
    width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db',
    borderRadius: '8px', marginBottom: '14px', boxSizing: 'border-box',
  },
  error: {
    background: '#fee2e2', color: '#dc2626', fontSize: '13px', padding: '10px 12px',
    borderRadius: '8px', marginBottom: '14px',
  },
  success: {
    background: '#dcfce7', color: '#16a34a', fontSize: '13px', padding: '10px 12px',
    borderRadius: '8px', marginBottom: '14px',
  },
  button: {
    width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, color: '#ffffff',
    background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
};

function AccountSettings() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    api.patch('/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword
    })
      .then(() => {
        setSuccess('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to update password. Please try again.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <MainLayout>
      <div style={styles.header}>
        <h1 style={styles.title}>Account Settings</h1>
        <p style={styles.subtitle}>Manage your account details and password</p>
      </div>

      <div style={styles.grid}>
        {/* Account Info */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Account Information</div>

          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Full Name</span>
            <span style={styles.infoValue}>{user?.full_name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Email</span>
            <span style={styles.infoValue}>{user?.email}</span>
          </div>
          <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
            <span style={styles.infoLabel}>Role</span>
            <span style={styles.infoValue}>{user?.role}</span>
          </div>
        </div>

        {/* Change Password */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>Change Password</div>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Current Password</label>
            <input
              style={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />

            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label style={styles.label}>Confirm New Password</label>
            <input
              style={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              type="submit"
              style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

export default AccountSettings;