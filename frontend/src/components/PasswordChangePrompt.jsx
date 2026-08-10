import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    width: '400px',
    background: '#ffffff',
    borderRadius: '14px',
    padding: '28px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '6px',
  },
  text: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    marginBottom: '14px',
    boxSizing: 'border-box',
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '14px',
  },
  primaryButton: {
    width: '100%',
    padding: '11px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    background: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  secondaryButton: {
    width: '100%',
    padding: '11px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

function PasswordChangePrompt() {
  const [mode, setMode] = useState('prompt'); // 'prompt' | 'form'
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { clearMustChangePassword } = useAuth();

  const handleKeep = () => {
    setSubmitting(true);

    api.patch('/users/me/keep-password')
      .then(() => {
        clearMustChangePassword();
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const handleChangeSubmit = (e) => {
    e.preventDefault();
    setError('');

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
        clearMustChangePassword();
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>

        {mode === 'prompt' && (
          <>
            <div style={styles.title}>Update Your Password</div>
            <div style={styles.text}>
              You're using a temporary password. You can change it now, or keep using
              it and change it later from your account settings.
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              style={{ ...styles.primaryButton, ...(submitting ? styles.buttonDisabled : {}) }}
              onClick={() => setMode('form')}
              disabled={submitting}
            >
              Change Password
            </button>
            <button
              style={{ ...styles.secondaryButton, ...(submitting ? styles.buttonDisabled : {}) }}
              onClick={handleKeep}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Keep Current Password'}
            </button>
          </>
        )}

        {mode === 'form' && (
          <form onSubmit={handleChangeSubmit}>
            <div style={styles.title}>Change Password</div>
            <div style={styles.text}>Enter your current password and choose a new one.</div>

            {error && <div style={styles.error}>{error}</div>}

            <label style={styles.label}>Current Password</label>
            <input
              style={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoFocus
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
              style={{ ...styles.primaryButton, ...(submitting ? styles.buttonDisabled : {}) }}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : 'Save New Password'}
            </button>
            <button
              type="button"
              style={{ ...styles.secondaryButton, ...(submitting ? styles.buttonDisabled : {}) }}
              onClick={() => { setMode('prompt'); setError(''); }}
              disabled={submitting}
            >
              Back
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default PasswordChangePrompt;