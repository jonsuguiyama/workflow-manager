const pool = require('../db/database');

const TEMPLATE_USER_ID = 1; // never delete the account every demo session clones from
const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000;

// Demo sessions (every "Access Live Demo Version" click) create a permanent
// user + cloned tasks with nothing removing them afterwards. This runs on
// startup and every 24h to delete sessions older than 24h. Tasks are
// deleted explicitly rather than relying solely on ON DELETE CASCADE, so
// this stays correct even if that constraint is ever missing.
async function cleanupStaleSessions() {
  let client;

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const stale = await client.query(
      'SELECT id FROM users WHERE id != $1 AND created_at < NOW() - INTERVAL \'24 hours\'',
      [TEMPLATE_USER_ID]
    );
    const staleIds = stale.rows.map((row) => row.id);

    if (staleIds.length > 0) {
      await client.query('DELETE FROM tasks WHERE user_id = ANY($1)', [staleIds]);
      await client.query('DELETE FROM users WHERE id = ANY($1)', [staleIds]);
    }

    await client.query('COMMIT');

    if (staleIds.length > 0) {
      console.log(`Session cleanup: removed ${staleIds.length} stale demo session(s).`);
    }
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('Session cleanup failed:', error);
  } finally {
    client?.release();
  }
}

function startSessionCleanupSchedule() {
  cleanupStaleSessions();
  setInterval(cleanupStaleSessions, SESSION_LIFETIME_MS);
}

module.exports = { cleanupStaleSessions, startSessionCleanupSchedule };
