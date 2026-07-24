const pool = require('../db/database');
const { cleanupStaleSessions } = require('./sessionCleanup');
const { resetNonTemplateData } = require('../test-helpers');

async function insertUserWithAge(email, ageHours) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, role, created_at)
     VALUES ($1, 'x', 'user', NOW() - ($2 || ' hours')::interval)
     RETURNING id`,
    [email, String(ageHours)]
  );
  return result.rows[0].id;
}

beforeEach(async () => {
  await resetNonTemplateData();
});

afterAll(async () => {
  await pool.end();
});

describe('cleanupStaleSessions', () => {
  it('deletes demo users older than 24 hours', async () => {
    const staleId = await insertUserWithAge('stale@workflow.com', 25);

    await cleanupStaleSessions();

    const check = await pool.query('SELECT id FROM users WHERE id = $1', [staleId]);
    expect(check.rows).toHaveLength(0);
  });

  it('keeps demo users younger than 24 hours', async () => {
    const freshId = await insertUserWithAge('fresh@workflow.com', 1);

    await cleanupStaleSessions();

    const check = await pool.query('SELECT id FROM users WHERE id = $1', [freshId]);
    expect(check.rows).toHaveLength(1);
  });

  it('never deletes the template account (id 1), regardless of age', async () => {
    await pool.query("UPDATE users SET created_at = NOW() - INTERVAL '999 hours' WHERE id = 1");

    await cleanupStaleSessions();

    const check = await pool.query('SELECT id FROM users WHERE id = 1');
    expect(check.rows).toHaveLength(1);
  });

  it("also removes a stale user's tasks, not just the user row", async () => {
    const staleId = await insertUserWithAge('stale-with-tasks@workflow.com', 48);
    await pool.query(
      "INSERT INTO tasks (title, status, priority, user_id) VALUES ('orphan candidate', 'todo', 'low', $1)",
      [staleId]
    );

    await cleanupStaleSessions();

    const tasks = await pool.query('SELECT id FROM tasks WHERE user_id = $1', [staleId]);
    expect(tasks.rows).toHaveLength(0);
  });
});
