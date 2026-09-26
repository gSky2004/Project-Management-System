const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'projectms_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '0318',
});

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS admins (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  client_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  address VARCHAR(255)
);
CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  project_name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget DOUBLE PRECISION,
  status VARCHAR(255) NOT NULL,
  client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS team_members (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  full_name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  phone VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  task_title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(255),
  due_date DATE,
  status VARCHAR(255) NOT NULL,
  project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE,
  assigned_member_id BIGINT REFERENCES team_members(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS project_assignments (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id BIGINT NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_date DATE
);
CREATE TABLE IF NOT EXISTS progress_reports (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE,
  progress_percentage DOUBLE PRECISION,
  remarks TEXT
);
`;

async function initDb() {
  await pool.query(SCHEMA_SQL);
  const { rows } = await pool.query('SELECT id FROM admins WHERE username = $1', ['admin']);
  if (rows.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      'INSERT INTO admins (full_name, email, username, password) VALUES ($1, $2, $3, $4)',
      ['System Admin', 'admin@projectms.com', 'admin', hash]
    );
    console.log('Default admin seeded: username=admin, password=admin123');
  }
}

module.exports = { pool, initDb };
