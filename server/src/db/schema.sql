-- Workflow Manager database schema.
--
-- Run this once against a fresh database to get a fully working schema:
-- tables, indexes, the FK/cascade relationship, and the seeded template
-- account + tasks that every demo session clones from.
--
-- created_at is used by server/src/utils/sessionCleanup.js to identify
-- and remove demo sessions older than 24h.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority    VARCHAR(50) NOT NULL DEFAULT 'low',
  "order"     INTEGER NOT NULL DEFAULT 0,
  user_id     INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Adds the user_id -> users FK with ON DELETE CASCADE. Safe to re-run;
-- does nothing if the constraint already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'tasks'::regclass AND contype = 'f'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Seed the template account. The app hardcodes user_id = 1 as the source
-- every "Access Live Demo Version" click clones tasks from (see
-- server/src/routes/authRoutes.js, POST /demo), so this only makes sense
-- against a genuinely fresh, empty database - it intentionally does NOT
-- try to retrofit a database that already has a row at id 1.
INSERT INTO users (id, email, password_hash, role)
SELECT 1, 'admin@workflow.com', 'not-a-real-login-template-account-only', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

-- Keep the sequence in sync after the explicit id=1 insert above.
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));

-- Template tasks cloned into every new demo session - this is the actual
-- "what has been done / what's next" board shown to visitors. Update this
-- list (and re-run this INSERT against the live DB) whenever real project
-- status changes, so the demo board never goes stale relative to the code.
INSERT INTO tasks (title, description, status, priority, "order", user_id)
SELECT * FROM (VALUES
  ('Migrate to Secure HttpOnly Cookies', 'Abandon vulnerable localStorage token storage and implement strict backend cookie-based authentication to fully mitigate XSS vectors.', 'done', 'high', 0, 1),
  ('Establish Relational Database Schema', 'Add the users table and connect a real foreign key constraint (ON DELETE CASCADE) between tasks and users - versioned in server/src/db/schema.sql.', 'done', 'high', 1, 1),
  ('Design Modular Route Architecture', 'Decouple app.component.html logic into standalone functional routes and isolate express endpoints under dedicated router modules.', 'done', 'medium', 2, 1),
  ('Implement Angular Functional Guards', 'Construct client-side route protection utilizing modern functional guards paired with a server-side session check endpoint (/api/auth/me).', 'done', 'medium', 3, 1),
  ('Implement Query Parameter Filtering', 'Server-side filtering and search via URL query parameters (?priority=high&search=...) instead of client-side filtering.', 'done', 'high', 4, 1),
  ('Setup Testing with Vitest & Supertest', '47 tests across client (Vitest + Angular Testing Library patterns) and server (Vitest + Supertest against a real Postgres test database, not mocked).', 'done', 'medium', 5, 1),
  ('Configure CI/CD Automation via GitHub Actions', 'Workflow at .github/workflows/test.yml - client build+test, server test with a real Postgres service container, and a Docker image build, on every push.', 'done', 'medium', 6, 1),
  ('Automate Stale Session Cleanup', 'Real scheduled job (server/src/utils/sessionCleanup.js) that deletes demo sessions older than 24h, running on startup and every 24h after.', 'done', 'high', 7, 1),
  ('Add pagination for scale', 'Load more per column (not page-number pagination, which breaks drag-and-drop reordering across page boundaries) once task counts grow.', 'todo', 'medium', 0, 1)
) AS seed(title, description, status, priority, "order", user_id)
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE user_id = 1);
