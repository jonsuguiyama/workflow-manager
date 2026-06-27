const bcrypt = require('bcryptjs');
// 1. Adding token library
const jwt = require('jsonwebtoken'); 

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

// 2. generate token using secret key from .env
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role }, // Data embedded into token
    process.env.JWT_SECRET,           // The .env secret key used to sign the token
    { expiresIn: '24h' }              // The token expires in 24 hours (to handle data security and session management)
  );
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken // 3. we export the generateToken function so it can be used in other parts of the application
};
