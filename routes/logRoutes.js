//routes/logRoutes.js

const express = require('express');
const router = express.Router();
const ServerLog = require('../models/ServerLog');

// GET /api/logs/download?level=info
router.get('/download', async (req, res) => {
  try {
    const { level } = req.query;

    const query = level ? { level } : {};
    const logs = await ServerLog.find(query).sort({ timestamp: -1 });

    // Convert logs to JSON string
    const jsonData = JSON.stringify(logs, null, 2);

    // Set headers to download as .json file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.json');
    res.send(jsonData);
  } catch (err) {
    console.error('Error downloading logs:', err.message);
    res.status(500).json({ error: 'Server error while downloading logs' });
  }
});

module.exports = router;
