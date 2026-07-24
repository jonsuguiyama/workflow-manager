require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const TEST_DB_NAME = 'workflow_manager_test';

const baseConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
};

// Runs once before the whole test run: makes sure a dedicated test database
// exists with the real schema (server/src/db/schema.sql) applied, so tests
// run against actual Postgres rather than a mocked pool - the missing FK
// constraint bug found in production would never have surfaced against a
// mocked DB.
module.exports = async function globalSetup() {
  const admin = new Client({ ...baseConfig, database: 'postgres' });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB_NAME]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  }
  await admin.end();

  const testDb = new Client({ ...baseConfig, database: TEST_DB_NAME });
  await testDb.connect();
  const schema = fs.readFileSync(path.join(__dirname, 'src/db/schema.sql'), 'utf8');
  await testDb.query(schema);
  await testDb.end();
};
