const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Job = require('./models/Job');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
require('dotenv').config();

const workerSkillsList = [
  'plumbing', 'electrical', 'carpentry', 'painting', 'hvac',
  'landscaping', 'cleaning', 'roofing', 'moving', 'assembly',
  'web development', 'graphic design', 'data entry', 'virtual assistant', 'photography'
];

const jobTitlesBySkill = {
  'plumbing': ['Fix Kitchen Sink Leak', 'Install New Toilet', 'Unclog Shower Drain', 'Pipe Repair'],
  'electrical': ['Install Ceiling Fan', 'Fix Circuit Breaker', 'Wire Outdoor Lighting', 'Outlet Repair'],
  'carpentry': ['Custom Bookshelf', 'Fix Door Frame', 'Build Wooden Deck', 'Cabinet Repair'],
  'painting': ['Paint Living Room', 'Exterior House Painting', 'Fence Staining', 'Touch-up Paint'],
  'hvac': ['AC Not Cooling', 'Furnace Repair', 'Install Thermostat', 'HVAC Maintenance'],
  'landscaping': ['Mow Lawn', 'Tree Trimming', 'Garden Makeover', 'Lay Sod'],
  'cleaning': ['Deep House Clean', 'Move-out Cleaning', 'Window Washing', 'Carpet Cleaning'],
  'roofing': ['Fix Roof Leak', 'Replace Shingles', 'Gutter Cleaning', 'Roof Inspection'],
  'moving': ['Help Loading Truck', 'Furniture Moving', 'Move 2 Bedroom Apartment', 'Heavy Lifting'],
  'assembly': ['Assemble IKEA Furniture', 'Build Shed', 'TV Mounting', 'Grill Assembly'],
  'web development': ['Build WordPress Site', 'Fix React Bug', 'E-commerce Setup', 'Landing Page Design'],
  'graphic design': ['Design Logo', 'Create Social Media Graphics', 'Brochure Design', 'Business Cards'],
  'data entry': ['Excel Data Entry', 'Organize Receipts', 'Database Cleanup', 'Typing Document'],
  'virtual assistant': ['Email Management', 'Schedule Appointments', 'Internet Research', 'Customer Support'],
  'photography': ['Wedding Photography', 'Real Estate Photos', 'Portrait Session', 'Event Photography']
};

const DUMMY_PASSWORD = 'password123'; // Using same password for all to test easily

const generateLocation = () => `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`;

