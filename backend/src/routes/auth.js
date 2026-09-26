const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { asyncHandler, isBlank } = require('../utils/helpers');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ProjectMSSecretKey2026ForJWTTokenGenerationAndValidation';
const JWT_EXP_MS = Number(process.env.JWT_EXPIRATION_MS || 86400000);
const EXPIRES_IN = `${Math.floor(JWT_EXP_MS / 3600000)}h`; // "24h"

// POST /api/auth/login — public. Mirrors AuthServiceImpl.login().
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {};
  const errors = {};
  if (isBlank(username)) errors.username = 'must not be blank';
  if (isBlank(password)) errors.password = 'must not be blank';
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username.trim()]);
  if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

  const admin = rows[0];
  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

  const token = jwt.sign({ sub: admin.username }, JWT_SECRET, { expiresIn: EXPIRES_IN });
  return res.json({ token, message: `Login successful as ${admin.full_name}` });
}));

module.exports = router;
