// models/ProjectLog.js

const mongoose = require('mongoose');

const projectLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: Date, required: true }, // Each day's log
  entries: [
    {
      developer: { type: String, required: true },
      hours: { type: Number, required: true },
      feature: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model('ProjectLog', projectLogSchema);


