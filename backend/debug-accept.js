const mongoose = require('mongoose');
const API_BASE_URL = process.env.API_BASE_URL || 'https://jobmate-backend-jkx3.onrender.com/api';

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/jobmate');
    const Job = require('./models/Job');
    const User = require('./models/User');

    const jobWithApp = await Job.findOne({ status: 'open', 'applications.0': { $exists: true } });
    if (!jobWithApp) {
        console.log('No open jobs with applications found. Please create one manually or via script.');
        process.exit(0);
    }

    const owner = await User.findById(jobWithApp.customer);
    const email = owner.email;

    console.log(`Logging in as dynamically found owner: ${email}`);
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email: email, password: 'password123'})
    });
    const login = await loginRes.json();
    const token = login.token;

    const appId = jobWithApp.applications[0]._id;
    console.log('Accepting application', appId, 'for job', jobWithApp._id);

    const accRes = await fetch(`${API_BASE_URL}/jobs/${jobWithApp._id}/applications/${appId}/accept`, {
      method: 'PUT',
      headers: {Authorization: 'Bearer ' + token}
    });

    if (!accRes.ok) {
        console.error('SERVER RESPONDED WITH ERROR:', await accRes.text());
    } else {
        console.log('SUCCESS:', await accRes.json());
    }
  } catch (e) {
    console.error('Failed to setup test:', e.message);
  } finally {
    mongoose.connection.close();
  }
}
test();
