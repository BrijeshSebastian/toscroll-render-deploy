const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  approved: { type: Boolean, default: false },
  role: { type: String, default: 'user' },// 'admin' or 'user'
  profileImage: { type: String, default: '' },
  companyemail:{type: String,default: ''},
  companyImage: { type: String, default: '' },
  adress: { type: String, default: '' },
  mobilenumber: { type: Number, default: '' },
});

module.exports = mongoose.model('User', userSchema);
