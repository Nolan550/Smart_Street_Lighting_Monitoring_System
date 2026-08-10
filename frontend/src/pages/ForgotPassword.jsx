import { useState } from 'react';
import { Link } from 'react-router-dom';
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
  subtitle: { fontSize: '14px', color: '#6b7280', marginBottom: '28px', lineHeight: 1.5 },
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
  success: {
    background: '#dcfce7', color: '#16a34a', fontSize: '13px', padding: '12px',
    borderRadius: '8px', marginBottom: '18px', lineHeight: 1.5,
  },
  backLink: {
    display: 'block', textAlign: 'center', marginTop: '18px',
    fontSize: '13px', color: '#2563eb', textDecoration: 'none',
  },
};

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);

    api.post('/auth/forgot-password', { email: email.trim() })
      .then(() => {
        setSubmitted(true);
      })
      .catch(() => {
        // Backend always returns a generic success message even on
        // failure, but just in case of a network error, still show
        // the same message rather than leaking anything.
        setSubmitted(true);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.title}>Forgot Password</div>
        <div style={styles.subtitle}>
          Enter your account email and we'll send you a link to reset your password.
        </div>

        {submitted ? (
          <div style={styles.success}>
            If that email is registered, a reset link has been sent. Check your inbox
            (and spam folder) — the link expires in 1 hour.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoFocus
            />

            <button
              type="submit"
              style={{ ...styles.button, ...(submitting ? styles.buttonDisabled : {}) }}
              disabled={submitting}
            >
              {submitting ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <Link to="/login" style={styles.backLink}>← Back to Login</Link>
      </div>
    </div>
  );
}

export default ForgotPassword;