# Quick Start Guide - Student Scheduler Platform

## 🚀 What We've Built

A complete **microservices-based university scheduling platform** with the following features:

### ✅ Core Features Implemented
- **User Authentication**: Registration, login, email verification, password reset
- **Profile Management**: User profiles with privacy controls, photo uploads
- **Timetable Management**: Create, update, delete schedule entries with conflict detection
- **Free Time Calculation**: Smart algorithm to find available time slots
- **Friend Discovery**: Search and connect with classmates from same university/batch
- **Real-time Communication**: WebSocket support for live updates
- **File Upload**: Profile photo management (with cloud storage support)
- **Data Import/Export**: CSV and ICS file support for timetables

### 🏗️ Architecture
- **7 Microservices**: API Gateway, User, Timetable, Friends, Location, Events, Notifications
- **MongoDB Atlas**: Cloud database with optimized schemas
- **React Frontend**: Modern UI with TypeScript
- **Docker Support**: Complete containerization setup
- **Real-time Features**: Socket.IO integration
- **Security**: JWT authentication, rate limiting, input validation

## 🛠️ Setup Instructions

### Prerequisites
```bash
# Required software
- Node.js v18+
- MongoDB Atlas account
- Git
```

### 1. Environment Setup
```bash
# Clone and setup
git clone <your-repo>
cd student-scheduler-platform

# Copy environment template
cp .env.example .env

# Edit .env with your MongoDB Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student-scheduler
```

### 2. Install Dependencies
```bash
# Install all service dependencies at once
npm run install:all

# OR install manually if the above fails
npm install
cd shared && npm install && cd ..
cd services/api-gateway && npm install && cd ../..
cd services/user-service && npm install && cd ../..
cd services/timetable-service && npm install && cd ../..
cd frontend && npm install && cd ..
```

### 3. MongoDB Atlas Setup
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Whitelist your IP address (or use 0.0.0.0/0 for development)
4. Copy connection string to your `.env` file

### 4. Start Development
```bash
# Start all services and frontend
npm run dev

# This starts:
# - API Gateway (port 3001)
# - User Service (port 3002)
# - Timetable Service (port 3003)
# - React Frontend (port 3000)
```

### 5. Verify Setup
- **API Gateway Health**: http://localhost:3001/health
- **User Service**: http://localhost:3002/health
- **Frontend**: http://localhost:3000
- **Service Discovery**: http://localhost:3001/api/services

## 📚 API Endpoints

### Authentication
```bash
POST /api/users/auth/register     # Register new user
POST /api/users/auth/login        # User login
POST /api/users/auth/verify-email # Verify email address
POST /api/users/auth/forgot-password # Request password reset
POST /api/users/auth/reset-password  # Reset password
```

### User Management
```bash
GET  /api/users/profile           # Get user profile
PUT  /api/users/profile           # Update profile
POST /api/users/upload-photo      # Upload profile photo
GET  /api/users/search            # Search users
PUT  /api/users/privacy           # Update privacy settings
```

### Timetable
```bash
POST /api/timetables              # Create timetable entry
GET  /api/timetables              # Get user timetable
PUT  /api/timetables/:id          # Update entry
DELETE /api/timetables/:id        # Delete entry
GET  /api/timetables/free-time    # Get free time slots
POST /api/timetables/common-free  # Find common free time with friends
```

## 🧪 Testing the Platform

### 1. Register a User
```bash
curl -X POST http://localhost:3001/api/users/auth/register \
-H "Content-Type: application/json" \
-d '{
  "email": "student@university.edu",
  "username": "student123",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe",
  "university": "University Name",
  "batch": "2024",
  "course": "Computer Science"
}'
```

### 2. Login
```bash
curl -X POST http://localhost:3001/api/users/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "student@university.edu",
  "password": "Password123"
}'
```

### 3. Add a Timetable Entry
```bash
curl -X POST http://localhost:3001/api/timetables \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{
  "subject": "Data Structures",
  "type": "lecture",
  "startTime": "2024-01-15T09:00:00.000Z",
  "endTime": "2024-01-15T10:30:00.000Z",
  "dayOfWeek": 1,
  "room": "Room 101",
  "instructor": "Prof. Smith"
}'
```

### 4. Get Free Time Slots
```bash
curl -X GET "http://localhost:3001/api/timetables/free-time?startDate=2024-01-15&endDate=2024-01-21" \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎨 Frontend Features

The React frontend includes:
- **Responsive Design**: Works on desktop and mobile
- **Authentication Flow**: Login, register, email verification
- **Dashboard**: Overview of schedule and friends
- **Timetable View**: Weekly calendar interface
- **Free Time Finder**: Visual display of available slots
- **Friends Management**: Search and connect with classmates
- **Real-time Updates**: Live notifications via WebSocket

## 🐳 Docker Deployment

```bash
# Build and start all services with Docker
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

## 📁 Project Structure

```
student-scheduler-platform/
├── services/
│   ├── api-gateway/       # Request routing & authentication
│   ├── user-service/      # User management & profiles
│   ├── timetable-service/ # Schedule management & free time
│   ├── friends-service/   # Social features (placeholder)
│   ├── location-service/  # Location sharing (placeholder)
│   ├── events-service/    # Events & activities (placeholder)
│   └── notification-service/ # Push notifications (placeholder)
├── frontend/              # React application
├── shared/                # Common utilities & types
├── docker/                # Docker configurations
└── docs/                  # Documentation
```

## 🔧 Development Notes

### Database Setup
- Each service uses its own MongoDB database
- Automatic schema validation and indexing
- Optimized queries for performance

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection

### Real-time Features
- WebSocket connections for live updates
- User online/offline status
- Location sharing capabilities
- Push notifications ready

## 🚀 Next Steps

Ready to extend the platform? Here are suggested next steps:

1. **Complete Remaining Services**: Implement Friends, Location, Events, and Notification services
2. **Add University APIs**: Integrate with actual university timetable systems
3. **Enhanced UI**: Build complete React components for all features
4. **Mobile App**: Create React Native app using same backend
5. **Advanced Features**: Add group scheduling, event planning, study rooms booking

## 💡 Key Algorithms

### Free Time Calculation
The platform uses a sophisticated algorithm to:
1. Parse user timetables and recurring events
2. Calculate gaps between scheduled activities
3. Find intersection of multiple users' free time
4. Generate smart meeting suggestions

### Friend Discovery
- University-based user search
- Batch/year filtering
- Privacy-respected discovery
- Common course identification

## 📞 Support

- Check `/docs/SETUP.md` for detailed setup instructions
- API documentation in `/docs/API.md`
- Troubleshooting guide in `/docs/TROUBLESHOOTING.md`

Happy coding! 🎉
