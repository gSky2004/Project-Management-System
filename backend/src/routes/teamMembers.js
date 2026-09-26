const express = require('express');
const { pool } = require('../config/db');
const { asyncHandler, notFound, isBlank, isEmail } = require('../utils/helpers');

const router = express.Router();

function toDTO(row) {
  return {
    id: Number(row.id),
    fullName: row.full_name,
    position: row.position,
    phone: row.phone,
    email: row.email,
  };
}

function validate(body) {
  const errors = {};
  if (isBlank(body.fullName)) errors.fullName = 'must not be blank';
  if (isBlank(body.phone)) errors.phone = 'must not be blank';
  if (isBlank(body.email)) errors.email = 'must not be blank';
  else if (!isEmail(body.email)) errors.email = 'must be a well-formed email address';
  return errors;
}

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM team_members ORDER BY id');
  res.json(rows.map(toDTO));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM team_members WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw notFound('TeamMember not found');
  res.json(toDTO(rows[0]));
}));

router.post('/', asyncHandler(async (req, res) => {
  const errors = validate(req.body || {});
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);
  const { fullName, position = null, phone, email } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO team_members (full_name, position, phone, email) VALUES ($1, $2, $3, $4) RETURNING *',
    [fullName.trim(), position || null, phone.trim(), email.trim()]
  );
  res.json(toDTO(rows[0]));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const errors = validate(req.body || {});
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);
  const existing = await pool.query('SELECT id FROM team_members WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) throw notFound('TeamMember not found');
  const { fullName, position = null, phone, email } = req.body;
  const { rows } = await pool.query(
    `UPDATE team_members SET full_name=$1, position=$2, phone=$3, email=$4, updated_at=NOW()
     WHERE id=$5 RETURNING *`,
    [fullName.trim(), position || null, phone.trim(), email.trim(), req.params.id]
  );
  res.json(toDTO(rows[0]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await pool.query('SELECT id FROM team_members WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) throw notFound('TeamMember not found');
  // Unlink tasks, remove assignments, then delete the member (avoids wiping task history).
  await pool.query('UPDATE tasks SET assigned_member_id = NULL, updated_at = NOW() WHERE assigned_member_id = $1', [req.params.id]);
  await pool.query('DELETE FROM project_assignments WHERE team_member_id = $1', [req.params.id]);
  await pool.query('DELETE FROM team_members WHERE id = $1', [req.params.id]);
  res.status(204).send();
}));

module.exports = router;
