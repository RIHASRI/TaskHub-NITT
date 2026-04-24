// src/routes/users.js
// Admin-only: invite users, list users, change roles
const express      = require('express');
const bcrypt       = require('bcrypt');
const { query }    = require('../config/db');
const authenticate = require('../middleware/authenticate');
const requireRole  = require('../middleware/requireRole');

const router = express.Router();
router.use(authenticate);

// ── GET /api/users  (admin only) ────────────────────────────
router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at',
      [req.user.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users  (admin invites a new user) ──────────────
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email and password are required' });
    }
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin, member or viewer' });
    }

    const hash   = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (tenant_id, name, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [req.user.tenantId, name, email, hash, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    next(err);
  }
});

// ── PATCH /api/users/:id/role  (admin changes a user's role) ─
router.patch('/:id/role', requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const result = await query(
      `UPDATE users SET role = $1
       WHERE id = $2 AND tenant_id = $3
       RETURNING id, name, email, role`,
      [role, req.params.id, req.user.tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
