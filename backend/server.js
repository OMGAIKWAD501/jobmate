const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const socketService = require('./services/socketService');
const { getNearbyMatches } = require('./controllers/locationController');

// Initialize Socket.IO
socketService.init(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: process.env.JWT_SECRET, // use strong secret from .env
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI, // your working MongoDB connection
      crypto: {
        secret: process.env.JWT_SECRET,
      },
      touchAfter: 24 * 3600, // reduces DB writes (1 day)
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: false, // set true in production (HTTPS)
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs for active development
  message: { message: 'Too many requests from this IP, please try again later.' }
});
app.use((req, res, next) => {
  const isLocationSaveEndpoint =
    (req.method === 'PUT' && req.path === '/api/auth/location') ||
    (req.method === 'PUT' && req.path === '/api/workers/location');

  if (isLocationSaveEndpoint) {
    return next();
  }

  return limiter(req, res, next);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/location', require('./routes/location'));
app.get('/api/nearby', getNearbyMatches);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jobmate', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };