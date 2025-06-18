//middlewares/loggerMiddleware.js

const logger = require('../utils/logger');

// Log all incoming requests
const requestLogger = (req, res, next) => {
  logger.info('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    body: req.body
  });
  next();
};

// Log all uncaught errors
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack
  });
  next(err); // Pass to default error handler
};

module.exports = { requestLogger, errorLogger };
