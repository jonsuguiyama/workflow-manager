require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/database');
const path = require('node:path');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const { authenticateToken } = require('./utils/authMiddleware');

const app = express();

app.disable('x-powered-by');

const port = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const publicPath = path.join(__dirname, '..', 'public', 'browser');
app.use(express.static(publicPath));

app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && req.accepts('html') && !req.xhr && !req.headers['x-requested-with']) {
    if (process.env.NODE_ENV !== 'production') {
      return res.status(404).end();
    }
    return res.sendFile(path.join(publicPath, 'index.html'));
  }
  next();
});

app.use('/api/auth', authRoutes);

app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 ORDER BY "order" ASC, id DESC',
      [req.user.id]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/tasks', authenticateToken, async (req, res) => {
  const { title, description, status, priority } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description || '', status || 'todo', priority || 'medium', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/tasks/reorder', authenticateToken, async (req, res) => {
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

app.put('/tasks/:id', authenticateToken, async (req, res) => {
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

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.put('/tasks/:id/status', authenticateToken, async (req, res) => {
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

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
