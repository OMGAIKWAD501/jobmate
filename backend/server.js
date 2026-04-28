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
const allowedOrigins = [
  "https://jobmate-frontend-pi.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.FRONTEND_ORIGINS ? process.env.FRONTEND_ORIGINS.split(",").map((item) => item.trim()).filter(Boolean) : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.trim()] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin/server-to-server requests with no Origin header.
    if (!origin) {
      return callback(null, true);
    }

    const isExplicitlyAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

    if (isExplicitlyAllowed || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);
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
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',   // 🔥 true for Vercel/Render, false for localhost
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 🔥 none for cross-origin, lax for localhost
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

app.get("/", (req, res) => {
  res.send("JobMate Backend Running 🚀");
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