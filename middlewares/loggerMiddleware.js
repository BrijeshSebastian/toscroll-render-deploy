//middlewares/loggerMiddleware.js
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    body: ['POST', 'PUT'].includes(req.method) ? req.body : undefined,
  });
  next();
};

const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    error: err.message,
    stack: err.stack,
    status: err.status || 500,
  });
  next(err);
};

module.exports = { requestLogger, errorLogger };
