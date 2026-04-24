// src/pages/Tasks.jsx
// Main task management view — list, create, update, delete (by role)
import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = ['pending', 'in_progress', 'done'];

export default function Tasks() {
  const { user }    = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [filter, setFilter]     = useState('');
  const [form, setForm]         = useState({ title: '', description: '', status: 'pending' });
  const [editId, setEditId]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const canWrite  = user?.role === 'admin' || user?.role === 'member';
  const isAdmin   = user?.role === 'admin';

  const fetchTasks = async (status = '') => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks', { params: status ? { status } : {} });
      setTasks(data);
    } catch { setError('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(filter); }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/tasks/${editId}`, form);
      } else {
        await api.post('/tasks', form);
      }
      setForm({ title: '', description: '', status: 'pending' });
      setEditId(null);
      fetchTasks(filter);
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
  };

  const handleEdit = (task) => {
    setEditId(task.id);
    setForm({ title: task.title, description: task.description, status: task.status });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    fetchTasks(filter);
  };

  const statusColor = { pending: '#f59e0b', in_progress: '#3b82f6', done: '#10b981' };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Tasks</h2>

      {/* Filter Bar */}
      <div style={styles.filterRow}>
        {['', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{ ...styles.filterBtn, background: filter === s ? '#2563eb' : '#e5e7eb', color: filter === s ? '#fff' : '#333' }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Create / Edit Form */}
      {canWrite && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={{ marginTop: 0 }}>{editId ? 'Edit Task' : 'New Task'}</h3>
          {error && <p style={styles.error}>{error}</p>}
          <input
            style={styles.input}
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <textarea
            style={{ ...styles.input, resize: 'vertical' }}
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
          />
          <select
            style={styles.input}
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={styles.btn}>{editId ? 'Update' : 'Create Task'}</button>
            {editId && (
              <button type="button" style={styles.cancelBtn} onClick={() => { setEditId(null); setForm({ title: '', description: '', status: 'pending' }); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* Task List */}
      {loading ? <p>Loading…</p> : (
        <div>
          {tasks.length === 0 && <p style={{ color: '#888' }}>No tasks found.</p>}
          {tasks.map((task) => (
            <div key={task.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <strong>{task.title}</strong>
                <span style={{ ...styles.badge, background: statusColor[task.status] + '22', color: statusColor[task.status] }}>
                  {task.status}
                </span>
              </div>
              {task.description && <p style={styles.desc}>{task.description}</p>}
              <p style={styles.meta}>
                By {task.creator_name} {task.assignee_name ? `→ assigned to ${task.assignee_name}` : ''}
              </p>
              {canWrite && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button style={styles.editBtn} onClick={() => handleEdit(task)}>Edit</button>
                  {isAdmin && (
                    <button style={styles.deleteBtn} onClick={() => handleDelete(task.id)}>Delete</button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page:       { maxWidth: 720, margin: '0 auto', padding: '24px 16px' },
  heading:    { fontSize: 24, marginBottom: 16 },
  filterRow:  { display: 'flex', gap: 8, marginBottom: 20 },
  filterBtn:  { padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  form:       { background: '#fff', padding: 20, borderRadius: 10, marginBottom: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  input:      { display: 'block', width: '100%', padding: '9px 12px', marginBottom: 10, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  btn:        { padding: '9px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  cancelBtn:  { padding: '9px 18px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
  card:       { background: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge:      { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  desc:       { margin: '6px 0 4px', fontSize: 14, color: '#555' },
  meta:       { margin: 0, fontSize: 12, color: '#999' },
  editBtn:    { padding: '5px 12px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 5, cursor: 'pointer', fontSize: 13 },
  deleteBtn:  { padding: '5px 12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 5, cursor: 'pointer', fontSize: 13 },
  error:      { background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 10 },
};
