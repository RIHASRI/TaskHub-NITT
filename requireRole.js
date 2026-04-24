// src/middleware/requireRole.js
// Usage: router.delete('/:id', authenticate, requireRole('admin'), handler)
// Accepts one or more allowed roles.

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = requireRole;
