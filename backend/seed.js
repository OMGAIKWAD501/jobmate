const mongoose = require('mongoose');
const User = require('./models/User');
const Worker = require('./models/Worker');
const Job = require('./models/Job');
const Review = require('./models/Review');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmate');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Job.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data');

    // Sample customers
    const customers = [
      {
        name: 'John Smith',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer',
        phone: '+1-555-0101',
        location: 'New York, NY'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: 'password123',
        role: 'customer',
        phone: '+1-555-0102',
        location: 'Los Angeles, CA'
      },
      {
        name: 'Mike Davis',
        email: 'mike@example.com',
        password: 'password123',
        role: 'customer',
        phone: '+1-555-0103',
        location: 'Chicago, IL'
      }
    ];

    // Sample workers
    const workers = [
      {
        user: {
          name: 'Alex Rodriguez',
          email: 'alex@example.com',
          password: 'password123',
          role: 'worker',
          phone: '+1-555-0201',
          location: 'New York, NY'
        },
        worker: {
          skills: ['plumbing', 'pipe repair', 'leak fixing'],
          experience: 8,
          hourlyRate: 75,
          description: 'Licensed plumber with 8 years experience. Specialize in residential plumbing repairs and installations.',
          availability: 'available'
        }
      },
      {
        user: {
          name: 'Maria Garcia',
          email: 'maria@example.com',
          password: 'password123',
          role: 'worker',
          phone: '+1-555-0202',
          location: 'Los Angeles, CA'
        },
        worker: {
          skills: ['electrical', 'wiring', 'circuit repair'],
          experience: 6,
          hourlyRate: 80,
          description: 'Certified electrician specializing in residential and commercial electrical work.',
          availability: 'available'
        }
      },
      {
        user: {
          name: 'David Chen',
          email: 'david@example.com',
          password: 'password123',
          role: 'worker',
          phone: '+1-555-0203',
          location: 'San Francisco, CA'
        },
        worker: {
          skills: ['carpentry', 'woodworking', 'furniture repair'],
          experience: 10,
          hourlyRate: 70,
          description: 'Master carpenter with expertise in custom furniture and home renovations.',
          availability: 'available'
        }
      },
      {
        user: {
          name: 'Lisa Thompson',
          email: 'lisa@example.com',
          password: 'password123',
          role: 'worker',
          phone: '+1-555-0204',
          location: 'Chicago, IL'
        },
        worker: {
          skills: ['painting', 'interior design', 'wallpapering'],
          experience: 5,
          hourlyRate: 50,
          description: 'Professional painter with an eye for detail and color coordination.',
          availability: 'available'
        }
      },
      {
        user: {
          name: 'James Wilson',
          email: 'james@example.com',
          password: 'password123',
          role: 'worker',
          phone: '+1-555-0205',
          location: 'Houston, TX'
        },
        worker: {
          skills: ['hvac', 'heating', 'air conditioning'],
          experience: 12,
          hourlyRate: 85,
          description: 'HVAC specialist with 12 years experience in installation and repair.',
          availability: 'busy'
        }
      },
      {
        user: {
          name: 'Emma Brown',
          email: 'emma@example.com',
          password: 'password123',
          role: 'worker',
          phone: '+1-555-0206',
          location: 'Phoenix, AZ'
        },
        worker: {
          skills: ['landscaping', 'gardening', 'lawn care'],
          experience: 7,
          hourlyRate: 45,
          description: 'Landscape designer and gardener specializing in desert landscaping.',
          availability: 'available'
        }
      },
      {
        user: {
          name: 'Amit Patil',
          email: 'amit.patil@example.com',
          password: 'password123',
          role: 'worker',
          phone: '+91-9876543210',
          location: 'Talegaon, MH'
        },
        worker: {
          skills: ['electrical', 'home appliance repair', 'wiring'],
          experience: 5,
          hourlyRate: 60,
          description: 'Experienced electrician in Talegaon with focus on safe and efficient home solutions.',
          availability: 'available'
        }
      }
    ];

    // Create customers
    const createdCustomers = [];
    for (const customer of customers) {
      const user = new User(customer);
      await user.save();
      createdCustomers.push(user);
    }
    console.log('Created customers');

    // Create workers
    const createdWorkers = [];
    for (const workerData of workers) {
      const user = new User(workerData.user);
      await user.save();

      const worker = new Worker({
        user: user._id,
        ...workerData.worker
      });
      await worker.save();

      createdWorkers.push({ user, worker });
    }
    console.log('Created workers');

    // Sample jobs
    const jobs = [
      {
        title: 'Fix Kitchen Sink Leak',
        description: 'Kitchen sink has been leaking for a week. Need plumber to fix it quickly.',
        customer: createdCustomers[0]._id,
        requiredSkills: ['plumbing', 'pipe repair'],
        location: 'New York, NY',
        budget: 150,
        duration: '2 hours',
        status: 'open'
      },
      {
        title: 'Electrical Outlet Installation',
        description: 'Need 3 new electrical outlets installed in the living room for home office setup.',
        customer: createdCustomers[1]._id,
        requiredSkills: ['electrical', 'wiring'],
        location: 'Los Angeles, CA',
        budget: 200,
        duration: '3 hours',
        status: 'assigned',
        assignedWorker: createdWorkers[1].user._id
      },
      {
        title: 'Custom Bookshelf Installation',
        description: 'Install a custom-built bookshelf in the home library. Shelf dimensions: 6ft x 8ft.',
        customer: createdCustomers[2]._id,
        requiredSkills: ['carpentry', 'woodworking'],
        location: 'Chicago, IL',
        budget: 300,
        duration: '4 hours',
        status: 'completed',
        assignedWorker: createdWorkers[2].user._id,
        completedAt: new Date()
      },
      {
        title: 'Living Room Painting',
        description: 'Paint entire living room including walls and ceiling. Color: Soft blue.',
        customer: createdCustomers[0]._id,
        requiredSkills: ['painting'],
        location: 'New York, NY',
        budget: 400,
        duration: '1 day',
        status: 'open'
      },
      {
        title: 'AC Unit Repair',
        description: 'Central AC unit not cooling properly. Making strange noises when running.',
        customer: createdCustomers[1]._id,
        requiredSkills: ['hvac', 'air conditioning'],
        location: 'Los Angeles, CA',
        budget: 250,
        duration: '2 hours',
        status: 'open'
      }
    ];

    // Create jobs
    const createdJobs = [];
    for (const job of jobs) {
      const newJob = new Job(job);
      await newJob.save();
      createdJobs.push(newJob);
    }
    console.log('Created jobs');

    // Sample applications for jobs
    const applications = [
      {
        job: createdJobs[0]._id,
        worker: createdWorkers[0].user._id,
        message: 'I can fix your sink leak today. I have all the tools needed.',
        status: 'pending'
      },
      {
        job: createdJobs[3]._id,
        worker: createdWorkers[3].user._id,
        message: 'I specialize in interior painting and can match any color perfectly.',
        status: 'accepted'
      }
    ];

    // Add applications to jobs
    for (const app of applications) {
      const job = await Job.findById(app.job);
      job.applications.push({
        worker: app.worker,
        message: app.message,
        status: app.status
      });
      await job.save();
    }
    console.log('Created job applications');

    // Sample reviews
    const reviews = [
      {
        reviewer: createdCustomers[2]._id,
        reviewee: createdWorkers[2].user._id,
        job: createdJobs[2]._id,
        rating: 5,
        comment: 'David did an excellent job installing the bookshelf. Very professional and the work is perfect.'
      },
      {
        reviewer: createdCustomers[1]._id,
        reviewee: createdWorkers[1].user._id,
        job: createdJobs[1]._id,
        rating: 4,
        comment: 'Maria was great with the electrical work. Completed on time and explained everything clearly.'
      }
    ];

    // Create reviews
    for (const review of reviews) {
      const newReview = new Review(review);
      await newReview.save();

      // Update worker rating
      const worker = await Worker.findOne({ user: review.reviewee });
      const allReviews = await Review.find({ reviewee: review.reviewee });
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      worker.rating = Math.round(avgRating * 10) / 10;
      worker.totalReviews = allReviews.length;
      await worker.save();
    }
    console.log('Created reviews');

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${createdCustomers.length} customers created`);
    console.log(`- ${createdWorkers.length} workers created`);
    console.log(`- ${createdJobs.length} jobs created`);
    console.log(`- ${reviews.length} reviews created`);

    console.log('\n🔑 Test Accounts:');
    console.log('Customer: john@example.com / password123');
    console.log('Worker: alex@example.com / password123');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed function
seedData();