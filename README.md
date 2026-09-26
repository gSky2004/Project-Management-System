# ProjectMS

A full-stack **Project Management System** built on the **PERN stack** — PostgreSQL + Express + React + Node — protected by JWT authentication.

---

## 1. Big Picture

**Backend stack:** Node.js 18+ · Express 4 · PostgreSQL (`pg`) · `jsonwebtoken` · `bcryptjs` · `cors` · `dotenv`

**Frontend stack:** React 18 · Vite · React Router · Axios · Tailwind CSS

The backend follows a simple, direct architecture with no ORM — plain SQL through a shared `pg` connection pool:

```
HTTP request → Route → SQL (pg Pool) → PostgreSQL
                  ↕
        JWT middleware (stateless, everything except /api/auth/** needs a Bearer token)
```

Data flow: JSON arrives at a **route** → validated and normalized → persisted with parameterized SQL → mapped to the API's response shape → JSON is returned.

**Conventions:** routes are thin (HTTP + validation only, no business logic), dates are exchanged as `YYYY-MM-DD` strings, and all errors flow to one centralized error-handling middleware.

---

## 2. Folder / Module Breakdown

```
ProjectMS/
├── backend/
│   ├── package.json               Express app, dependencies, npm scripts
│   ├── .env / .env.example        Port, DB credentials, JWT secret, CORS origin
│   └── src/
│       ├── server.js              Entry point: CORS, JSON parsing, route mounting, listen on 8080
│       ├── config/db.js           pg Pool, schema init (CREATE TABLE IF NOT EXISTS), admin seeder
│       ├── middleware/
│       │   ├── auth.js            JWT Bearer gate (public: /api/auth/**)
│       │   └── errorHandler.js    Centralized 404 / 500 {error} mapping
│       ├── utils/helpers.js       ""→null coercion, date/ID normalization, validators
│       └── routes/                REST endpoints (thin, no business logic)
│           ├── auth.js            Login
│           ├── clients.js         Client CRUD + search
│           ├── projects.js        Project CRUD + search (enriched DTO)
│           ├── teamMembers.js     Team member CRUD
│           ├── tasks.js           Task CRUD + search + by-project
│           ├── assignments.js     Assign / unassign members
│           ├── progressReports.js Report create + listing (reportDate DESC)
│           └── dashboard.js       Aggregated stats
└── frontend/
    ├── package.json               React app, dependencies, Vite scripts
    ├── vite.config.js             Dev server on 5173, proxies /api → http://localhost:8080
    └── src/
        ├── services/api.js        Axios instance (baseURL /api, token + 401 interceptors)
        ├── context/AuthContext.jsx  Token/adminName state backed by localStorage
        ├── App.jsx                Router, private-route gating, layout
        └── pages/                 Login, Dashboard, Projects, Clients, TeamMembers,
                                   Tasks, Assignments, ProgressReports, Reminders
```

### What each backend module is responsible for

| Module | Responsibility |
|---|---|
| `routes/` | Map HTTP routes → validate input → run SQL → return JSON. Zero business logic beyond that ("thin routes"). |
| `config/db.js` | Owns the connection pool, creates missing tables on boot, seeds the default admin. |
| `middleware/auth.js` | Verifies `Authorization: Bearer <JWT>` on every request except login; loads the admin. |
| `middleware/errorHandler.js` | Converts thrown `{status, message}` errors and DB failures into `{error}` JSON responses. |
| `utils/helpers.js` | Normalizes frontend quirks (`""` → `NULL`, numeric strings → numbers, pg `Date` → `YYYY-MM-DD`) and shared validators. |

---

## 3. Domain Model

```
Admin  (login only, no relations)
   │
Client 1 ──── * Project 1 ──── * Task  (assigned to TeamMember)
                │  │  │
                │  │  └──── * ProgressReport   (date, %, remarks)
                │  └─────── * ProjectAssignment (Project ↔ TeamMember)
                └────────── (client_id FK, nullable)
```

Tables: `admins`, `clients`, `projects`, `team_members`, `tasks`, `project_assignments`, `progress_reports` — each with auto-increment `id` plus auto-managed `created_at` / `updated_at` timestamps.

---

## 4. Key Files Explained

### `backend/.env`
- `PORT=8080`
- PostgreSQL connection (`DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` → `projectms_db`)
- `JWT_SECRET` + 24-hour expiration (`JWT_EXPIRATION_MS=86400000`)
- `CORS_ORIGIN=http://localhost:5173`
- ⚠️ Change `JWT_SECRET` and `DB_PASSWORD` for anything beyond local dev.

### `backend/src/server.js`
- **Stateless** auth: every request must carry a JWT except `POST /api/auth/login`.
- CORS allows only `http://localhost:5173` (the Vite dev server) with credentials.
- Mounts all routers under `/api/...`, then a 404 fallback and the error middleware.

