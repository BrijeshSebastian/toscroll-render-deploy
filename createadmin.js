const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
    approved: true
  });

  await admin.save();
  console.log('✅ Admin user created successfully');
  mongoose.disconnect();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// const Project = require('./models/Project');
// async function migrateDates() {
//   const projects = await Project.find();
//   for (const project of projects) {
//     project.date = new Date(project.date);
//     project.duedate = new Date(project.duedate);
//     project.expirydate = project.expirydate ? new Date(project.expirydate) : null;
//     await project.save();
//   }
//   console.log('Migration complete');
// }


// migrateDates()