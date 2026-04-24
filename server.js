// server.js - Entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const taskRoutes = require('./src/routes/tasks');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',  authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on :${PORT}`));
