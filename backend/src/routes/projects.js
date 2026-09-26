const express = require('express');
const { pool } = require('../config/db');
const {
  asyncHandler, notFound, isBlank, isDateString, toISODate, emptyToNull, toId, toNumberOrNull,
} = require('../utils/helpers');

const router = express.Router();

async function toEnrichedDTO(row) {
  const totalRes = await pool.query('SELECT COUNT(*)::int AS c FROM tasks WHERE project_id = $1', [row.id]);
  const doneRes = await pool.query(
    "SELECT COUNT(*)::int AS c FROM tasks WHERE project_id = $1 AND status = 'Completed'",
    [row.id]
  );
  const membersRes = await pool.query(
    `SELECT tm.full_name FROM project_assignments pa
     JOIN team_members tm ON tm.id = pa.team_member_id
     WHERE pa.project_id = $1 ORDER BY pa.id`,
    [row.id]
  );
  const totalTasks = totalRes.rows[0].c;
  const completedTasks = doneRes.rows[0].c;
  return {
    id: Number(row.id),
    projectName: row.project_name,
    description: row.description,
    startDate: toISODate(row.start_date),
    endDate: toISODate(row.end_date),
    budget: row.budget === null || row.budget === undefined ? null : Number(row.budget),
    status: row.status,
    clientId: row.client_id === null || row.client_id === undefined ? null : Number(row.client_id),
    clientName: row.client_name || null,
    completionPercentage: totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100,
    totalTasks,
    completedTasks,
    assignedMembers: membersRes.rows.map((r) => r.full_name),
  };
}

async function fetchProjectRow(id) {
  const { rows } = await pool.query(
    `SELECT p.*, c.client_name FROM projects p
     LEFT JOIN clients c ON c.id = p.client_id
     WHERE p.id = $1`,
    [id]
  );
  return rows[0] || null;
}

function validateCreate(body) {
  const errors = {};
  if (isBlank(body.projectName)) errors.projectName = 'must not be blank';
  // Spring defaults a missing status to "Planning" but rejects an explicit blank one.
  if (body.status !== undefined && body.status !== null && isBlank(body.status)) {
    errors.status = 'must not be blank';
  }
  return errors;
}

function validateDatesAndBudget(body) {
  const errors = {};
  for (const f of ['startDate', 'endDate']) {
    if (emptyToNull(body[f]) !== null && !isDateString(body[f])) errors[f] = 'must be a valid YYYY-MM-DD date';
  }
  if (emptyToNull(body.budget) !== null && typeof toNumberOrNull(body.budget) !== 'number') {
    errors.budget = 'must be a number';
  }
  return errors;
}
function validateUpdate(body) {
  const errors = {};
  if (isBlank(body.projectName)) errors.projectName = 'must not be blank';
  if (isBlank(body.status)) errors.status = 'must not be blank';
  return errors;
}

router.get('/search', asyncHandler(async (req, res) => {
  const keyword = req.query.keyword ?? '';
  const { rows } = await pool.query(
    `SELECT p.*, c.client_name FROM projects p
     LEFT JOIN clients c ON c.id = p.client_id
     WHERE p.project_name ILIKE $1 ORDER BY p.id`,
    [`%${keyword}%`]
  );
  res.json(await Promise.all(rows.map(toEnrichedDTO)));
}));

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT p.*, c.client_name FROM projects p
     LEFT JOIN clients c ON c.id = p.client_id ORDER BY p.id`
  );
  res.json(await Promise.all(rows.map(toEnrichedDTO)));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const row = await fetchProjectRow(req.params.id);
  if (!row) throw notFound(`Project not found with id: ${req.params.id}`);
  res.json(await toEnrichedDTO(row));
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = { ...validateCreate(body), ...validateDatesAndBudget(body) };
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  const status = emptyToNull(body.status) === null ? 'Planning' : body.status.trim();
  const clientId = toId(body.clientId);
  if (clientId !== null && typeof clientId !== 'number') {
    return res.status(400).json({ clientId: 'must be a number' });
  }
  if (clientId !== null) {
    const c = await pool.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (c.rows.length === 0) throw notFound('Client not found');
  }

  const { rows } = await pool.query(
    `INSERT INTO projects (project_name, description, start_date, end_date, budget, status, client_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      body.projectName.trim(),
      emptyToNull(body.description),
      emptyToNull(body.startDate),
      emptyToNull(body.endDate),
      toNumberOrNull(body.budget),
      status,
      clientId,
    ]
  );
  res.json(await toEnrichedDTO((await fetchProjectRow(rows[0].id))));
}));

// Mirrors ProjectServiceImpl.updateProject: a null/absent clientId keeps the old link.
router.put('/:id', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = { ...validateUpdate(body), ...validateDatesAndBudget(body) };
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  const existing = await fetchProjectRow(req.params.id);
  if (!existing) throw notFound(`Project not found with id: ${req.params.id}`);

  const clientId = toId(body.clientId);
  let nextClientId = existing.client_id === null ? null : Number(existing.client_id);
  if (clientId !== null) {
    if (typeof clientId !== 'number') return res.status(400).json({ clientId: 'must be a number' });
    const c = await pool.query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if (c.rows.length === 0) throw notFound('Client not found');
    nextClientId = clientId;
  }

  await pool.query(
    `UPDATE projects SET project_name=$1, description=$2, start_date=$3, end_date=$4,
     budget=$5, status=$6, client_id=$7, updated_at=NOW() WHERE id=$8`,
    [
      body.projectName.trim(),
      emptyToNull(body.description),
      emptyToNull(body.startDate),
      emptyToNull(body.endDate),
      toNumberOrNull(body.budget),
      body.status.trim(),
      nextClientId,
      req.params.id,
    ]
  );
  res.json(await toEnrichedDTO((await fetchProjectRow(req.params.id))));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await pool.query('SELECT id FROM projects WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) throw notFound(`Project not found with id: ${req.params.id}`);
  // Replicates JPA cascade: deleting a project deletes its tasks, assignments and reports.
  await pool.query('DELETE FROM tasks WHERE project_id = $1', [req.params.id]);
  await pool.query('DELETE FROM project_assignments WHERE project_id = $1', [req.params.id]);
  await pool.query('DELETE FROM progress_reports WHERE project_id = $1', [req.params.id]);
  await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
  res.status(204).send();
}));

module.exports = router;
