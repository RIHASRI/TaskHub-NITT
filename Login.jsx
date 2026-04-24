// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate   = useNavigate();
  const { login }  = useAuth();
  const [form, setForm]     = useState({ email: '', password: '', orgSlug: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Sign In</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            style={styles.input}
            name="orgSlug"
            placeholder="Organisation slug (e.g. acme-corp)"
            value={form.orgSlug}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button style={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ marginTop: 12, fontSize: 13, color: '#888' }}>
          New org? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page:  { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f6f9' },
  card:  { background: '#fff', padding: 32, borderRadius: 10, width: 360, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 20px', fontSize: 22, fontWeight: 600 },
  input: { display: 'block', width: '100%', padding: '10px 12px', marginBottom: 12, border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' },
  btn:   { width: '100%', padding: '11px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, cursor: 'pointer', fontWeight: 600 },
  error: { background: '#fee2e2', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 12 },
};
