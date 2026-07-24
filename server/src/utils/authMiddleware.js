const jwt = require('jsonwebtoken');
const pool = require('../db/database');

const isProduction = process.env.NODE_ENV === 'production';

// Validate JWT access token stored in HttpOnly cookies, and confirm the
// user it references still exists. A JWT signature alone doesn't prove the
// underlying account is still there - accounts get removed by the 24h
// session cleanup job (or manual admin cleanup), and a session that
// outlives its account would otherwise look "authenticated" forever
// (the login page auto-redirects on any authenticated session, so an
// orphaned cookie could permanently trap a visitor on an empty board with
// no way back to a fresh demo login).
async function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or unauthorized' });
  }

  let decodedUser;
  try {
    decodedUser = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(403).json({ error: 'Token expired or altered' });
  }

  try {
    const result = await pool.query('SELECT id FROM users WHERE id = $1', [decodedUser.id]);
    if (result.rows.length === 0) {
      res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
      });
      return res.status(401).json({ error: 'Session no longer exists' });
    }
  } catch (error) {
    console.error('Auth user lookup failed:', error);
    return res.status(500).json({ error: 'Authentication check failed' });
  }

  req.user = decodedUser;
  next();
}

module.exports = {
  authenticateToken
};
