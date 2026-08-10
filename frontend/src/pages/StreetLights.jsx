import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
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
  addButton: {
    padding: '10px 18px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    background: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
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
  },
  pillBase: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '13px',
    fontWeight: 600,
  },
  pillOn: {
    background: '#dcfce7',
    color: '#16a34a',
  },
  pillOff: {
    background: '#fee2e2',
    color: '#dc2626',
  },
  deleteBtn: {
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#dc2626',
    background: '#fee2e2',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyState: {
    padding: '40px',
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
    zIndex: 100,
  },
  modal: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '380px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 700,
    marginBottom: '6px',
  },
  modalText: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '18px',
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
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    marginBottom: '18px',
    boxSizing: 'border-box',
    background: '#ffffff',
  },
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: '13px',
    padding: '10px 12px',
    borderRadius: '8px',
    marginBottom: '14px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelButton: {
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  primaryButton: {
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    background: '#2563eb',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  dangerButton: {
    padding: '9px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    background: '#dc2626',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

function StatusPill({ status }) {
  const isOn = status?.toUpperCase() === 'ON' || status?.toUpperCase() === 'ONLINE';
  return (
    <span style={{ ...styles.pillBase, ...(isOn ? styles.pillOn : styles.pillOff) }}>
      {isOn ? 'ON' : 'OFF'}
    </span>
  );
}

function StreetLights() {

  const [lights, setLights] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [locationArea, setLocationArea] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [lightToDelete, setLightToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const { user } = useAuth();
  const canManageLights = user?.role === 'Infrastructure Engineer';

  const loadLights = () => {
    setLoading(true);
    api.get('/streetlights')
      .then((response) => {
        setLights(response.data);
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadZones = () => {
    api.get('/zones')
      .then((response) => {
        setZones(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    loadLights();
    loadZones();
  }, []);

  const openAddModal = () => {
    setNodeId('');
    setLocationArea('');
    setZoneId(zones[0]?.zone_id || '');
    setFormError('');
    setShowAddModal(true);
  };

  const handleAddLight = (e) => {
    e.preventDefault();
    setFormError('');

    if (!nodeId.trim() || !locationArea.trim() || !zoneId) {
      setFormError('All fields are required.');
      return;
    }

    setSubmitting(true);

    api.post('/streetlights', {
      node_id: nodeId.trim(),
      location_area: locationArea.trim(),
      zone_id: zoneId
    })
      .then(() => {
        setShowAddModal(false);
        loadLights();
      })
      .catch((err) => {
        setFormError(err.response?.data?.error || 'Failed to register light. Please try again.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const confirmDelete = () => {
    if (!lightToDelete) return;

    setDeleting(true);
    setDeleteError('');

    api.delete(`/streetlights/${lightToDelete.light_id}`)
      .then(() => {
        setLightToDelete(null);
        loadLights();
      })
      .catch((err) => {
        setDeleteError(err.response?.data?.error || 'Failed to delete light. Please try again.');
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  return (
    <MainLayout>

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Street Lights</h1>
          <p style={styles.subtitle}>Registered street light nodes and their current configuration</p>
        </div>

        {canManageLights && (
          <button style={styles.addButton} onClick={openAddModal}>
            + Register Light
          </button>
        )}
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Node ID</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Zone</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Brightness</th>
              {canManageLights && <th style={styles.th}></th>}
            </tr>
          </thead>

          <tbody>
            {lights.map((light) => (
              <tr key={light.light_id}>
                <td style={styles.td}>{light.light_id}</td>
                <td style={styles.td}>{light.node_id}</td>
                <td style={styles.td}>{light.location_area}</td>
                <td style={styles.td}>{light.zone_name || light.zone_id}</td>
                <td style={styles.td}>
                  <StatusPill status={light.status} />
                </td>
                <td style={styles.td}>{light.brightness}%</td>
                {canManageLights && (
                  <td style={styles.td}>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => { setDeleteError(''); setLightToDelete(light); }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && lights.length === 0 && (
          <div style={styles.emptyState}>No street lights registered yet.</div>
        )}
      </div>

      {/* Register Light Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Register New Light</div>
            <div style={styles.modalText}>
              Enter the light node's details and assign it to a zone.
            </div>

            {formError && <div style={styles.error}>{formError}</div>}

            <form onSubmit={handleAddLight}>
              <label style={styles.label}>Node ID</label>
              <input
                style={styles.input}
                type="text"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                placeholder="e.g. 4"
                autoFocus
              />

              <label style={styles.label}>Location</label>
              <input
                style={styles.input}
                type="text"
                value={locationArea}
                onChange={(e) => setLocationArea(e.target.value)}
                placeholder="e.g. Node 4 - South Gate"
              />

              <label style={styles.label}>Zone</label>
              <select
                style={styles.select}
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
              >
                <option value="" disabled>Select a zone</option>
                {zones.map((zone) => (
                  <option key={zone.zone_id} value={zone.zone_id}>
                    {zone.zone_name}
                  </option>
                ))}
              </select>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.primaryButton, ...(submitting ? styles.buttonDisabled : {}) }}
                  disabled={submitting}
                >
                  {submitting ? 'Registering…' : 'Register Light'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {lightToDelete && (
        <div style={styles.modalOverlay} onClick={() => setLightToDelete(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Delete Node {lightToDelete.node_id}?</div>
            <div style={styles.modalText}>
              This cannot be undone. If this light has fault, energy, motion, or schedule
              records linked to it, deletion will be blocked until those are cleared.
            </div>

            {deleteError && <div style={styles.error}>{deleteError}</div>}

            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setLightToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.dangerButton, ...(deleting ? styles.buttonDisabled : {}) }}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete Light'}
              </button>
            </div>
          </div>
        </div>
      )}

    </MainLayout>
  );
}

export default StreetLights;