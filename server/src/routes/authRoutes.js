const { authenticateToken } = require('../utils/authMiddleware');
const express = require('express');
const router = express.Router();
const pool = require('../db/database');
const { hashPassword, generateToken } = require('../utils/auth');
const isProduction = process.env.NODE_ENV === 'production';

// POST /api/auth/demo - Create a unique temporary demo user session
router.post('/demo', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Generate unique credentials for this specific session
    const timestamp = Date.now();
    const demoEmail = `demo_${timestamp}@workflow.com`;
    const demoPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await hashPassword(demoPassword);

    // Persist temporary user into the database
    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [demoEmail, passwordHash, 'user']
    );
    const newUser = userResult.rows[0];

    // Fetch default template tasks from administrator to clone
    const adminTasksResult = await client.query('SELECT * FROM tasks WHERE user_id = 1');
    const adminTasks = adminTasksResult.rows;

    // Duplicate template tasks for the new demo user
    for (const task of adminTasks) {
      await client.query(
        `INSERT INTO tasks (title, description, status, priority, "order", user_id) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [task.title, task.description, task.status, task.priority, task.order, newUser.id]
      );
    }

    await client.query('COMMIT');

    // Issue JWT access token for session persistence
    const token = generateToken(newUser);

    // Set the secure HttpOnly cookie in the response header
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Return only non-sensitive user metadata to the frontend
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Demo user creation failed:', error);
    res.status(500).json({ error: 'Failed to initialize demo session' });
  } finally {
    client.release();
  }
});

// GET /api/auth/me - Validate current HttpOnly cookie session
router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({ authenticated: true, user: req.user });
});


module.exports = router;
