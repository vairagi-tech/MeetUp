# Student Scheduler Platform

A comprehensive platform for university students to find common free time slots with friends, manage timetables, discover nearby friends, and participate in campus activities.

## Architecture

This project follows a microservices architecture using the MERN stack:

### Backend Services
- **API Gateway**: Routes requests to appropriate microservices
- **User Service**: Authentication, user profiles, privacy controls
- **Timetable Service**: Timetable import/export, free time calculation
- **Friends Service**: Friend connections, group management
- **Location Service**: Real-time location sharing, proximity detection
- **Events Service**: University events, club activities
- **Notification Service**: Push notifications, reminders

### Frontend
- **React.js**: Single Page Application with responsive design
- **Leaflet**: Interactive maps for location features
- **Socket.io**: Real-time updates

### Database
- **MongoDB Atlas**: Cloud-hosted MongoDB clusters
- Each microservice has its own database for data isolation

## Features

### Core Features
1. **User Management**: Registration, authentication, profile management
2. **Timetable Integration**: Import from university APIs, manual entry, CSV/ICS support
3. **Free Time Finder**: Calculate and display common free slots
4. **Social Features**: Add friends, create groups, schedule meetings
5. **Location Services**: Opt-in real-time location sharing
6. **Events Integration**: University events and activities
7. **Smart Notifications**: Reminders and proximity alerts

### Technology Stack
- **Frontend**: React.js, React Router, Axios, Leaflet, Socket.io-client
- **Backend**: Node.js, Express.js, Socket.io, JWT
- **Database**: MongoDB Atlas
- **Maps**: Leaflet with OpenStreetMap
- **Authentication**: JWT + University OAuth
- **Real-time**: WebSockets

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account
- University API access (for timetable integration)

### Installation
1. Clone the repository
2. Install dependencies for each service
3. Set up environment variables
4. Start services in development mode

### Development Setup
```bash
# Install dependencies for all services
npm run install:all

# Start all services in development mode
npm run dev

# Start frontend only
npm run dev:frontend

# Start specific service
npm run dev:user-service
```

## Project Structure

```
student-scheduler-platform/
├── services/
│   ├── api-gateway/          # API Gateway service
│   ├── user-service/         # User authentication & profiles
│   ├── timetable-service/    # Timetable management
│   ├── friends-service/      # Friends & groups management
│   ├── location-service/     # Location sharing
│   ├── events-service/       # Events & activities
│   └── notification-service/ # Notifications & alerts
├── frontend/                 # React.js frontend
├── shared/                   # Shared utilities & types
├── docker/                   # Docker configuration
└── docs/                     # Documentation
```

## API Documentation

Each microservice exposes RESTful APIs. Detailed API documentation is available in the `/docs` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and add tests
4. Submit a pull request

## License

MIT License
