//cloudinaryAudioStorage.js

const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const cloudinary = require('./cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'toscroll_uploads/audio',
    allowed_formats: ['m4a', 'mp3', 'wav'],
    resource_type: 'auto', // Allows audio uploads
  },
});

const upload = multer({ storage });

module.exports = upload;