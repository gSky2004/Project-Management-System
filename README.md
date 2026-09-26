<<<<<<< HEAD
# ProjectMS

A full-stack **Project Management System**. Spring Boot backend + React/Vite frontend, protected by JWT authentication.

---

## 1. Big Picture

**Backend stack:** Spring Boot 3.2 · Java 17 · Maven · PostgreSQL · JPA/Hibernate · Spring Security · JJWT

The backend follows a classic **layered architecture**:

```
HTTP request → Controller → Service (Impl) → Repository → PostgreSQL
                          ↕  DTO  ↕
              JWT filter → Security (stateless)
```

Data flow: JSON arrives as a **DTO** → service converts it into an **Entity** → repository persists it → service converts back into a **DTO** → JSON is returned.

**Rule of the layering:** Entities never leave the service layer, and controllers never see a repository or an entity — only DTOs and service interfaces.

---

## 2. Folder / Module Breakdown

```
backend/
├── pom.xml                          Maven build, dependencies, Java 17
├── src/main/java/com/projectms/
│   ├── ProjectMsApplication.java    Entry point (@SpringBootApplication)
│   ├── config/
│   │   ├── SecurityConfig.java      HTTP security, CORS, password encoder
│   │   └── DataSeeder.java          Seeds default admin on startup
│   ├── controller/                  REST endpoints (thin, no business logic)
│   │   ├── AuthController.java
│   │   ├── ClientController.java
│   │   ├── ProjectController.java
│   │   ├── TaskController.java
│   │   ├── TeamMemberController.java
│   │   ├── ProjectAssignmentController.java
│   │   ├── ProgressReportController.java
│   │   └── DashboardController.java
│   ├── dto/                         Request/response payloads (with validation)
│   │   ├── LoginRequest.java / LoginResponse.java
│   │   ├── ClientDTO.java / ProjectDTO.java / TaskDTO.java
│   │   ├── TeamMemberDTO.java / ProjectAssignmentDTO.java
│   │   ├── ProgressReportDTO.java / DashboardDTO.java
│   ├── entity/                      JPA entities mapped to database tables
│   │   ├── BaseEntity.java          Shared id / createdAt / updatedAt
│   │   ├── Admin.java  Client.java  Project.java
│   │   ├── Task.java  TeamMember.java
│   │   ├── ProjectAssignment.java  ProgressReport.java
│   ├── repository/                  Spring Data JPA interfaces (auto-generated SQL)
│   ├── service/                     Interfaces (contracts)
│   ├── service/impl/                Implementations (business logic)
│   ├── security/                    JWT token + filter + user loading
│   │   ├── JwtTokenProvider.java
│   │   ├── JwtAuthenticationFilter.java
│   │   └── CustomUserDetailsService.java
│   └── exception/                   Global error handling
│       ├── ResourceNotFoundException.java
│       └── GlobalExceptionHandler.java
└── src/main/resources/
    └── application.properties       Port, DB, JPA, JWT config
```

### What each module is responsible for

| Folder | Responsibility |
|---|---|
| `controller/` | Map HTTP routes → delegate to a service. Zero business logic ("thin controllers"). |
| `dto/` | Plain-Java payload classes with Bean Validation annotations. Define the API contract. |
| `entity/` | JPA entities. Map Java objects to tables; define relationships. |
| `repository/` | Spring Data interfaces. Method names generate SQL automatically. |
| `service/` + `service/impl/` | Interface (contract) + implementation (all business logic). |
| `security/` | JWT creation/validation, per-request auth filter, admin lookup for login. |
| `config/` | Security filter chain, CORS, password hashing, startup seeding. |
| `exception/` | Centralized conversion of exceptions → HTTP responses. |

---

## 3. Domain Model

```
Admin  (login only, no relations)
   │
Client 1 ──── * Project 1 ──── * Task  (assigned to TeamMember)
                │  │  │
                │  │  └──── * ProgressReport   (date, %, remarks)
                │  └─────── * ProjectAssignment (Project ↔ TeamMember)
                └────────── (client_id FK)
```

All entities extend `BaseEntity`, which provides the auto-generated primary key and auto-managed `createdAt` / `updatedAt` timestamps.

---

## 4. Key Files Explained (line-by-line highlights)

### `application.properties`
- `server.port=8080`
- PostgreSQL connection to `projectms_db`, user `postgres`
- `spring.jpa.hibernate.ddl-auto=update` — Hibernate creates/alters tables from entities automatically
- JWT secret key + 24-hour expiration (`86400000` ms)
- ⚠️ Secrets are hardcoded. Move them to environment variables for anything beyond local dev.

### `SecurityConfig.java`
- **Stateless** sessions: every request must carry a JWT (`SessionCreationPolicy.STATELESS`).
- `/api/auth/**` (login) is public; every other `/api/**` request requires authentication.
- The `JwtAuthenticationFilter` is inserted *before* Spring's username/password filter (chain of responsibility).
- Beans provided: `BCryptPasswordEncoder`, `AuthenticationManager`, and CORS allowing only `http://localhost:5173` (the Vite dev server).

### `AuthServiceImpl.login()` — the login pipeline
1. `authenticationManager.authenticate(...)` verifies credentials (BCrypt check via `CustomUserDetailsService`).
2. Re-fetches the `Admin` row to get the display name.
3. `JwtTokenProvider.generateToken(...)` issues a signed JWT.
4. Returns `LoginResponse(token, "Login successful as <name>")`.

### `JwtTokenProvider.java`
- Builds an HMAC key from the secret.
- `generateToken` — signs a token (username as subject, issued-at + expiry).
- `validateToken` / `getUsernameFromToken` — parse and verify signature.

