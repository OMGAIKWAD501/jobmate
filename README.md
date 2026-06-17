# JobMate - Two-Sided Marketplace for Blue-Collar Workers

A production-ready marketplace platform connecting blue-collar workers (plumbers, electricians, carpenters, etc.) with customers needing their services. Built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🚀 Features

### Core Features
- **User Authentication**: JWT-based auth with role-based access (workers/customers)
- **Worker Profiles**: Skills, experience, location, ratings, portfolio
- **Smart Search & Filtering**: Find workers by skill, location, rating, and price
- **Job Posting System**: Customers can post jobs with requirements
- **Application System**: Workers can apply to jobs with custom messages
- **Booking & Hiring**: Direct hiring or job-based workflow
- **Reviews & Ratings**: Rate workers after completed jobs
- **Dashboard**: Separate dashboards for workers and customers

### Advanced Features
- **Real-time Notifications**: Job applications, acceptances, completions
- **Payment Integration**: Stripe integration for secure payments
- **Location Services**: GPS-based worker discovery
- **Messaging System**: In-app messaging between workers and customers
- **Admin Panel**: Platform management and analytics

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **MVC Pattern**: Clean separation of concerns
- **RESTful APIs**: Well-structured endpoints
- **JWT Authentication**: Secure token-based auth
- **Role-based Access**: Middleware for worker/customer permissions
- **Data Validation**: Joi schemas for input validation
- **Error Handling**: Comprehensive error management
- **Performance**: Database indexing and query optimization

### Frontend (React)
- **Component-based**: Reusable UI components
- **React Router**: Client-side routing
- **Context API**: Global state management
- **Axios**: HTTP client for API calls
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, intuitive interface

## 📁 Project Structure

```
jobmate/
├── backend/
│   ├── controllers/     # Business logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth, validation
│   ├── config/          # Database, env config
│   ├── server.js        # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Route components
│   │   ├── services/    # API services
│   │   ├── context/     # React context
│   │   └── App.js
│   ├── public/
│   └── package.json
├── docker-compose.yml   # Local development
└── README.md
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt
- **Frontend**: React, React Router, Axios, CSS3
- **DevOps**: Docker, Docker Compose
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Deployment**: Ready for Heroku/AWS/Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Docker (optional, for containerized development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/jobmate.git
   cd jobmate
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env  # Configure your environment variables
   npm run seed          # Populate database with sample data
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

4. **Using Docker (Recommended)**
   ```bash
   docker-compose up --build
   ```

### Seeded Test Data

The application comes with pre-populated sample data for testing:

**Test Accounts:**
- **Customer:** `john@example.com` / `password123`
- **Worker:** `alex@example.com` / `password123`

**Sample Data Includes:**
- 3 customers and 6 workers with various skills
- 5 job postings (open, assigned, completed)
- Job applications and reviews
- Ratings and completed job statistics

**Quick Test:**
```bash
# Run the test script to verify everything works
bash test-api.sh
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Workers
- `GET /api/workers/search` - Search workers with filters
- `GET /api/workers/top` - Get top-rated workers
- `GET /api/workers/:id` - Get worker details
- `PUT /api/workers/profile` - Update worker profile

### Jobs
- `POST /api/jobs` - Create job posting
- `GET /api/jobs` - Get jobs (with filters)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/apply` - Apply for job
- `PUT /api/jobs/:jobId/applications/:applicationId/accept` - Accept application
- `PUT /api/jobs/:id/complete` - Mark job as completed

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication
- **Input Validation**: Joi schemas prevent malicious input
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive grid layouts
- **Desktop Enhancement**: Full feature set on larger screens


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [Your GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Inspired by Urban Company, Fiverr, and Uber
- Built with modern web development best practices
- Focus on scalability and user experience
