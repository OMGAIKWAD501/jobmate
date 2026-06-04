/**
 * One-time migration: normalize all Worker skills and Job requiredSkills to lowercase.
 * Run once: node migrateSkillsToLowercase.js
 */
const mongoose = require('mongoose');
const Worker = require('./models/Worker');
const Job = require('./models/Job');
require('dotenv').config();

const migrate = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmate');
  console.log('Connected to MongoDB');

  // Fix Worker skills
  const workers = await Worker.find({});
  let workerFixed = 0;
  for (const w of workers) {
    const lower = (w.skills || []).map(s => s.trim().toLowerCase());
    const changed = lower.some((s, i) => s !== (w.skills[i] || ''));
    if (changed) {
      await Worker.updateOne({ _id: w._id }, { $set: { skills: lower } });
      workerFixed++;
    }
  }
  console.log(`✅ Fixed ${workerFixed} worker skill arrays`);

  // Fix Job requiredSkills
  const jobs = await Job.find({});
  let jobFixed = 0;
  for (const j of jobs) {
    const lower = (j.requiredSkills || []).map(s => s.trim().toLowerCase());
    const changed = lower.some((s, i) => s !== (j.requiredSkills[i] || ''));
    if (changed) {
      await Job.updateOne({ _id: j._id }, { $set: { requiredSkills: lower } });
      jobFixed++;
    }
  }
  console.log(`✅ Fixed ${jobFixed} job requiredSkills arrays`);

  console.log('\n🎉 Migration complete! All skills are now lowercase.');
  await mongoose.connection.close();
};

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
