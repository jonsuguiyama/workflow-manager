require('dotenv').config();

// Point every test file at an isolated test database instead of the real
// dev/prod one - set here, before any test file requires ./db/database (and
// therefore constructs the pg.Pool), so it takes effect. dotenv.config()
// above does NOT override already-set env vars, so this wins over whatever
// DB_NAME .env itself defines.
process.env.DB_NAME = 'workflow_manager_test';
process.env.NODE_ENV = 'test';
