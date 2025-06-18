//ServerLog.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: { type: String, enum: ['info', 'warn', 'error'], required: true },
  message: { type: String, required: true },
  meta: { type: Object }, // Extra data like request info
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ServerLog', logSchema);
