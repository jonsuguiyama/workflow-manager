# Workflow Manager

[![Test](https://github.com/jonsuguiyama/workflow-manager/actions/workflows/test.yml/badge.svg)](https://github.com/jonsuguiyama/workflow-manager/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/jonsuguiyama/workflow-manager/graph/badge.svg)](https://codecov.io/gh/jonsuguiyama/workflow-manager)
[![Version](https://img.shields.io/github/package-json/v/jonsuguiyama/workflow-manager)](https://github.com/jonsuguiyama/workflow-manager/blob/main/package.json)
[![License](https://img.shields.io/github/license/jonsuguiyama/workflow-manager)](https://github.com/jonsuguiyama/workflow-manager/blob/main/LICENSE.md)

A Kanban-style task board with real authentication, drag-and-drop reordering, server-side filtering, and an isolated sandbox per visitor.

**Live demo:** [kanbanetic.vercel.app](https://kanbanetic.vercel.app) - click "Access Live Demo Version," no account needed.

## Features

- **Isolated demo sessions** - every visitor gets their own cloned copy of a template board (Postgres, one-to-many relationship, `ON DELETE CASCADE`). Nothing you do is visible to anyone else.
- **Secure session lifecycle** - JWT sessions delivered via server-side `HttpOnly` cookies, never `localStorage`.
- **Automated session cleanup** - demo accounts older than 24h are deleted automatically (`server/src/utils/sessionCleanup.js`), so the database doesn't grow unbounded. Runs on a schedule locally/on Render; on Vercel it's triggered by Vercel Cron hitting `/api/cron/cleanup`, since serverless functions don't stay warm for `setInterval`.
- **Reactive state management** - built with Angular Signals, no NgRx.
- **Drag & drop** - Angular CDK, optimistic UI updates with backend-persisted ordering.
- **Server-side filtering** - `GET /api/tasks?priority=high&search=...`, not client-side filtering.
- **Responsive, mobile-first layout.**

## Tech Stack

**Frontend:** Angular 21 (standalone components, Signals), Angular Material + CDK, SCSS

**Backend:** Node.js, Express 5, PostgreSQL (raw `pg` connection pooling, no ORM), JWT + Bcrypt + Cookie-Parser

**Testing:** Vitest across both client and server - client tests use Angular's built-in Vitest-based test runner; server tests run against a real Postgres test database via Supertest, not a mocked connection.

**Infrastructure:** Docker (multi-stage build), GitHub Actions CI, deployed on Vercel (Express wrapped as a serverless function + Vercel Cron)

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 22+
- A local PostgreSQL instance

### Setup

1. **Clone and set up the database:**

   ```bash
   git clone https://github.com/jonsuguiyama/workflow-manager
   cd workflow-manager
   createdb workflow_manager
   psql -d workflow_manager -f server/src/db/schema.sql
   ```

   `schema.sql` is the versioned source of truth for the schema - it creates the tables, the `users.id → tasks.user_id` foreign key with `ON DELETE CASCADE`, and seeds the template account every demo session clones from.

2. **Configure and start the backend:**

   ```bash
   cd server
   cp .env.example .env   # fill in DB_* vars and JWT_SECRET
   npm install
   npm run dev
   ```

   API runs on <http://localhost:3000>.

3. **Start the frontend:**

   ```bash
   cd client
   npm install
   npm start
   ```

   Open <http://localhost:4200>.

## Database Schema

`server/src/db/schema.sql` creates two tables:

**`users`**

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `email` | `VARCHAR(255) UNIQUE NOT NULL` | |
| `password_hash` | `VARCHAR(255) NOT NULL` | bcrypt hash; demo accounts get a random one |
| `role` | `VARCHAR(50) NOT NULL DEFAULT 'user'` | |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | read by `sessionCleanup.js` to find accounts older than 24h |

**`tasks`**

| Column | Type | Notes |
|---|---|---|
| `id` | `SERIAL PRIMARY KEY` | |
| `title` | `VARCHAR(255) NOT NULL` | |
| `description` | `TEXT` | |
| `status` | `VARCHAR(50) NOT NULL DEFAULT 'todo'` | `'todo'` or `'done'` |
| `priority` | `VARCHAR(50) NOT NULL DEFAULT 'low'` | `'low'`, `'medium'`, or `'high'` |
| `order` | `INTEGER NOT NULL DEFAULT 0` | position within its column; quoted in SQL since `order` is a reserved word |
| `user_id` | `INTEGER NOT NULL` | FK to `users.id`, `ON DELETE CASCADE` |
| `created_at` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |

`schema.sql` also seeds a template account (`id = 1`, `admin@workflow.com`) and its starter tasks. This is the row every "Access Live Demo Version" click clones into a fresh, throwaway account (see `POST /api/auth/demo` in `authRoutes.js`).

## Testing

```bash
cd client && npm test   # Angular's Vitest-based runner
cd server && npm test   # Vitest + Supertest against a real Postgres test database
```

Server tests automatically provision a dedicated `workflow_manager_test` database from `schema.sql` (see `server/vitest.global-setup.js`) - no manual setup needed beyond having Postgres running locally.

Both suites run on every push/PR via [GitHub Actions](.github/workflows/test.yml), alongside a Docker image build to catch container-specific breakage.

## Deployment

### Vercel (used for the live demo)

The Express API is wrapped as a Vercel serverless function (`api/index.js`) and the Angular build is served as static files - see `vercel.json` for the build/rewrite configuration. Required environment variables (Production scope):

| Key | Value |
|---|---|
| `DATABASE_URL` | A Postgres connection string (e.g. [Neon](https://neon.tech), which has a built-in serverless-friendly connection pooler) |
| `JWT_SECRET` | Random string, distinct from your local dev secret |
| `CORS_ORIGIN` | Your deployed domain, e.g. `https://kanbanetic.vercel.app` |
| `CRON_SECRET` | Random string - authenticates Vercel Cron's daily hit against `/api/cron/cleanup` |

### Docker (self-hosted)

```bash
docker build -t workflow-manager .
docker run -p 3000:3000 --env-file server/.env -e NODE_ENV=production workflow-manager
```

Multi-stage build: builds the Angular client, then copies the output into the Express server's static-file path (`server/public`).

## Project Structure

```text
client/           Angular app
  src/app/
    components/   header, footer, edit-modal, task-card, login
    services/     auth.service.ts, tasks.service.ts
    guards/       auth.guard.ts (functional route guard)
server/           Express API
  src/
    db/           database.js, schema.sql
    routes/       authRoutes.js
    utils/        authMiddleware.js, sessionCleanup.js
    index.js      task routes + app export
api/index.js       Vercel serverless function entry point
vercel.json        Vercel build/rewrite/cron config
Dockerfile          multi-stage build for self-hosting
.github/workflows/  CI
```

## License

MIT - see [LICENSE.md](./LICENSE.md).
