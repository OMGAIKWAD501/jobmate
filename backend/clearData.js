const mongoose = require('mongoose');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Job = require('./models/Job');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
require('dotenv').config();

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmate');
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Worker.deleteMany({});
    await Job.deleteMany({});
    await Review.deleteMany({});
    if (Notification) {
       await Notification.deleteMany({});
    }
    console.log('Cleared all data. Your database is now empty.');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    mongoose.connection.close();
  }
};

clearData();
