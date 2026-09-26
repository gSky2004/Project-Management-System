# ProjectMS Backend — Node.js + Express + PostgreSQL

Port of the former Spring Boot backend. Same API contract on the same port (`8080`),
so the React/Vite frontend in `../frontend` works **unchanged** (it proxies `/api` → `http://localhost:8080`).

## Stack

Express 4 · `pg` (PostgreSQL) · `jsonwebtoken` · `bcryptjs` · `cors` · `dotenv`

## Run

Prerequisites: Node 18+, PostgreSQL running on `localhost:5432` with database `projectms_db`.

```bash
cd backend
cp .env.example .env   # then edit DB_PASSWORD / JWT_SECRET if needed
npm install
npm start              # or: npm run dev (watch mode)
```

On boot the server creates missing tables (`CREATE TABLE IF NOT EXISTS`, same table/column
names the Spring/Hibernate version used) and seeds the default admin if absent:

- username: `admin`
- password: `admin123`

## API contract (identical to the Spring version)

Base `http://localhost:8080`. All routes except `POST /api/auth/login` require
`Authorization: Bearer <JWT>`. Dates are `YYYY-MM-DD` strings. GET/POST/PUT → `200` JSON,
DELETE → `204` empty. Errors: `404 {error}`, `400 {field: message}`, `401 {error}`, `500 {error}`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | `{username, password}` → `{token, message}` (public) |
| GET | `/api/dashboard` | Aggregated stats |
| GET/POST/PUT/DELETE | `/api/clients` (+ `GET /search?keyword=`) | Client CRUD |
| GET/POST/PUT/DELETE | `/api/projects` (+ `GET /search?keyword=`) | Project CRUD (enriched DTO) |
| GET/POST/PUT/DELETE | `/api/team-members` | Team member CRUD |
| GET/POST/PUT/DELETE | `/api/tasks` (+ `/search`, `/by-project/:projectId`) | Task CRUD |
| GET/POST/DELETE | `/api/assignments` (+ `/by-project/:projectId`) | Assign / unassign |
| GET/POST | `/api/progress-reports` (+ `/by-project/:projectId`) | Reports (ordered `reportDate DESC`) |

Route registration order matters: `/search` and `/by-project/:id` are defined **before**
`/:id` so they are never swallowed.

## Behaviour notes / deliberate divergences

- **Unauthenticated requests return `401`** (`{error}`), not Spring's default `403`, so the
  frontend's `401 → redirect to /login` interceptor works.
- **Client delete unlinks** (`projects.client_id → NULL`) instead of Hibernate's
  `CASCADE.ALL` (which would wipe the client's projects). **Project delete still cascades**
  to its tasks / assignments / reports, like the Spring version.
- **Member delete unlinks** tasks (`assigned_member_id → NULL`) and removes assignments
  instead of cascading task deletes.
- **Status defaults**: project create defaults missing status to `"Planning"`, task create to
  `"Pending"`; explicit blank strings still fail validation (`400`), matching `@NotBlank`.
- **Update FK semantics preserved**: a null/absent `clientId` / `projectId` / `assignedMemberId`
  on PUT keeps the old link (does not unlink).
- **Frontend quirks handled**: empty-string dates/numbers/FKs (`""`) are coerced to `NULL`,
  numeric strings to numbers.
- **Assignment POST without `projectId`/`teamMemberId`** returns `400 {error}` (Spring would
  throw NPE → `500`); the frontend always sends both.
- **Duplicate unique emails** return `500 {error}` like Spring's `DataIntegrityViolation`.
- Secrets live in `.env` (see `.env.example`), not hardcoded — fixes the hardcoded-secret
  observation from the Spring version.

## Layout

```
backend/
├── package.json
├── .env(.example)
├── src/
│   ├── server.js            # app bootstrap, CORS, route mounting
│   ├── config/db.js         # pg Pool, schema init, admin seeder
│   ├── middleware/auth.js   # JWT Bearer gate (public: /api/auth/**)
│   ├── middleware/errorHandler.js
│   ├── utils/helpers.js     # date/ID coercion, validation helpers
│   └── routes/              # auth, clients, projects, teamMembers, tasks,
                             # assignments, progressReports, dashboard
```
