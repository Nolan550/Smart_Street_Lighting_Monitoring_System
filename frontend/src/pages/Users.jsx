import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import api from '../services/api';

const ROLES = ['Administrator', 'Infrastructure Engineer', 'Maintenance Engineer'];

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  title: { fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  addButton: {
    padding: '10px 18px', fontSize: '14px', fontWeight: 600, color: '#ffffff',
    background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { background: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  th: { textAlign: 'left', padding: '14px 20px', fontSize: '13px', fontWeight: 600, color: '#374151' },
  td: { padding: '14px 20px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6' },
  pillBase: { display: 'inline-block', padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600 },
  roleAdmin: { background: '#ede9fe', color: '#7c3aed' },
  roleInfra: { background: '#dbeafe', color: '#2563eb' },
  roleMaint: { background: '#fef3c7', color: '#d97706' },
  statusActive: { background: '#dcfce7', color: '#16a34a' },
  statusInactive: { background: '#fee2e2', color: '#dc2626' },
  emptyState: { padding: '48px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: { background: '#ffffff', borderRadius: '12px', padding: '24px', width: '400px' },
  modalTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '6px' },
  modalText: { fontSize: '13px', color: '#6b7280', marginBottom: '18px', lineHeight: 1.5 },
  label: { fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' },
  input: {
    width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db',
    borderRadius: '8px', marginBottom: '14px', boxSizing: 'border-box',
  },
  select: {
    width: '100%', padding: '10px 12px', fontSize: '14px', border: '1px solid #d1d5db',
    borderRadius: '8px', marginBottom: '14px', boxSizing: 'border-box', background: '#ffffff',
  },
  error: {
    background: '#fee2e2', color: '#dc2626', fontSize: '13px', padding: '10px 12px',
    borderRadius: '8px', marginBottom: '14px',
  },
  success: {
    background: '#dcfce7', color: '#16a34a', fontSize: '13px', padding: '10px 12px',
    borderRadius: '8px', marginBottom: '14px',
  },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  cancelButton: {
    padding: '9px 16px', fontSize: '14px', fontWeight: 600, color: '#374151',
    background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer',
  },
  primaryButton: {
    padding: '9px 16px', fontSize: '14px', fontWeight: 600, color: '#ffffff',
    background: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
};

function RolePill({ role }) {
  const style =
    role === 'Administrator' ? styles.roleAdmin :
    role === 'Infrastructure Engineer' ? styles.roleInfra :
    styles.roleMaint;
  return <span style={{ ...styles.pillBase, ...style }}>{role}</span>;
}

function StatusPill({ isActive }) {
  return (
    <span style={{ ...styles.pillBase, ...(isActive ? styles.statusActive : styles.statusInactive) }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES[1]);
  const [tempPassword, setTempPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [userToEdit, setUserToEdit] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const loadUsers = () => {
    setLoading(true);
    api.get('/users')
      .then((response) => setUsers(response.data))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setFullName('');
    setEmail('');
    setRole(ROLES[1]);
    setTempPassword('');
    setFormError('');
    setFormSuccess('');
    setShowAddModal(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!fullName.trim() || !email.trim() || !tempPassword) {
      setFormError('All fields are required.');
      return;
    }

    if (tempPassword.length < 6) {
      setFormError('Temporary password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);

    api.post('/users', {
      full_name: fullName.trim(),
      email: email.trim(),
      role,
      temporary_password: tempPassword
    })
      .then(() => {
        setFormSuccess(`Account created for ${fullName.trim()}. Share the temporary password with them securely.`);
        loadUsers();
      })
      .catch((err) => {
        setFormError(err.response?.data?.error || 'Failed to create user. Please try again.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;

    setDeleting(true);
    setDeleteError('');

    api.delete(`/users/${userToDelete.user_id}`)
      .then(() => {
        setUserToDelete(null);
        loadUsers();
      })
      .catch((err) => {
        setDeleteError(err.response?.data?.error || 'Failed to delete user. Please try again.');
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  const toggleActive = (u) => {
    setTogglingId(u.user_id);

    api.patch(`/users/${u.user_id}/deactivate`, { is_active: !u.is_active })
      .then(() => {
        loadUsers();
      })
      .catch((err) => {
        alert(err.response?.data?.error || 'Failed to update user status.');
      })
      .finally(() => {
        setTogglingId(null);
      });
  };

  const openEditModal = (u) => {
    setUserToEdit(u);
    setEditFullName(u.full_name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditError('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setEditError('');

    if (!editFullName.trim() || !editEmail.trim() || !editRole) {
      setEditError('All fields are required.');
      return;
    }

    setEditSubmitting(true);

    api.put(`/users/${userToEdit.user_id}`, {
      full_name: editFullName.trim(),
      email: editEmail.trim(),
      role: editRole
    })
      .then(() => {
        setUserToEdit(null);
        loadUsers();
      })
      .catch((err) => {
        setEditError(err.response?.data?.error || 'Failed to update user. Please try again.');
      })
      .finally(() => {
        setEditSubmitting(false);
      });
  };

  return (
    <MainLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Users</h1>
          <p style={styles.subtitle}>Manage accounts and roles for the platform</p>
        </div>

        <button style={styles.addButton} onClick={openAddModal}>
          + Create User
        </button>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Created</th>
              <th style={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td style={styles.td}>{u.full_name}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}><RolePill role={u.role} /></td>
                <td style={styles.td}><StatusPill isActive={u.is_active} /></td>
                <td style={styles.td}>{formatDate(u.created_at)}</td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => openEditModal(u)}
                      style={{
                        padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                        color: '#2563eb', background: '#dbeafe', border: 'none',
                        borderRadius: '6px', cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={togglingId === u.user_id}
                      style={{
                        padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                        color: '#374151', background: '#f3f4f6', border: 'none',
                        borderRadius: '6px', cursor: 'pointer',
                        opacity: togglingId === u.user_id ? 0.6 : 1,
                      }}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => { setDeleteError(''); setUserToDelete(u); }}
                      style={{
                        padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                        color: '#dc2626', background: '#fee2e2', border: 'none',
                        borderRadius: '6px', cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && users.length === 0 && (
          <div style={styles.emptyState}>No users yet.</div>
        )}
      </div>

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Create New User</div>
            <div style={styles.modalText}>
              Set a temporary password. The user will be prompted to change or keep it
              on their first login.
            </div>

            {formError && <div style={styles.error}>{formError}</div>}
            {formSuccess && <div style={styles.success}>{formSuccess}</div>}

            <form onSubmit={handleCreate}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Jane Doe"
                autoFocus
              />

              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@smartstreetlights.com"
              />

              <label style={styles.label}>Role</label>
              <select
                style={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <label style={styles.label}>Temporary Password</label>
              <input
                style={styles.input}
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                placeholder="At least 6 characters"
              />

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ ...styles.primaryButton, ...(submitting ? styles.buttonDisabled : {}) }}
                  disabled={submitting}
                >
                  {submitting ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToEdit && (
        <div style={styles.modalOverlay} onClick={() => setUserToEdit(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Edit User</div>
            <div style={styles.modalText}>
              Update this account's name, email, or role.
            </div>

            {editError && <div style={styles.error}>{editError}</div>}

            <form onSubmit={handleEditSubmit}>
              <label style={styles.label}>Full Name</label>
              <input
                style={styles.input}
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                autoFocus
              />

              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />

              <label style={styles.label}>Role</label>
              <select
                style={styles.select}
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setUserToEdit(null)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.primaryButton, ...(editSubmitting ? styles.buttonDisabled : {}) }}
                  disabled={editSubmitting}
                >
                  {editSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div style={styles.modalOverlay} onClick={() => setUserToDelete(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Delete {userToDelete.full_name}?</div>
            <div style={styles.modalText}>
              This cannot be undone. If this user has resolved any faults, deletion will
              be blocked to preserve that history — use Deactivate instead in that case.
            </div>

            {deleteError && <div style={styles.error}>{deleteError}</div>}

            <div style={styles.modalActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '9px 16px', fontSize: '14px', fontWeight: 600, color: '#ffffff',
                  background: '#dc2626', border: 'none', borderRadius: '6px',
                  cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1,
                }}
                onClick={confirmDeleteUser}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Users;