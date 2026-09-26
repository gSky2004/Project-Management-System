const express = require('express');
const { pool } = require('../config/db');
const {
  asyncHandler, notFound, isDateString, toISODate, emptyToNull, toId, todayISO,
} = require('../utils/helpers');

const router = express.Router();

function toDTO(row) {
  return {
    id: Number(row.id),
    projectId: Number(row.project_id),
    projectName: row.project_name,
    teamMemberId: Number(row.team_member_id),
    teamMemberName: row.full_name,
    assignedDate: toISODate(row.assigned_date),
  };
}

async function fetchRow(id) {
  const { rows } = await pool.query(
    `SELECT pa.*, p.project_name, tm.full_name FROM project_assignments pa
     JOIN projects p ON p.id = pa.project_id
     JOIN team_members tm ON tm.id = pa.team_member_id
     WHERE pa.id = $1`,
    [id]
  );
  return rows[0] || null;
}

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT pa.*, p.project_name, tm.full_name FROM project_assignments pa
     JOIN projects p ON p.id = pa.project_id
     JOIN team_members tm ON tm.id = pa.team_member_id ORDER BY pa.id`
  );
  res.json(rows.map(toDTO));
}));

router.get('/by-project/:projectId', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT pa.*, p.project_name, tm.full_name FROM project_assignments pa
     JOIN projects p ON p.id = pa.project_id
     JOIN team_members tm ON tm.id = pa.team_member_id
     WHERE pa.project_id = $1 ORDER BY pa.id`,
    [req.params.projectId]
  );
  res.json(rows.map(toDTO));
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const projectId = toId(body.projectId);
  const teamMemberId = toId(body.teamMemberId);
  if (projectId === null || teamMemberId === null) {
    return res.status(400).json({ error: 'projectId and teamMemberId are required' });
  }
  if (typeof projectId !== 'number' || typeof teamMemberId !== 'number') {
    return res.status(400).json({ error: 'projectId and teamMemberId must be numbers' });
  }
  const p = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
  if (p.rows.length === 0) throw notFound('Project not found');
  const m = await pool.query('SELECT id FROM team_members WHERE id = $1', [teamMemberId]);
  if (m.rows.length === 0) throw notFound('TeamMember not found');

  const assignedDate = emptyToNull(body.assignedDate) === null ? todayISO() : body.assignedDate;
  if (!isDateString(assignedDate)) {
    return res.status(400).json({ assignedDate: 'must be a valid YYYY-MM-DD date' });
  }
  const { rows } = await pool.query(
    'INSERT INTO project_assignments (project_id, team_member_id, assigned_date) VALUES ($1, $2, $3) RETURNING id',
    [projectId, teamMemberId, assignedDate]
  );
  res.json(toDTO((await fetchRow(rows[0].id))));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const existing = await pool.query('SELECT id FROM project_assignments WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) throw notFound('Assignment not found');
  await pool.query('DELETE FROM project_assignments WHERE id = $1', [req.params.id]);
  res.status(204).send();
}));

module.exports = router;
