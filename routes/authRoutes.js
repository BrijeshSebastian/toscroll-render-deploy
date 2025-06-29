// File: routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const Message = require('../models/Message');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../Cloudinary/cloudinaryStorage');

const router = express.Router();


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
  const userId = req.params.id;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Delete user's projects
    await Project.deleteMany({ user: userId });

    // 2. Delete messages sent or received by the user
    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }]
    });

    // 3. Delete other related models if they exist
    // await Notification.deleteMany({ userId }); // Example
    // await Comment.deleteMany({ userId }); // Example

    // 4. Optionally delete Cloudinary images
    const cloudinary = require('cloudinary').v2;
    if (user.profileImage) {
      const publicId = extractPublicId(user.profileImage);
      await cloudinary.uploader.destroy(publicId);
    }

    if (user.companyImage) {
      const publicId = extractPublicId(user.companyImage);
      await cloudinary.uploader.destroy(publicId);
    }

    res.json({ message: `${user.name} and all related data deleted successfully` });
  } catch (err) {
    console.error('Delete user error:', err);
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




//Edit user their self
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
  updates.profileImage = req.files.profileImage[0].path; // ✅ Cloudinary URL
}
if (req.files?.companyImage) {
  updates.companyImage = req.files.companyImage[0].path; // ✅ Cloudinary URL
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



// Bulk Register
router.post('/register-bulk', async (req, res) => {
  const usersList = req.body.users; // expecting { users: [ {...}, {...}, ... ] }

  if (!Array.isArray(usersList)) {
    return res.status(400).json({ message: 'users field must be an array' });
  }

  try {
    const createdUsers = [];
    const failedUsers = [];

    for (const userData of usersList) {
      const { name, email, password } = userData;

      // Basic validation
      if (!name || !email || !password) {
        failedUsers.push({
          email: email || null,
          reason: 'Missing required fields'
        });
        continue;
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        failedUsers.push({
          email,
          reason: 'Email already registered'
        });
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        role: 'user',
        approved: false // or true if you want them active immediately
      });

      await newUser.save();

      createdUsers.push({
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      });
    }

    res.status(201).json({
      message: 'Bulk registration complete',
      createdUsers,
      failedUsers
    });

  } catch (err) {
    console.error('Bulk register error:', err);
    res.status(500).json({ error: err.message });
  }
});




//Error checking 
router.get('/test-db-error', async (req, res) => {
  const user = await User.findById('invalid-object-id'); // Will cause a CastError
  res.json(user);
});



module.exports = router;
