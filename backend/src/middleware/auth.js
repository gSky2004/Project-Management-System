const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ProjectMSSecretKey2026ForJWTTokenGenerationAndValidation';

// Mirrors Spring Security: every /api/** request needs auth EXCEPT /api/auth/** (login).
async function authMiddleware(req, res, next) {
  try {
    if (req.path.startsWith('/api/auth')) return next();

    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = header.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const username = decoded.sub;
    if (!username) return res.status(401).json({ error: 'Invalid or expired token' });

    const { rows } = await pool.query('SELECT id, username, full_name FROM admins WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid or expired token' });

    req.user = rows[0];
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = authMiddleware;
