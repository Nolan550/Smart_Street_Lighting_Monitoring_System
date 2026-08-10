import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';

const styles = {
  wrapper: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f9fafb',
  },
  card: {
    width: '380px', background: '#ffffff', border: '1px solid #e5e7eb',
    borderRadius: '14px', padding: '36px',
  },
  title: { fontSize: '22px', fontWeight: 700, color: '#111827', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#6b7280', marginBottom: '28px' },
  label: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' },
  input: {
    width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db',
    borderRadius: '8px', marginBottom: '18px', boxSizing: 'border-box',
  },
  button: {
    width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, color: '#ffffff',
    background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: {
    background: '#fee2e2', color: '#dc2626', fontSize: '13px', padding: '10px 12px',
    borderRadius: '8px', marginBottom: '18px',
  },
  backLink: {
    display: 'block', textAlign: 'center', marginTop: '18px',
    fontSize: '13px', color: '#2563eb', textDecoration: 'none',
  },
};

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in both fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    api.post('/auth/reset-password', { token, new_password: newPassword })
      .then(() => {
        alert('Password reset successfully. Please log in with your new password.');
        navigate('/login');
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.title}>Reset Password</div>
        <div style={styles.subtitle}>Choose a new password for your account.</div>

        {error && <div style={styles.error}>{error}</div>}

        {!token && (
          <div style={styles.error}>
            No reset token found in this link. Please use the link from your email, or
            request a new one.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>New Password</label>
          <input
            style={styles.input}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoFocus
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
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <Link to="/login" style={styles.backLink}>← Back to Login</Link>
      </div>
    </div>
  );
}

export default ResetPassword;