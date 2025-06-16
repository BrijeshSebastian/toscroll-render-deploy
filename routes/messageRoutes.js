const express = require('express');
const messageRouter = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

const connectedUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('registerUser', (userId) => {
      console.log(`Registering user ${userId} with socket ${socket.id}`);
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      connectedUsers.forEach((value, key) => {
        if (value === socket.id) {
          connectedUsers.delete(key);
        }
      });
    });
  });

  messageRouter.post('/send', async (req, res) => {
    console.log('POST /api/messages/send called with body:', req.body);
    const { senderId, receiverId, text } = req.body;
    try {
      if (!senderId || !receiverId || !text) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const sender = await User.findById(senderId);
      const receiver = await User.findById(receiverId);
      if (!sender || !receiver) {
        return res.status(404).json({ error: 'User not found' });
      }

      const message = new Message({
        text,
        senderId,
        senderName: sender.name,
        receiverId,
        receiverName: receiver.name,
      });
      await message.save();

      const messageData = {
        _id: message._id,
        text: message.text,
        senderId: message.senderId,
        senderName: message.senderName,
        receiverId: message.receiverId,
        receiverName: message.receiverName,
        timestamp: message.timestamp,
        isRead: message.isRead,
      };

      const senderSocket = connectedUsers.get(senderId);
      const receiverSocket = connectedUsers.get(receiverId);
      if (senderSocket) {
        io.to(senderSocket).emit('receiveMessage', messageData);
      }
      if (receiverSocket) {
        io.to(receiverSocket).emit('receiveMessage', messageData);
      }

      res.status(201).json(messageData);
    } catch (err) {
      console.error('Error sending message:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  messageRouter.get('/history/:userId', async (req, res) => {
    console.log(`GET /api/messages/history/${req.params.userId} called`);
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      const messages = await Message.find({
        $or: [
          { senderId: userId },
          { receiverId: userId },
        ],
      }).sort({ timestamp: 1 });
      console.log(`Found ${messages.length} messages for userId: ${userId}`);
      res.json(messages);
    } catch (err) {
      console.error('Error fetching message history:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  messageRouter.post('/mark-read/:userId', async (req, res) => {
    console.log(`POST /api/messages/mark-read/${req.params.userId} called`);
    try {
      const userId = req.params.userId;
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      await Message.updateMany(
        { receiverId: userId, isRead: false },
        { isRead: true }
      );
      res.json({ message: 'Messages marked as read' });
    } catch (err) {
      console.error('Error marking messages as read:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return messageRouter;
};