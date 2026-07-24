const request = require('supertest');
const app = require('./index');
const pool = require('./db/database');
const { resetNonTemplateData, createAuthenticatedAgent } = require('./test-helpers');

beforeEach(async () => {
  await resetNonTemplateData();
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/demo', () => {
  it('creates a unique demo user and clones the template tasks', async () => {
    const res = await request(app).post('/api/auth/demo').send({});

    expect(res.status).toBe(201);
    expect(res.body.user.email).toMatch(/^demo_\d+@workflow\.com$/);
    expect(res.headers['set-cookie']?.[0]).toMatch(/^token=/);
  });

  it('gives each session its own isolated set of cloned tasks', async () => {
    const { agent: agentA } = await createAuthenticatedAgent(app);
    const { agent: agentB } = await createAuthenticatedAgent(app);

    const tasksA = await agentA.get('/api/tasks');
    const tasksB = await agentB.get('/api/tasks');

    expect(tasksA.body).toHaveLength(10);
    expect(tasksB.body).toHaveLength(10);
    // Different underlying rows despite identical content.
    expect(tasksA.body[0].id).not.toBe(tasksB.body[0].id);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 with no session cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 for a valid session', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
  });

  it('rejects a cryptographically valid token whose user no longer exists', async () => {
    const { agent, user } = await createAuthenticatedAgent(app);
    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookie so a subsequent request is unauthenticated', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    await agent.post('/api/auth/logout');
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tasks', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it("only returns the caller's own tasks, not other users'", async () => {
    const { agent: agentA } = await createAuthenticatedAgent(app);
    const { agent: agentB } = await createAuthenticatedAgent(app);

    const resA = await agentA.get('/api/tasks');
    const resB = await agentB.get('/api/tasks');
    const idsA = new Set(resA.body.map((t) => t.id));
    const idsB = new Set(resB.body.map((t) => t.id));

    expect([...idsA].some((id) => idsB.has(id))).toBe(false);
  });

  it('filters by priority', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get('/api/tasks?priority=high');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((t) => t.priority === 'high')).toBe(true);
  });

  it('rejects an invalid priority filter', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get('/api/tasks?priority=urgent');
    expect(res.status).toBe(400);
  });

  it('filters by a free-text search across title and description', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get('/api/tasks?search=filtering');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(
      res.body.every(
        (t) =>
          t.title.toLowerCase().includes('filtering') ||
          (t.description ?? '').toLowerCase().includes('filtering')
      )
    ).toBe(true);
  });

  it('combines filters with AND semantics', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.get('/api/tasks?priority=high&search=schema');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toMatch(/Relational Database Schema/i);
  });
});

describe('POST /api/tasks', () => {
  it('creates a task owned by the caller', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent
      .post('/api/tasks')
      .send({ title: 'New task', description: 'desc', status: 'todo', priority: 'medium' });

    expect(res.status).toBe(201);
    expect(res.body[0].title).toBe('New task');

    const list = await agent.get('/api/tasks');
    expect(list.body.some((t) => t.title === 'New task')).toBe(true);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates a task the caller owns', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const tasks = (await agent.get('/api/tasks')).body;
    const target = tasks[0];

    const res = await agent
      .put(`/api/tasks/${target.id}`)
      .send({ title: 'Renamed', description: target.description, priority: target.priority });

    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Renamed');
  });

  it("returns 404 when trying to update another user's task", async () => {
    const { agent: owner } = await createAuthenticatedAgent(app);
    const { agent: attacker } = await createAuthenticatedAgent(app);
    const ownerTasks = (await owner.get('/api/tasks')).body;

    const res = await attacker
      .put(`/api/tasks/${ownerTasks[0].id}`)
      .send({ title: 'Hijacked', description: '', priority: 'low' });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/:id/status', () => {
  it('updates task status', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const tasks = (await agent.get('/api/tasks')).body;
    const target = tasks.find((t) => t.status === 'todo');

    const res = await agent.put(`/api/tasks/${target.id}/status`).send({ status: 'done' });

    expect(res.status).toBe(200);
    expect(res.body[0].status).toBe('done');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task the caller owns', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const tasks = (await agent.get('/api/tasks')).body;

    const res = await agent.delete(`/api/tasks/${tasks[0].id}`);
    expect(res.status).toBe(204);

    const remaining = await agent.get('/api/tasks');
    expect(remaining.body.some((t) => t.id === tasks[0].id)).toBe(false);
  });

  it("returns 404 when trying to delete another user's task", async () => {
    const { agent: owner } = await createAuthenticatedAgent(app);
    const { agent: attacker } = await createAuthenticatedAgent(app);
    const ownerTasks = (await owner.get('/api/tasks')).body;

    const res = await attacker.delete(`/api/tasks/${ownerTasks[0].id}`);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/tasks/reorder', () => {
  it('persists new order and status for a batch of tasks', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const tasks = (await agent.get('/api/tasks')).body;
    const payload = tasks.map((t, index) => ({ id: t.id, order: index, status: t.status }));

    const res = await agent.put('/api/tasks/reorder').send(payload);
    expect(res.status).toBe(200);
  });

  it('rejects a non-array payload', async () => {
    const { agent } = await createAuthenticatedAgent(app);
    const res = await agent.put('/api/tasks/reorder').send({ not: 'an array' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/cron/cleanup', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it('runs cleanup and succeeds when no CRON_SECRET is configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await request(app).get('/api/cron/cleanup');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects requests missing the correct bearer token when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'test-cron-secret';
    const res = await request(app).get('/api/cron/cleanup');
    expect(res.status).toBe(401);
  });

  it('succeeds with the correct bearer token', async () => {
    process.env.CRON_SECRET = 'test-cron-secret';
    const res = await request(app)
      .get('/api/cron/cleanup')
      .set('Authorization', 'Bearer test-cron-secret');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
