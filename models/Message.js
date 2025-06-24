const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: { type: String }, // Optional for audio messages
  audioUrl: { type: String }, // Store Cloudinary audio URL
  type: { type: String, required: true, enum: ['text', 'audio'] }, // Message type
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  receiverId: { type: String, required: true },
  receiverName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;