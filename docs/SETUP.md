# Student Scheduler Platform - Setup Guide

This guide will help you set up the Student Scheduler Platform for development and production environments.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (v9 or higher) - Comes with Node.js
- **MongoDB Atlas Account** - [Sign up here](https://www.mongodb.com/atlas)
- **Git** - [Download here](https://git-scm.com/)
- **Docker & Docker Compose** (optional, for containerized deployment)

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/student-scheduler-platform.git
cd student-scheduler-platform
```

### 2. Environment Variables

Copy the environment configuration template:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

#### Required Configuration

```bash
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/student-scheduler?retryWrites=true&w=majority

# JWT Secret (generate a strong secret key)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (for user verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Optional Configuration

```bash
# Redis (for advanced caching - optional)
REDIS_URL=redis://localhost:6379

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# University APIs
UNIVERSITY_API_KEY=your-university-api-key
UNIVERSITY_API_BASE_URL=https://api.your-university.edu
```

## Installation

### Option 1: Automatic Installation (Recommended)

Install all dependencies for all services and frontend:

```bash
npm run install:all
```

### Option 2: Manual Installation

If the automatic installation fails, install dependencies manually:

```bash
# Root dependencies
npm install

# Shared utilities
cd shared && npm install && cd ..

# Backend services
cd services/api-gateway && npm install && cd ../..
cd services/user-service && npm install && cd ../..
cd services/timetable-service && npm install && cd ../..
cd services/friends-service && npm install && cd ../..
cd services/location-service && npm install && cd ../..
cd services/events-service && npm install && cd ../..
cd services/notification-service && npm install && cd ../..

# Frontend
cd frontend && npm install && cd ..
```

## Database Setup

### MongoDB Atlas Setup

1. **Create a MongoDB Atlas Account**
   - Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account and cluster

2. **Configure Database Access**
   - Create a database user with read/write permissions
   - Add your IP address to the whitelist (or use 0.0.0.0/0 for development)

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string and update your `.env` file

### Local MongoDB Setup (Alternative)

If you prefer local MongoDB:

```bash
# Install MongoDB locally
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Ubuntu
sudo apt-get install mongodb

# Start MongoDB
mongod

# Update .env file
MONGODB_URI=mongodb://localhost:27017/student-scheduler
```

## Running the Application

### Development Mode

Start all services and frontend in development mode:

```bash
npm run dev
```

This will start:
- API Gateway on port 3001
- User Service on port 3002
- Timetable Service on port 3003
- Friends Service on port 3004
- Location Service on port 3005
- Events Service on port 3006
- Notification Service on port 3007
- React Frontend on port 3000

### Individual Services

To start individual services:

```bash
# API Gateway
npm run dev:gateway

# User Service
npm run dev:user

# Frontend only
npm run dev:frontend

# etc.
```

### Production Mode

Build and start all services:

```bash
# Build all services
npm run build:all

# Start in production mode
npm start
```

## Docker Deployment (Optional)

### Prerequisites
- Docker and Docker Compose installed

### Using Docker Compose

```bash
# Build all services
npm run docker:build

# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

## Verification

After setup, verify the installation:

1. **Health Checks**
   - API Gateway: http://localhost:3001/health
   - User Service: http://localhost:3002/health
   - Frontend: http://localhost:3000

2. **API Gateway**
   - Visit: http://localhost:3001/api/services
   - Should return a list of available services

3. **Frontend**
   - Open: http://localhost:3000
   - Should display the landing page

## MongoDB Atlas Database Configuration

The platform uses separate MongoDB databases for each service:

- `student-scheduler-users` - User authentication and profiles
- `student-scheduler-timetables` - Timetable and schedule data
- `student-scheduler-friends` - Friends and groups data
- `student-scheduler-locations` - Location sharing data
- `student-scheduler-events` - Events and activities
- `student-scheduler-notifications` - Notifications and alerts

These will be automatically created when the services first connect.

## Email Configuration

For user registration and notifications:

### Gmail Setup
1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password
3. Use your Gmail and app password in the `.env` file

### Other SMTP Providers
Update the SMTP configuration in `.env` for your email provider.

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify your MongoDB Atlas connection string
   - Check if your IP is whitelisted
   - Ensure database user has proper permissions

2. **Port Already in Use**
   ```bash
   # Kill processes on specific ports
   lsof -ti:3001 | xargs kill -9
   ```

3. **Module Not Found**
   - Run `npm run install:all` again
   - Check if all services have their dependencies installed

4. **CORS Issues**
   - Verify `FRONTEND_URL` in `.env` matches your frontend URL
   - Check CORS configuration in API Gateway

### Development Tips

1. **Hot Reloading**
   - All services use nodemon for automatic restart on file changes
   - Frontend uses React's built-in hot reloading

2. **Database Reset**
   ```bash
   # Clear all data and restart (development only)
   npm run clean
   npm run install:all
   ```

3. **View Logs**
   ```bash
   # Docker logs
   npm run docker:logs

   # Individual service logs appear in terminal when running dev mode
   ```

## Next Steps

After successful setup:

1. **Create Your First User**
   - Visit http://localhost:3000/register
   - Register with your university email

2. **Import Timetable**
   - Add your class schedule manually or via CSV/ICS import

3. **Add Friends**
   - Search for other users from your university
   - Send friend requests

4. **Find Common Free Time**
   - Use the Free Time Finder to discover available meeting slots

## Support

If you encounter issues:

1. Check this setup guide
2. Review the [API documentation](./API.md)
3. Check the [troubleshooting section](./TROUBLESHOOTING.md)
4. Create an issue on GitHub

## Development Environment

### Recommended VSCode Extensions

- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- MongoDB for VS Code
- Thunder Client (for API testing)

### Code Formatting

```bash
# Lint all services
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

Happy coding! 🚀
