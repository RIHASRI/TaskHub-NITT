// src/routes/auth.js
const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { query } = require('../config/db');

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────
// Creates a tenant (org) + first admin user in one shot.
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, orgName, orgSlug } = req.body;

    // Basic validation
    if (!name || !email || !password || !orgName || !orgSlug) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Create tenant (ignore conflict — slug already exists)
    let tenantResult = await query(
      'INSERT INTO tenants (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO UPDATE SET name = tenants.name RETURNING id',
      [orgName, orgSlug]
    );
    const tenantId = tenantResult.rows[0].id;

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Insert user (first user of a new tenant is admin)
    const userResult = await query(
      `INSERT INTO users (tenant_id, name, email, password, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, name, email, role`,
      [tenantId, name, email, hash]
    );
    const user = userResult.rows[0];

    const token = signToken(user.id, tenantId, user.role);
    res.status(201).json({ token, user: { ...user, tenantId } });

  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use for this organisation' });
    next(err);
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, orgSlug } = req.body;
    if (!email || !password || !orgSlug) {
      return res.status(400).json({ error: 'email, password and orgSlug are required' });
    }

    // Look up user within the correct tenant
    const result = await query(
      `SELECT u.id, u.name, u.email, u.password, u.role, u.tenant_id
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.email = $1 AND t.slug = $2`,
      [email, orgSlug]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user.id, user.tenant_id, user.role);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, tenantId: user.tenant_id },
    });

  } catch (err) {
    next(err);
  }
});

// ── Helper ───────────────────────────────────────────────────
function signToken(userId, tenantId, role) {
  return jwt.sign(
    { id: userId, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

module.exports = router;
