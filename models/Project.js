const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { type: String, required: true },
  imagePath: { type: String }, // Optional
  date: { type: Date, required: true },
  duedate: { type: Date, required: true },
  domain: { type: String, required: true },
  expirydate: { type: Date },
  amcexpirydate: { type: Date, default: new Date('2025-06-14T00:00:00.000Z')} 
});

module.exports = mongoose.model('Project', projectSchema);
