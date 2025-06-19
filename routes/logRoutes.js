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

// DELETE /api/logs/clear?level=info
router.delete('/clear', async (req, res) => {
  try {
    const { level } = req.query;

    const query = level ? { level } : {};

    const result = await ServerLog.deleteMany(query);

    res.json({
      message: `Logs ${level ? `with level '${level}' ` : ''}cleared successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Error clearing logs:', err.message);
    res.status(500).json({ error: 'Server error while clearing logs' });
  }
});


module.exports = router;
