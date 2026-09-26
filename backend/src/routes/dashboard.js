const express = require('express');
const { pool } = require('../config/db');
const { asyncHandler, todayISO } = require('../utils/helpers');

const router = express.Router();

// GET /api/dashboard — mirrors DashboardServiceImpl.getDashboardData().
router.get('/', asyncHandler(async (req, res) => {
  const [[totalProjects], [totalClients], [totalMembers], [totalTasks], [completed], [ongoing], [overdue]] =
    await Promise.all([
      pool.query('SELECT COUNT(*)::int AS c FROM projects').then((r) => r.rows),
      pool.query('SELECT COUNT(*)::int AS c FROM clients').then((r) => r.rows),
      pool.query('SELECT COUNT(*)::int AS c FROM team_members').then((r) => r.rows),
      pool.query('SELECT COUNT(*)::int AS c FROM tasks').then((r) => r.rows),
      pool.query("SELECT COUNT(*)::int AS c FROM projects WHERE status = 'Completed'").then((r) => r.rows),
      pool.query("SELECT COUNT(*)::int AS c FROM projects WHERE status = 'In Progress'").then((r) => r.rows),
      pool.query(
        "SELECT COUNT(*)::int AS c FROM tasks WHERE due_date < $1 AND status <> 'Completed'",
        [todayISO()]
      ).then((r) => r.rows),
    ]);

  const total = totalProjects.c;
  const completedProjects = completed.c;
  res.json({
    totalProjects: total,
    totalClients: totalClients.c,
    totalTeamMembers: totalMembers.c,
    totalTasks: totalTasks.c,
    completedProjects,
    ongoingProjects: ongoing.c,
    overdueTasks: overdue.c,
    projectCompletionPercentage: total > 0 ? (completedProjects / total) * 100 : 0,
  });
}));

module.exports = router;
