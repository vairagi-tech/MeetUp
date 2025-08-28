import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ServiceConfig } from '../config/services';

const router = Router();

// Service configuration
const services: ServiceConfig[] = [
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

// Create proxy middleware for each service
services.forEach(service => {
  const proxyMiddleware = createProxyMiddleware({
    target: service.target,
    changeOrigin: service.changeOrigin,
    timeout: service.timeout,
    pathRewrite: {
      [`^/api${service.path}`]: ''
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${service.name}:`, err.message);
      res.status(500).json({
        success: false,
        message: `Service ${service.name} is currently unavailable`,
        error: 'SERVICE_UNAVAILABLE'
      });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Forward user information to downstream services
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.userId);
        proxyReq.setHeader('x-user-email', req.user.email);
        proxyReq.setHeader('x-user-university', req.user.university);
      }
      
      // Log proxy request
      console.log(`[${service.name}] ${req.method} ${req.originalUrl} -> ${service.target}${req.url}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log proxy response
      console.log(`[${service.name}] ${proxyRes.statusCode} ${req.method} ${req.originalUrl}`);
      
      // Add service identifier header
      proxyRes.headers['x-service'] = service.name;
    }
  });

  router.use(service.path, proxyMiddleware);
});

// Service discovery endpoint
router.get('/services', (req, res) => {
  const serviceInfo = services.map(service => ({
    name: service.name,
    path: service.path,
    status: 'active', // TODO: Implement health checks
    uptime: Date.now() // TODO: Implement actual uptime tracking
  }));

  res.json({
    success: true,
    message: 'Available services',
    data: serviceInfo
  });
});

export { router as serviceRoutes };
