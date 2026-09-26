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
    reportDate: toISODate(row.report_date),
    progressPercentage: row.progress_percentage === null || row.progress_percentage === undefined
      ? null
      : Number(row.progress_percentage),
    remarks: row.remarks,
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*, p.project_name FROM progress_reports r
     JOIN projects p ON p.id = r.project_id ORDER BY r.id`
  );
  res.json(rows.map(toDTO));
}));

router.get('/by-project/:projectId', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*, p.project_name FROM progress_reports r
     JOIN projects p ON p.id = r.project_id
     WHERE r.project_id = $1 ORDER BY r.report_date DESC NULLS LAST, r.id DESC`,
    [req.params.projectId]
  );
  res.json(rows.map(toDTO));
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const errors = {};
  // Mirrors @NotNull on projectId / progressPercentage.
  if (emptyToNull(body.projectId) === null) errors.projectId = 'must not be null';
  if (emptyToNull(body.progressPercentage) === null) errors.progressPercentage = 'must not be null';
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  const projectId = toId(body.projectId);
  if (typeof projectId !== 'number') return res.status(400).json({ projectId: 'must be a number' });
  const p = await pool.query('SELECT id FROM projects WHERE id = $1', [projectId]);
  if (p.rows.length === 0) throw notFound('Project not found');

  const progressPercentage = Number(body.progressPercentage);
  if (Number.isNaN(progressPercentage)) {
    return res.status(400).json({ progressPercentage: 'must be a number' });
  }
  const reportDate = emptyToNull(body.reportDate) === null ? todayISO() : body.reportDate;
  if (!isDateString(reportDate)) {
    return res.status(400).json({ reportDate: 'must be a valid YYYY-MM-DD date' });
  }

  const { rows } = await pool.query(
    `INSERT INTO progress_reports (project_id, report_date, progress_percentage, remarks)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [projectId, reportDate, progressPercentage, emptyToNull(body.remarks)]
  );
  const created = await pool.query(
    `SELECT r.*, p.project_name FROM progress_reports r
     JOIN projects p ON p.id = r.project_id WHERE r.id = $1`,
    [rows[0].id]
  );
  res.json(toDTO(created.rows[0]));
}));

module.exports = router;
