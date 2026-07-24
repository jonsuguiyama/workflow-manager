require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/database');
const path = require('node:path');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const { authenticateToken } = require('./utils/authMiddleware');
const { cleanupStaleSessions, startSessionCleanupSchedule } = require('./utils/sessionCleanup');

const app = express();

app.set('trust proxy', 1); 

app.disable('x-powered-by');

const port = process.env.PORT || 3000;

// Set explicitly in any deployed environment (see .env.example); falls
// back to the local Angular dev server otherwise.
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const publicPath = path.join(__dirname, '..', 'public', 'browser');
app.use(express.static(publicPath));

app.use('/api/auth', authRoutes);

const VALID_STATUSES = new Set(['todo', 'done']);
const VALID_PRIORITIES = new Set(['low', 'medium', 'high']);

app.get('/api/tasks', authenticateToken, async (req, res) => {
  const { status, priority, search } = req.query;

  const conditions = ['user_id = $1'];
  const values = [req.user.id];

  if (status) {
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Invalid status filter' });
    }
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (priority) {
    if (!VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'Invalid priority filter' });
    }
    values.push(priority);
    conditions.push(`priority = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
  }

  try {
    const result = await pool.query(
      `SELECT * FROM tasks WHERE ${conditions.join(' AND ')} ORDER BY "order" ASC, id DESC`,
      values
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description, status, priority } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || '', status || 'todo', priority || 'medium', req.user.id]
    );
    res.status(201).json(result.rows);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/reorder', authenticateToken, async (req, res) => {
  const tasksToUpdate = req.body;
  
  if (!Array.isArray(tasksToUpdate)) {
    return res.status(400).json({ error: 'Payload must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const task of tasksToUpdate) {
      await client.query(
        'UPDATE tasks SET "order" = $1, status = $2 WHERE id = $3 AND user_id = $4',
        [task.order, task.status, task.id, req.user.id]
      );
    }
    
    await client.query('COMMIT');
    res.status(200).json({ message: 'Orders updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reorder tasks error:', error);
    res.status(500).json({ error: 'Failed to update tasks order' });
  } finally {
    client.release();
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, priority } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, priority = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [title, description, priority, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.put('/api/tasks/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    res.status(204).send(); 
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Triggered by Vercel Cron (see vercel.json) since serverless functions
// don't stay warm for setInterval-based scheduling. Authenticated via the
// Authorization header Vercel automatically attaches to cron invocations
// when CRON_SECRET is set; on other hosts (Render, Docker) the app instead
// runs cleanup via startSessionCleanupSchedule() below and this route is
// simply unused.
app.get('/api/cron/cleanup', async (req, res) => {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    await cleanupStaleSessions();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cron cleanup failed:', error);
    res.status(500).json({ error: 'Cleanup failed' });
  }
});

app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return res.status(404).end();
  }
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(publicPath, 'index.html'));
  }
  next();
});

// Only start listening (and the cleanup scheduler) when this file is run
// directly (`node src/index.js` / nodemon) - not when it's required as a
// module, e.g. by tests importing `app` for supertest.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    startSessionCleanupSchedule();
  });
}

module.exports = app;
