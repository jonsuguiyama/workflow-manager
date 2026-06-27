const jwt = require('jsonwebtoken');

// Middleware to validate JWT access token stored in HttpOnly cookies
function authenticateToken(req, res, next) {
  // Extract token directly from cookies parsed by cookie-parser
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Token expired or altered' });
    }

    // Attach user payload to request object for downstream usage
    req.user = decodedUser;
    next();
  });
}

module.exports = {
  authenticateToken
};
