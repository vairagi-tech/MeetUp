export interface ServiceConfig {
  name: string;
  path: string;
  target: string;
  changeOrigin: boolean;
  timeout: number;
}

export const SERVICES: ServiceConfig[] = [
  {
    name: 'user-service',
    path: '/users',
    target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    timeout: 30000
  },
  {
    name: 'timetable-service',
    path: '/timetables',
    target: process.env.TIMETABLE_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    timeout: 30000
  },
  {
    name: 'friends-service',
    path: '/friends',
    target: process.env.FRIENDS_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    timeout: 30000
  },
  {
    name: 'friends-service-groups',
    path: '/groups',
    target: process.env.FRIENDS_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    timeout: 30000
  },
  {
    name: 'location-service',
    path: '/locations',
    target: process.env.LOCATION_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    timeout: 30000
  },
  {
    name: 'events-service',
    path: '/events',
    target: process.env.EVENTS_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    timeout: 30000
  },
  {
    name: 'notification-service',
    path: '/notifications',
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    timeout: 30000
  }
];
