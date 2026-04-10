require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Job = require('./models/Job');
const Review = require('./models/Review');
const Notification = require('./models/Notification');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmate');

  const ram = await User.findOne({ name: /^Ram\s+Prasad$/i }).lean();
  if (!ram) {
    throw new Error('Ram Prasad not found');
  }

  const ramId = ram._id;

  const deletedWorkers = await Worker.deleteMany({ user: { $ne: ramId } });
  const deletedJobs = await Job.deleteMany({});
  const deletedReviews = await Review.deleteMany({});
  const deletedNotifications = await Notification.deleteMany({ recipient: { $ne: ramId } });
  const deletedUsers = await User.deleteMany({ _id: { $ne: ramId } });

  const keptWorker = await Worker.findOneAndUpdate(
    { user: ramId },
    {
      $setOnInsert: {
        user: ramId,
        skills: []
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  const summary = {
    keptUser: { name: ram.name, email: ram.email, id: String(ramId) },
    deleted: {
      workers: deletedWorkers.deletedCount,
      jobs: deletedJobs.deletedCount,
      reviews: deletedReviews.deletedCount,
      notifications: deletedNotifications.deletedCount,
      users: deletedUsers.deletedCount
    },
    remaining: {
      users: await User.countDocuments({}),
      workers: await Worker.countDocuments({}),
      jobs: await Job.countDocuments({}),
      reviews: await Review.countDocuments({}),
      notifications: await Notification.countDocuments({})
    },
    keptWorkerId: String(keptWorker._id)
  };

  console.log(JSON.stringify(summary, null, 2));
}

run()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
