// File: routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

const multer = require('multer');
const path = require('path');

// Set storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile_photos');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});

const upload = multer({ storage: storage });


// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: 'user' });

    await user.save();
    res.status(201).json({ message: 'Registered successfully. Await admin approval.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email' });

    if (!user.approved) return res.status(403).json({ message: 'Admin approval pending' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    // Include user.name in the JWT payload
    const token = jwt.sign(
      { id: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Get current logged-in user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/admin', verifyToken, async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).select('_id name');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (err) {
    console.error('Error fetching admin:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user by ID (Admin only)
router.delete('/delete-user/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Optional: delete related projects if Project model exists
    await Project.deleteMany({ user: req.params.id });

    res.json({ message: `${user.name} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (Admin only)
router.get('/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const users = await User.find({ approved: true ,  role: 'user'});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all pending approval users (for admin)
router.get('/pending', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ approved: false });
    res.json(pendingUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Admin approves a user by ID
router.put('/approve/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: `${user.name} approved`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



const uploadFields = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'companyImage', maxCount: 1 }
]);

router.put('/edit-profile', verifyToken, uploadFields, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      email,
      password,
      companyemail,
      mobilenumber,
      adress
    } = req.body;

    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 10);
    if (companyemail) updates.companyemail = companyemail;
    if (mobilenumber) updates.mobilenumber = mobilenumber;
    if (adress) updates.adress = adress;

    // Handle uploaded images
    if (req.files?.profileImage) {
      updates.profileImage = `/uploads/profile_photos/${req.files.profileImage[0].filename}`;
    }

    if (req.files?.companyImage) {
      updates.companyImage = `/uploads/profile_photos/${req.files.companyImage[0].filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage || '',
        companyImage: updatedUser.companyImage || '',
        companyemail: updatedUser.companyemail,
        mobilenumber: updatedUser.mobilenumber,
        adress: updatedUser.adress,
      }
    });
  } catch (err) {
    console.error('Edit profile error:', err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
