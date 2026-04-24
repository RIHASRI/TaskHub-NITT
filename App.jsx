// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login   from './pages/Login';
import Tasks   from './pages/Tasks';

// ── ProtectedRoute: redirects to /login if not authenticated ─
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// ── Simple top nav ───────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <nav style={styles.nav}>
      <strong style={{ fontSize: 16 }}>📋 TaskHub</strong>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link to="/dashboard" style={styles.navLink}>Tasks</Link>
        <span style={styles.badge}>{user.role}</span>
        <span style={{ fontSize: 13, color: '#888' }}>{user.name}</span>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login"     element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

const roleColors = { admin: '#7c3aed', member: '#2563eb', viewer: '#059669' };
const styles = {
  nav:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 },
  navLink:   { textDecoration: 'none', color: '#333', fontSize: 14, fontWeight: 500 },
  badge:     { padding: '2px 10px', borderRadius: 20, background: '#ede9fe', color: '#7c3aed', fontSize: 12, fontWeight: 600 },
  logoutBtn: { padding: '5px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
};
