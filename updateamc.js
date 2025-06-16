const mongoose = require('mongoose');
const Project = require('./models/Project'); // Adjust path if needed

mongoose.connect('mongodb://localhost:27017/toscroll', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateMissingAMCExpiry = async () => {
  try {
    const result = await Project.updateMany(
      { amcexpirydate: { $exists: false } },
      { $set: { amcexpirydate: new Date('2025-06-14T00:00:00.000Z') } }
    );
    console.log('Updated documents:', result.modifiedCount);
  } catch (error) {
    console.error('Error updating documents:', error);
  } finally {
    mongoose.disconnect();
  }
};

updateMissingAMCExpiry();
