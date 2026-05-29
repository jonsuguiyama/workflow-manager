require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db/database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({ message: 'API running', dbTime: result.rows[0] });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY "order" ASC, id DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/tasks', async (req, res) => {
  const { title, description, status, priority } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description || '', status || 'todo', priority || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/tasks/reorder', async (req, res) => {
  const tasksToUpdate = req.body;
  
  if (!Array.isArray(tasksToUpdate)) {
    return res.status(400).json({ error: 'Payload must be an array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const task of tasksToUpdate) {
      await client.query(
        'UPDATE tasks SET "order" = $1, status = $2 WHERE id = $3',
        [task.order, task.status, task.id]
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

app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, priority } = req.body;

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, description = $2, priority = $3
       WHERE id = $4
       RETURNING *`,
      [title, description, priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.put('/tasks/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.status(204).send(); 
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

const path = require('path');

const publicPath = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use((req, res, next) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});