### `backend/src/routes/auth.js` — the login pipeline
1. Validates `username` / `password` are non-blank (else `400`).
2. Looks up the admin and checks the password with `bcrypt.compare` (else `401 Invalid username or password`).
3. Signs a JWT (`sub = username`, 24h expiry).
4. Returns `{token, message: "Login successful as <fullName>"}`.

### `backend/src/middleware/auth.js`
- Reads `Authorization: Bearer <token>`, verifies it, reloads the admin, attaches it as `req.user`.
- Missing/invalid tokens → `401 {error}` (the frontend's interceptor redirects to `/login` on 401).

### `backend/src/routes/clients.js` (the canonical CRUD route)
- `GET /search?keyword=` is registered **before** `GET /:id` so Express never mistakes "search" for an id (same for every `by-project` route).
- Search uses `ILIKE %keyword%` (case-insensitive).
- `DELETE` returns `204` empty; everything else returns `200` JSON.

### `backend/src/routes/projects.js`
- Same CRUD pattern plus enrichment in `toEnrichedDTO()`:
  - `completionPercentage` = completed tasks / total tasks × 100
  - total / completed task counts
  - list of assigned member names
- `status` defaults to `"Planning"` when omitted on create; an explicit blank is rejected.
- A null/absent `clientId` on update keeps the existing link.
- Deleting a project deletes its tasks, assignments and reports.

### `backend/src/routes/dashboard.js`
- Aggregate counts, `overdueTasks` = due date before today and not completed.
- Overall completion % = completed projects / total projects.

### `backend/src/middleware/errorHandler.js`
- Thrown 404s → `404 {error}`; duplicate unique values and anything else → `500 {error}`.
- Validation failures are returned directly from the routes as `400 {field: message}`.

### `frontend/src/services/api.js`
- Axios `baseURL: '/api'` (proxied to the backend in dev).
- Request interceptor attaches the stored JWT; response interceptor clears the session and redirects to `/login` on `401`.

---

## 5. Design Principles

| Area | Principle |
|---|---|
| **Routes** | **Single Responsibility** — only HTTP mapping, validation and SQL. |
| **Response mapping** | DB internals never leak: snake_case columns are mapped to the camelCase API contract; related names/counts are computed per resource. |
| **Middleware** | **Separation of Concerns** — auth, error handling and JSON parsing are each one focused unit. |
| **DB access** | One shared pool (`config/db.js`); parameterized queries everywhere — no string-interpolated SQL. |
| **Frontend quirks** | Handled in one place (`utils/helpers.js`): empty-string dates/numbers/FKs become `NULL`, numeric strings become numbers. |

---

## 6. API Overview

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login, returns JWT (public) |
| GET | `/api/dashboard` | Aggregated stats |
| GET/POST/PUT/DELETE | `/api/clients` | Client CRUD |
| GET | `/api/clients/search?keyword=` | Client search |
| GET/POST/PUT/DELETE | `/api/projects` | Project CRUD |
| GET | `/api/projects/search?keyword=` | Project search |
| GET/POST/PUT/DELETE | `/api/tasks` | Task CRUD |
| GET | `/api/tasks/by-project/{projectId}` | Tasks of a project |
| GET | `/api/tasks/search?keyword=` | Task search |
| GET/POST/PUT/DELETE | `/api/team-members` | Team member CRUD |
| GET | `/api/assignments` | All assignments |
| GET | `/api/assignments/by-project/{projectId}` | Assignments of a project |
| POST/DELETE | `/api/assignments` | Assign / unassign a member |
| GET | `/api/progress-reports` | All reports |
| GET | `/api/progress-reports/by-project/{projectId}` | Reports of a project (newest first) |
| POST | `/api/progress-reports` | Create a report |

---

## 7. Running the Project

### Prerequisites
- Node.js 18+
- PostgreSQL running on `localhost:5432` (create a database named `projectms_db`, set credentials in `backend/.env`)

### Backend
```bash
cd backend
cp .env.example .env   # then set DB_PASSWORD (and JWT_SECRET for non-local use)
npm install
npm start              # or: npm run dev (watch mode)
```

Missing tables are created automatically on boot, and a default admin is seeded on first start:
- username: `admin`
- password: `admin123`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` (CORS is pre-configured for this origin; the dev server proxies `/api` to the backend).

---

## 8. Known Observations / Where to Cook Bigger

Honest gaps worth addressing as the project grows:

- **N+1 queries** — project enrichment runs extra queries per project inside list loops. Fine for a demo, slow at scale. Fix with joins/aggregates in a single query.
- **No transactions** — multi-statement deletes are not atomic.
- **No roles/authorities** — only one `Admin` role; every authenticated user can do everything.
- **No duplicate-assignment guard** — the same member can be assigned to the same project twice.
- **POST returns `200` instead of `201 Created`** — minor REST etiquette fix.
- **Frontend** has no tests; backend has no test suite yet.
