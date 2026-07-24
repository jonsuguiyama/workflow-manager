// Vercel serverless function entry point. server/src/index.js exports the
// Express app directly (app.listen() only runs when that file is executed
// as the main module, not when required like this), so this just re-exposes
// it for Vercel's Node.js runtime.
module.exports = require('../server/src/index.js');