### `JwtAuthenticationFilter.java`
- Runs once per request (`OncePerRequestFilter`).
- Reads `Authorization: Bearer <token>`, validates it, loads the user, and sets the `Authentication` in the `SecurityContextHolder` → the request is then treated as authenticated.

### `ClientController.java` (the canonical CRUD controller)
- `@RestController` + `@RequestMapping("/api/clients")`.
- Uses `@PathVariable` (id), `@RequestBody` (payload), `@RequestParam` (search), and always returns `ResponseEntity<...>` with the right HTTP status.

### `ClientServiceImpl.java`
- `getAllClients` → `findAll()` then maps each entity → DTO via private `toDTO()`.
- `getClientById` → `orElseThrow(ResourceNotFoundException)` (safe lookup).
- `create` / `update` → copy DTO fields onto entity, `save`, return DTO.
- `delete` → existence check first, then delete.
- `search` → derived query `findByClientNameContainingIgnoreCase`.

### `ProjectServiceImpl.java`
- Same pattern plus relations: resolves `clientId` → `Client` entity, and `toDTO()` computes:
  - `completionPercentage` = completed tasks / total tasks × 100 (JPQL count queries)
  - total / completed task counts
  - list of assigned member names (from the assignment repository)

### `DashboardServiceImpl.java`
- Aggregate counts: `count()`, `countByStatus("Completed")`, `countByStatus("In Progress")`.
- `overdueTasks` = due date before today and not completed.
- Overall completion % = completed projects / total projects.

### `BaseEntity.java`
- `@MappedSuperclass` → not a table itself; its fields are inherited by every table.
- `@Id @GeneratedValue(strategy = IDENTITY)` → auto-increment primary key.
- `@PrePersist` / `@PreUpdate` callbacks set `createdAt` / `updatedAt` automatically.

### `Project.java`
- Relationship mapping: `@ManyToOne` → Client (lazy), `@OneToMany` → Tasks/Assignments/Reports with `cascade = ALL` (deleting a project deletes its children) and `FetchType.LAZY`.

### `GlobalExceptionHandler.java`
- `@RestControllerAdvice` intercepts exceptions from any layer:
  - `ResourceNotFoundException` → `404`
  - `BadCredentialsException` → `401` "Invalid username or password"
  - `MethodArgumentNotValidException` → `400` with per-field validation errors
  - any other `Exception` → `500`

---

## 5. Design Principles per Module

| Module | Principle |
|---|---|
| **Controller** | **Single Responsibility** — only HTTP mapping, no business logic. **Facade** — one endpoint wraps a service call. |
| **DTO** | **Encapsulation / Separation of Concerns** — entities never leak to the API; prevents exposing DB internals and circular lazy-loading serialization. |
| **Service** | **Interface Segregation + Dependency Inversion** — controllers depend on interfaces, not concrete classes. **Single Responsibility** — all business logic lives here. |
| **Repository** | **Repository / DAO pattern** — Spring Data generates queries from method names; an abstraction over persistence. |
| **Entity** | **Inheritance** (`BaseEntity` `@MappedSuperclass` → DRY for id/timestamps) + **Composition** (entities *have-a* other entities via JPA relations). |
| **Security** | **Chain of Responsibility** (filter chain) · **Stateless JWT auth** · **Single Responsibility** (token logic / filter / user-loading are separate classes). |
| **Exception** | **DRY + centralized error handling** — layers throw, one `@RestControllerAdvice` maps exceptions to HTTP. |
| **Config** | **Inversion of Control / Dependency Injection** — constructor injection everywhere; Spring provides the beans. |

### Cross-cutting
- **Layered architecture / Dependency Rule** — each layer talks only to the layer below it, and only through interfaces.
- Note: inheritance is used (mainly `BaseEntity`), but the architecture leans most heavily on **interfaces, encapsulation, and composition** — plus Spring framework conventions.

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
| GET | `/api/progress-reports/by-project/{projectId}` | Reports of a project |
| POST | `/api/progress-reports` | Create a report |

---

## 7. Running the Project

### Prerequisites
- Java 17+
- Maven
- PostgreSQL running on `localhost:5432` with a database named `projectms_db` (user/password in `application.properties`)

### Backend
```bash
cd backend
mvn spring-boot:run
```

A default admin is seeded automatically on first start:
- username: `admin`
- password: `admin123`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` (CORS is pre-configured for this origin).

---

## 8. Known Observations / Where to Cook Bigger

These are honest gaps worth addressing as the project grows:

- **N+1 queries** — `ProjectServiceImpl.toDTO()` runs 3+ extra queries per project inside list loops. Fine for a demo, slow at scale. Fix with `JOIN FETCH` or projections.
- **No `@Transactional`** — multi-repository operations are not atomic.
- **No roles/authorities** — only one `Admin` role; every authenticated user can do everything. No per-entity ownership.
- **Dead repository methods** — `ProjectAssignmentRepository.existsByProjectIdAndTeamMemberId` / `deleteByProjectIdAndTeamMemberId` are unused, and there is no duplicate-assignment guard.
- **POST returns `200` instead of `201 Created`** — minor REST etiquette fix.
- **Hardcoded secrets** — JWT secret + DB credentials should move to environment variables / Spring profiles.
- **Frontend** has no tests; backend has no test classes yet (Spring Boot Test starter is already in `pom.xml`).
=======
# Project-Management-System
This its for managing the projects ,most companies accept alot of projects and then they fail to manage them as a result some of them get delayed and it can led them to loose trust so to increase trust and manage their product to make sure they deliver ontime and assign task to members and work on team so that they can deliver things on time,good
>>>>>>> 05d494ad903e64d8dad7e55c5edef5a4e2c24813
