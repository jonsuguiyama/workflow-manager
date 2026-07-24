const request = require('supertest');
const pool = require('./db/database');

// Deletes every user except the id=1 template account (and, via the FK
// cascade, their tasks) - keeps each test starting from a known-clean
// slate without re-running the whole schema between tests.
async function resetNonTemplateData() {
  await pool.query('DELETE FROM users WHERE id != 1');
}

// Creates a fresh demo session against the real /api/auth/demo endpoint and
// returns a supertest agent that persists the resulting HttpOnly cookie
// across subsequent requests, mirroring a real browser session.
async function createAuthenticatedAgent(app) {
  const agent = request.agent(app);
  const response = await agent.post('/api/auth/demo').send({});
  return { agent, user: response.body.user };
}

module.exports = { resetNonTemplateData, createAuthenticatedAgent };
