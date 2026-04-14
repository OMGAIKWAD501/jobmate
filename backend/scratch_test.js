const mongoose = require('mongoose');

async function test() {
  try {
    // We will connect mongoose to direct check validation
    const Job = require('./backend/models/Job');
    const Notification = require('./backend/models/Notification');
    
    // Connect DB
    await mongoose.connect('mongodb://localhost:27017/jobmate', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("DB connected");

    // Try creating an arbitrary job like createDirectRequest does
    const job = new Job({
      title: "Test Direct Request",
      description: "Description of test request",
      customer: new mongoose.Types.ObjectId(), // Fake
      assignedWorker: new mongoose.Types.ObjectId(), // Fake
      location: "Mumbai",
      budget: 0,
      status: 'pending',
      isDirectRequest: true,
      requiredSkills: []
    });

    try {
      await job.validate();
      console.log("Job validation passed");
    } catch(err) {
      console.log("JOB VALIDATION FAILED: ", err.message);
    }

    const notif = new Notification({
      recipient: new mongoose.Types.ObjectId(),
      type: 'direct_hire_request',
      title: 'New Direct Job Request',
      message: `You have received a direct job request: Test Direct Request`,
      link: '/dashboard'
    });

    try {
      await notif.validate();
      console.log("Notification validation passed");
    } catch(err) {
      console.log("NOTIF VALIDATION FAILED: ", err.message);
    }

  } catch (error) {
    console.error("Script error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

test();
