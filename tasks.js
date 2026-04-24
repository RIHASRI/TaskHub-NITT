// src/routes/tasks.js
const express      = require('express');
const { query }    = require('../config/db');
const authenticate = require('../middleware/authenticate');
const requireRole  = require('../middleware/requireRole');

const router = express.Router();

// All task routes require authentication
router.use(authenticate);

// ── GET /api/tasks  (all roles) ──────────────────────────────
// Optional query param: ?status=pending|in_progress|done
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const tenantId   = req.user.tenantId;

    let sql = `
      SELECT t.id, t.title, t.description, t.status,
             t.created_at, t.updated_at,
             c.name AS creator_name,
             a.name AS assignee_name
      FROM   tasks t
      JOIN   users c ON c.id = t.creator_id
      LEFT JOIN users a ON a.id = t.assignee_id
      WHERE  t.tenant_id = $1`;
    const params = [tenantId];

    if (status) {
      sql += ` AND t.status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY t.created_at DESC`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ── POST /api/tasks  (admin, member) ────────────────────────
router.post('/', requireRole('admin', 'member'), async (req, res, next) => {
  try {
    const { title, description, assigneeId, status } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const tenantId  = req.user.tenantId;
    const creatorId = req.user.id;

    // If assigneeId provided, verify it belongs to same tenant
    if (assigneeId) {
      const check = await query(
        'SELECT id FROM users WHERE id = $1 AND tenant_id = $2',
        [assigneeId, tenantId]
      );
      if (check.rows.length === 0) {
        return res.status(400).json({ error: 'Assignee not found in your organisation' });
      }
    }

    const result = await query(
      `INSERT INTO tasks (tenant_id, creator_id, assignee_id, title, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, creatorId, assigneeId || null, title, description || '', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/tasks/:id  (admin can update any; member only own) ──
router.put('/:id', requireRole('admin', 'member'), async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;
    const taskId   = req.params.id;
    const { title, description, assigneeId, status } = req.body;

    // Fetch task (always scoped to tenant for isolation)
    const taskRes = await query(
      'SELECT * FROM tasks WHERE id = $1 AND tenant_id = $2',
      [taskId, tenantId]
    );
    if (taskRes.rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    const task = taskRes.rows[0];

    // Members can only update tasks they created
    if (req.user.role === 'member' && task.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Members can only update their own tasks' });
    }

    const result = await query(
      `UPDATE tasks
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           assignee_id = COALESCE($3, assignee_id),
           status      = COALESCE($4, status),
           updated_at  = NOW()
       WHERE id = $5 AND tenant_id = $6
       RETURNING *`,
      [title, description, assigneeId, status, taskId, tenantId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/tasks/:id  (admin only) ─────────────────────
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [req.params.id, req.user.tenantId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