const seedMassiveData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmate');
    console.log('Connected to MongoDB. Wiping existing databases...');

    // Clear existing data
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Job.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});
    console.log('Cleared existing User, Worker, Job, Review, and Notification data.');

    // 1. Generate Customers
    const customerCount = 10;
    const customersToInsert = [];
    console.log(`Generating ${customerCount} customers...`);
    
    // Add known customer for manual login testing
    customersToInsert.push({
      name: 'John Customer',
      email: 'john@example.com',
      password: DUMMY_PASSWORD,
      role: 'customer',
      phone: faker.phone.number(),
      location: generateLocation(),
      profilePicture: faker.image.avatar()
    });

    for (let i = 0; i < customerCount - 1; i++) {
      customersToInsert.push({
        name: faker.person.fullName(),
        email: faker.internet.email().toLowerCase(),
        password: DUMMY_PASSWORD,
        role: 'customer',
        phone: faker.phone.number(),
        location: generateLocation(),
        profilePicture: faker.image.avatar()
      });
    }

    const createdCustomers = [];
    for (let custData of customersToInsert) {
      const user = new User(custData);
      await user.save();
      createdCustomers.push(user);
    }
    console.log(`✅ ${createdCustomers.length} Customers inserted.`);

    // 2. Generate Workers
    const workerCount = 10;
    const workersData = [];
    console.log(`Generating ${workerCount} workers...`);

    // Add known worker for manual login testing
    workersData.push({
      user: {
        name: 'Alex Worker',
        email: 'alex@example.com',
        password: DUMMY_PASSWORD,
        role: 'worker',
        phone: faker.phone.number(),
        location: generateLocation(),
        profilePicture: faker.image.avatar()
      },
      workerDetails: {
        skills: ['plumbing', 'pipe repair'],
        experience: 8,
        hourlyRate: 75,
        description: 'Licensed plumber with 8 years experience. Highly rated.',
        availability: 'available',
        completedJobs: faker.number.int({ min: 1, max: 10 })
      }
    });

    for (let i = 0; i < workerCount - 1; i++) {
        const numSkills = faker.number.int({ min: 1, max: 3 });
        const skills = faker.helpers.arrayElements(workerSkillsList, numSkills);
        
        workersData.push({
          user: {
            name: faker.person.fullName(),
            email: faker.internet.email().toLowerCase(),
            password: DUMMY_PASSWORD,
            role: 'worker',
            phone: faker.phone.number(),
            location: generateLocation(),
            profilePicture: faker.image.avatar()
          },
          workerDetails: {
            skills: skills,
            experience: faker.number.int({ min: 1, max: 15 }),
            hourlyRate: faker.number.int({ min: 20, max: 150 }),
            description: faker.lorem.paragraph(),
            availability: faker.helpers.arrayElement(['available', 'busy']),
            completedJobs: faker.number.int({ min: 0, max: 15 })
          }
        });
    }

    const createdWorkers = [];
    for (let wData of workersData) {
      const user = new User(wData.user);
      await user.save();

      const worker = new Worker({
        user: user._id,
        ...wData.workerDetails,
        rating: 0,
        totalReviews: 0
      });
      await worker.save();
      createdWorkers.push({ user, worker });
    }
    console.log(`✅ ${createdWorkers.length} Workers inserted.`);

    // 3. Generate Jobs
    const jobCount = 30;
    console.log(`Generating ${jobCount} jobs...`);
    const createdJobs = [];

    for (let i = 0; i < jobCount; i++) {
        // Pick random customer
        const customer = faker.helpers.arrayElement(createdCustomers);
        
        // Pick random skill for job
        const skill = faker.helpers.arrayElement(workerSkillsList);
        const titles = jobTitlesBySkill[skill] || ['General Task'];
        const title = faker.helpers.arrayElement(titles);
        
        const status = faker.helpers.arrayElement(['open', 'open', 'open', 'assigned', 'completed']);
        let assignedWorker = null;
        let completedAt = null;

        if (status === 'assigned' || status === 'completed') {
            // Find a worker that has the skill
            const eligibleWorkers = createdWorkers.filter(w => w.worker.skills.includes(skill));
            if (eligibleWorkers.length > 0) {
                assignedWorker = faker.helpers.arrayElement(eligibleWorkers).user._id;
                if (status === 'completed') {
                    completedAt = faker.date.recent({ days: 30 });
                }
            } else {
                // fallback if no exact skill match found easily
                assignedWorker = faker.helpers.arrayElement(createdWorkers).user._id;
            }
        }

        const job = new Job({
            title: title,
            description: faker.lorem.paragraph(),
            customer: customer._id,
            requiredSkills: [skill, faker.helpers.arrayElement(workerSkillsList)],
            location: customer.location, // usually same city
            budget: faker.number.int({ min: 50, max: 1000 }),
            duration: `${faker.number.int({ min: 1, max: 8 })} hours`,
            status: status,
            assignedWorker: assignedWorker,
            completedAt: completedAt,
            createdAt: faker.date.recent({ days: 60 })
        });
        
        // Emulate some applications for open jobs
        if (status === 'open' && faker.datatype.boolean()) {
             const numApps = faker.number.int({ min: 1, max: 5 });
             for(let a = 0; a < numApps; a++) {
                 const applicant = faker.helpers.arrayElement(createdWorkers).user._id;
                 // verify applicant isn't already applied
                 if (!job.applications.some(app => app.worker.toString() === applicant.toString())) {
                    job.applications.push({
                        worker: applicant,
                        message: faker.lorem.sentence(),
                        status: 'pending',
                        appliedAt: faker.date.recent({ days: 5 })
                    });
                 }
             }
        }

        await job.save();
        createdJobs.push(job);
    }
    console.log(`✅ ${createdJobs.length} Jobs inserted.`);

    // 4. Generate Reviews (Only for completed jobs)
    console.log('Generating reviews for completed jobs...');
    let reviewCount = 0;
    for (let job of createdJobs) {
        if (job.status === 'completed' && job.assignedWorker) {
            const review = new Review({
                reviewer: job.customer,
                reviewee: job.assignedWorker,
                job: job._id,
                rating: faker.number.int({ min: 3, max: 5 }), // mostly positive
                comment: faker.lorem.sentences(2)
            });
            await review.save();
            reviewCount++;

            // Update worker rating
            const worker = await Worker.findOne({ user: job.assignedWorker });
            if (worker) {
               const allReviews = await Review.find({ reviewee: job.assignedWorker });
               const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
               worker.rating = Math.round(avgRating * 10) / 10;
               worker.totalReviews = allReviews.length;
               await worker.save();
            }
        }
    }
    console.log(`✅ ${reviewCount} Reviews inserted.`);

    console.log('\n=======================================');
    console.log('🏁 MASSIVE SEEDING SUCCESSFUL! 🏁');
    console.log('=======================================');
    console.log(`Customers: ${createdCustomers.length}`);
    console.log(`Workers: ${createdWorkers.length}`);
    console.log(`Jobs: ${createdJobs.length}`);
    console.log(`Reviews: ${reviewCount}`);
    
    console.log('\n🔑 Hardcoded Test Accounts:');
    console.log('Customer: john@example.com / password123');
    console.log('Worker:   alex@example.com / password123');
    console.log('\nNote: ALL generated users use "password123"');

  } catch (error) {
    console.error('CRITICAL SEEDING ERROR:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedMassiveData();
