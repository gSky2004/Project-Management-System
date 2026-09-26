const express = require('express');
const { pool } = require('../config/db');
const {
  asyncHandler, notFound, isBlank, isDateString, toISODate, emptyToNull, toId,
} = require('../utils/helpers');

const router = express.Router();

function toDTO(row) {
  return {
    id: Number(row.id),
    taskTitle: row.task_title,
    description: row.description,
    priority: row.priority,
    dueDate: toISODate(row.due_date),
    status: row.status,
    projectId: row.project_id === null || row.project_id === undefined ? null : Number(row.project_id),
    projectName: row.project_name || null,
    assignedMemberId: row.assigned_member_id === null || row.assigned_member_id === undefined
      ? null
      : Number(row.assigned_member_id),
    assignedMemberName: row.full_name || null,
  };
}

async function fetchTaskRow(id) {
  const { rows } = await pool.query(
    `SELECT t.*, p.project_name, tm.full_name FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN team_members tm ON tm.id = t.assigned_member_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] || null;
}

function validateCreate(body) {
  const errors = {};
  if (isBlank(body.taskTitle)) errors.taskTitle = 'must not be blank';
  if (body.status !== undefined && body.status !== null && isBlank(body.status)) {
    errors.status = 'must not be blank';
  }
  if (emptyToNull(body.dueDate) !== null && !isDateString(body.dueDate)) {
    errors.dueDate = 'must be a valid YYYY-MM-DD date';
  }
  return errors;
}

function validateUpdate(body) {
  const errors = {};
  if (isBlank(body.taskTitle)) errors.taskTitle = 'must not be blank';
  if (isBlank(body.status)) errors.status = 'must not be blank';
  if (emptyToNull(body.dueDate) !== null && !isDateString(body.dueDate)) {
    errors.dueDate = 'must be a valid YYYY-MM-DD date';
  }
  return errors;
}

router.get('/search', asyncHandler(async (req, res) => {
  const keyword = req.query.keyword ?? '';
  const { rows } = await pool.query(
    `SELECT t.*, p.project_name, tm.full_name FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN team_members tm ON tm.id = t.assigned_member_id
     WHERE t.task_title ILIKE $1 ORDER BY t.id`,
    [`%${keyword}%`]
  );
  res.json(rows.map(toDTO));
}));

router.get('/by-project/:projectId', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, p.project_name, tm.full_name FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN team_members tm ON tm.id = t.assigned_member_id
     WHERE t.project_id = $1 ORDER BY t.id`,
    [req.params.projectId]
  );
  res.json(rows.map(toDTO));
}));

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT t.*, p.project_name, tm.full_name FROM tasks t
     LEFT JOIN projects p ON p.id = t.project_id
     LEFT JOIN team_members tm ON tm.id = t.assigned_member_id ORDER BY t.id`
  );
  res.json(rows.map(toDTO));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const row = await fetchTaskRow(req.params.id);
  if (!row) throw notFound('Task not found');
  res.json(toDTO(row));
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = validateCreate(body);
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  const status = emptyToNull(body.status) === null ? 'Pending' : body.status.trim();
  const projectId = toId(body.projectId);
  const assignedMemberId = toId(body.assignedMemberId);
  if (projectId !== null && typeof projectId !== 'number') {
    return res.status(400).json({ projectId: 'must be a number' });
  }
  if (assignedMemberId !== null && typeof assignedMemberId !== 'number') {
    return res.status(400).json({ assignedMemberId: 'must be a number' });
  }
  if (projectId !== null) {
    const p = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (p.rows.length === 0) throw notFound('Project not found');
  }
  if (assignedMemberId !== null) {
    const m = await pool.query('SELECT id FROM team_members WHERE id = $1', [assignedMemberId]);
    if (m.rows.length === 0) throw notFound('TeamMember not found');
  }

  const { rows } = await pool.query(
    `INSERT INTO tasks (task_title, description, priority, due_date, status, project_id, assigned_member_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      body.taskTitle.trim(),
      emptyToNull(body.description),
      emptyToNull(body.priority),
      emptyToNull(body.dueDate),
      status,
      projectId,
      assignedMemberId,
    ]
  );
  res.json(toDTO((await fetchTaskRow(rows[0].id))));
}));

// Mirrors TaskServiceImpl.updateTask: null/absent FKs keep the old link.
router.put('/:id', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = validateUpdate(body);
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  const current = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
  if (current.rows.length === 0) throw notFound('Task not found');
  const old = current.rows[0];

  let projectId = old.project_id === null ? null : Number(old.project_id);
  let assignedMemberId = old.assigned_member_id === null ? null : Number(old.assigned_member_id);
  const nextProjectId = toId(body.projectId);
  const nextMemberId = toId(body.assignedMemberId);
  if (nextProjectId !== null) {
    if (typeof nextProjectId !== 'number') return res.status(400).json({ projectId: 'must be a number' });
    const p = await pool.query('SELECT id FROM projects WHERE id = $1', [nextProjectId]);
    if (p.rows.length === 0) throw notFound('Project not found');
    projectId = nextProjectId;
  }
  if (nextMemberId !== null) {
    if (typeof nextMemberId !== 'number') return res.status(400).json({ assignedMemberId: 'must be a number' });
    const m = await pool.query('SELECT id FROM team_members WHERE id = $1', [nextMemberId]);
    if (m.rows.length === 0) throw notFound('TeamMember not found');
    assignedMemberId = nextMemberId;
  }

  await pool.query(
    `UPDATE tasks SET task_title=$1, description=$2, priority=$3, due_date=$4, status=$5,
     project_id=$6, assigned_member_id=$7, updated_at=NOW() WHERE id=$8`,
    [
      body.taskTitle.trim(),
      emptyToNull(body.description),
      emptyToNull(body.priority),
      emptyToNull(body.dueDate),
      body.status.trim(),
      projectId,
      assignedMemberId,
      req.params.id,
    ]
  );
  res.json(toDTO((await fetchTaskRow(req.params.id))));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await pool.query('SELECT id FROM tasks WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) throw notFound('Task not found');
  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.status(204).send();
}));

module.exports = router;
