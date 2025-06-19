// utils/logger.js
const ServerLog = require('../models/ServerLog');

const formatLog = (level, message, meta) => ({
  level,
  message,
  meta: {
    method: meta?.method || '',
    url: meta?.url || '',
    status: meta?.status || '',
    error: meta?.error || '',
    ip: meta?.ip || '',
    userAgent: meta?.userAgent || '',
    body: meta?.body || undefined,
    stack: meta?.stack || undefined,
  },
  timestamp: new Date()
});

const logEvent = async (level, message, meta = {}) => {
  try {
    const formatted = formatLog(level, message, meta);
    const log = new ServerLog(formatted);
    await log.save();
    console.log(`[${level.toUpperCase()}] ${message} | ${formatted.meta.method} ${formatted.meta.url}`);
  } catch (err) {
    console.error('Logging failure:', err.message);
  }
};

module.exports = {
  info: (msg, meta) => logEvent('info', msg, meta),
  warn: (msg, meta) => logEvent('warn', msg, meta),
  error: (msg, meta) => logEvent('error', msg, meta),
};
