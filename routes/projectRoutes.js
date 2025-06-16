const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 


// Get projects for the logged-in user
router.get('/my-projects', verifyToken, async (req, res) => {
  console.log('User ID from token:', req.user.id);
  try {
    const userId = req.user.id; // this is correct
    const projects = await Project.find({ userId }); // use `userId` field name as per your data
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Create project for a user
router.post('/:userId', verifyToken, requireRole('admin'), upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const projectData = {
      userId: req.params.userId,
      title: req.body.title,
      status: req.body.status,
      domain: req.body.domain,
      date: new Date(req.body.date),
      duedate: new Date(req.body.duedate),
      expirydate: req.body.expirydate ? new Date(req.body.expirydate) : null,
      amcexpirydate: req.body.amcexpirydate ? new Date(req.body.amcexpirydate) : undefined,
      imagePath
    };

    const project = new Project(projectData);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all projects for a user
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Get a specific project for editing
router.get('/project/:projectId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a specific project
router.put('/update/:projectId', verifyToken, requireRole('admin'), upload.single('image'), async (req, res) => {
  try {
    const { title, status, date, duedate, domain, expirydate, amcexpirydate } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : req.body.imagePath;

    if (!title || !status || !date || !duedate || !domain) {
      return res.status(400).json({ error: 'All fields except image and expiry date are required.' });
    }

    if (new Date(duedate) < new Date(date)) {
      return res.status(400).json({ error: 'Due date must be on or after the start date.' });
    }
    if (expirydate && new Date(expirydate) < new Date(duedate)) {
      return res.status(400).json({ error: 'Expiry date must be on or after the due date.' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.projectId,
      {
        title,
        status,
        date: new Date(date),
        duedate: new Date(duedate),
        domain,
        expirydate: expirydate ? new Date(expirydate) : null,
        amcexpirydate: amcexpirydate ? new Date(amcexpirydate) : undefined,
        imagePath
      },
      { new: true }
    );
    if (!updatedProject) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(updatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Delete a project 
router.delete('/:projectId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.projectId);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
