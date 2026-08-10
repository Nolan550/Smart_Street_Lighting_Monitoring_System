import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  toggleGroup: {
    display: 'flex',
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  toggleButton: (active) => ({
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#2563eb' : '#ffffff',
    color: active ? '#ffffff' : '#374151',
  }),
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  theadRow: {
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  th: {
    textAlign: 'left',
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  td: {
    padding: '14px 20px',
    fontSize: '14px',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  },
  pillBase: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: 600,
  },
  pillOpen: {
    background: '#fee2e2',
    color: '#dc2626',
  },
  pillResolved: {
    background: '#dcfce7',
    color: '#16a34a',
  },
  resolveButton: {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    background: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  resolveButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '14px',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modal: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '360px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '8px',
  },
  modalText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px',
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

function StatusPill({ status }) {
  const isResolved = status === 'Resolved';
  return (
    <span style={{ ...styles.pillBase, ...(isResolved ? styles.pillResolved : styles.pillOpen) }}>
      {isResolved ? 'Resolved' : 'Open'}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function Faults() {

  const [view, setView] = useState('active'); // 'active' | 'history'
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [faultToResolve, setFaultToResolve] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const canResolve = user?.role === 'Maintenance Engineer';

  const loadFaults = () => {
    setLoading(true);

    const endpoint = view === 'active' ? '/faults/active' : '/faults';

    api.get(endpoint)
      .then((response) => {
        setFaults(response.data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadFaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const confirmResolve = () => {
    if (!faultToResolve) return;

    setSubmitting(true);

    api.patch(`/faults/${faultToResolve.fault_id}/resolve`)
      .then(() => {
        setFaultToResolve(null);
        loadFaults();
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <MainLayout>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Faults</h1>
          <p style={styles.subtitle}>
            {view === 'active'
              ? 'Faults currently open and awaiting resolution'
              : 'Full fault history, including resolved faults'}
          </p>
        </div>

        <div style={styles.toggleGroup}>
          <button
            style={styles.toggleButton(view === 'active')}
            onClick={() => setView('active')}
          >
            Active
          </button>
          <button
            style={styles.toggleButton(view === 'history')}
            onClick={() => setView('history')}
          >
            History
          </button>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>Fault ID</th>
              <th style={styles.th}>Light</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Reported At</th>
              {view === 'history' && <th style={styles.th}>Resolved At</th>}
              {view === 'history' && <th style={styles.th}>Resolved By</th>}
              {view === 'active' && canResolve && <th style={styles.th}></th>}
            </tr>
          </thead>

          <tbody>
            {faults.map((fault) => (
              <tr key={fault.fault_id}>
                <td style={styles.td}>{fault.fault_id}</td>
                <td style={styles.td}>{fault.light_id}</td>
                <td style={styles.td}>{fault.location_area || '—'}</td>
                <td style={styles.td}>{fault.fault_type}</td>
                <td style={styles.td}><StatusPill status={fault.status} /></td>
                <td style={styles.td}>{formatDate(fault.reported_at)}</td>

                {view === 'history' && (
                  <td style={styles.td}>{formatDate(fault.resolved_at)}</td>
                )}
                {view === 'history' && (
                  <td style={styles.td}>{fault.resolved_by_name || '—'}</td>
                )}

                {view === 'active' && canResolve && (
                  <td style={styles.td}>
                    <button
                      style={styles.resolveButton}
                      onClick={() => setFaultToResolve(fault)}
                    >
                      Mark as Resolved
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && faults.length === 0 && (
          <div style={styles.emptyState}>
            {view === 'active' ? 'No active faults right now.' : 'No fault history yet.'}
          </div>
        )}
      </div>

      {faultToResolve && (
        <div style={styles.modalOverlay} onClick={() => setFaultToResolve(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Resolve Fault #{faultToResolve.fault_id}</div>
            <div style={styles.modalText}>
              This marks the fault as resolved under your account ({user?.full_name}) and
              removes it from the active list. It stays in the fault history permanently.
            </div>

            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setFaultToResolve(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.resolveButton, ...(submitting ? styles.resolveButtonDisabled : {}) }}
                onClick={confirmResolve}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}

export default Faults;