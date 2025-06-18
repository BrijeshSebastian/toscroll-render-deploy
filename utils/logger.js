//utils/logger.js
const ServerLog = require('../models/ServerLog');

const logEvent = async (level, message, meta = {}) => {
  try {
    const log = new ServerLog({ level, message, meta });
    await log.save();
    console.log(`[${level.toUpperCase()}] - ${message}`);
  } catch (err) {
    console.error('Error logging to MongoDB:', err.message);
  }
};

module.exports = {
  info: (msg, meta) => logEvent('info', msg, meta),
  warn: (msg, meta) => logEvent('warn', msg, meta),
  error: (msg, meta) => logEvent('error', msg, meta)
};
