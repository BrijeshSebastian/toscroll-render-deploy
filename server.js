//server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const projectLogRoutes = require('./routes/projectLogs');
const { requestLogger, errorLogger } = require('./middlewares/loggerMiddleware');
const logRoutes = require('./routes/logRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);

// 🔥 CORS ORIGIN ALLOWED (SET ACTUAL PORTS)


app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// ✅ Now socket.io uses same CORS rules
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

const messageRoutes = require('./routes/messageRoutes')(io); // Pass io to messageRoutes
app.use(requestLogger); // 🔁 Log all incoming requests
app.use(express.json());
app.use(express.static('public'));
app.use('/toscroll-backend/public', express.static(path.join(__dirname, 'public')));
app.use('/Uploads', express.static(path.join(__dirname, 'Uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes); // Ensure this line is present
app.use('/api/projects', projectRoutes);
app.use('/api/project-logs', projectLogRoutes);
app.use('/api/logs', logRoutes);


app.use(errorLogger); // 💥 Log all errors after routes

// Force Express to send JSON on unhandled errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    }
  });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ✅ Start HTTP server
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at ${PORT}`);
});


// server.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

