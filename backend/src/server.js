require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./config/db');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const projectRoutes = require('./routes/projects');
const teamMemberRoutes = require('./routes/teamMembers');
const taskRoutes = require('./routes/tasks');
const assignmentRoutes = require('./routes/assignments');
const progressReportRoutes = require('./routes/progressReports');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = Number(process.env.PORT || 8080);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'],
  credentials: true,
}));
app.use(express.json());

// JWT gate: everything under /api except /api/auth/** requires a Bearer token.
app.use(authMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/team-members', teamMemberRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/progress-reports', progressReportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

async function start() {
  try {
    await initDb();
  } catch (err) {
    console.error('Failed to connect to PostgreSQL. Is it running? Check .env DB_* settings.');
    console.error(err.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`ProjectMS backend (Express) listening on http://localhost:${PORT}`));
}

start();

module.exports = app;
