const express = require('express');
const { pool } = require('../config/db');
const {
  asyncHandler, notFound, isBlank, isEmail,
} = require('../utils/helpers');

const router = express.Router();

function toDTO(row) {
  return {
    id: Number(row.id),
    clientName: row.client_name,
    companyName: row.company_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
  };
}

function validate(body) {
  const errors = {};
  if (isBlank(body.clientName)) errors.clientName = 'must not be blank';
  if (isBlank(body.phone)) errors.phone = 'must not be blank';
  if (isBlank(body.email)) errors.email = 'must not be blank';
  else if (!isEmail(body.email)) errors.email = 'must be a well-formed email address';
  return errors;
}

// NOTE: /search must be registered BEFORE /:id or Express would treat "search" as an id.
router.get('/search', asyncHandler(async (req, res) => {
  const keyword = req.query.keyword ?? '';
  const { rows } = await pool.query(
    'SELECT * FROM clients WHERE client_name ILIKE $1 ORDER BY id',
    [`%${keyword}%`]
  );
  res.json(rows.map(toDTO));
}));

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients ORDER BY id');
  res.json(rows.map(toDTO));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
  if (rows.length === 0) throw notFound(`Client not found with id: ${req.params.id}`);
  res.json(toDTO(rows[0]));
}));

router.post('/', asyncHandler(async (req, res) => {
  const errors = validate(req.body || {});
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);
  const { clientName, companyName = null, phone, email, address = null } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO clients (client_name, company_name, phone, email, address)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [clientName.trim(), companyName || null, phone.trim(), email.trim(), address || null]
  );
  res.json(toDTO(rows[0]));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const errors = validate(req.body || {});
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);
  const existing = await pool.query('SELECT id FROM clients WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) throw notFound(`Client not found with id: ${req.params.id}`);
  const { clientName, companyName = null, phone, email, address = null } = req.body;
  const { rows } = await pool.query(
    `UPDATE clients SET client_name=$1, company_name=$2, phone=$3, email=$4, address=$5, updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [clientName.trim(), companyName || null, phone.trim(), email.trim(), address || null, req.params.id]
  );
  res.json(toDTO(rows[0]));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await pool.query('SELECT id FROM clients WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) throw notFound(`Client not found with id: ${req.params.id}`);
  // Keep projects instead of cascading the delete: unlink them first.
  await pool.query('UPDATE projects SET client_id = NULL, updated_at = NOW() WHERE client_id = $1', [req.params.id]);
  await pool.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
  res.status(204).send();
}));

module.exports = router;
