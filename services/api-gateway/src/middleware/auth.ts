import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IJWTPayload } from '../../../../shared/src/types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

// Public routes that don't require authentication
const publicRoutes = [
  '/api/users/register',
  '/api/users/login',
  '/api/users/verify-email',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/events/public',
  '/health',
  '/api/services'
];

// Check if route is public
const isPublicRoute = (path: string): boolean => {
  return publicRoutes.some(publicRoute => {
    if (publicRoute.includes('*')) {
      const regex = new RegExp(publicRoute.replace('*', '.*'));
      return regex.test(path);
    }
    return path === publicRoute || path.startsWith(publicRoute + '/');
  });
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip authentication for public routes
    if (isPublicRoute(req.path)) {
      return next();
    }

    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
        error: 'MISSING_TOKEN'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Token is empty.',
        error: 'EMPTY_TOKEN'
      });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET environment variable is not set');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
        error: 'CONFIGURATION_ERROR'
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as IJWTPayload;
      req.user = decoded;
      
      // Optional: Add token to logs for debugging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log(`Authenticated user: ${decoded.userId} (${decoded.email})`);
      }
      
      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      
      let errorMessage = 'Invalid token';
      let errorCode = 'INVALID_TOKEN';
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token expired';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Malformed token';
        errorCode = 'MALFORMED_TOKEN';
      }
      
      res.status(401).json({
        success: false,
        message: errorMessage,
        error: errorCode
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
      error: 'AUTHENTICATION_ERROR'
    });
  }
};

// Optional: Role-based authorization middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // For now, we don't have roles in JWT payload
    // This can be extended when role-based access is needed
    next();
  };
};

// Optional: University-specific access control
export const requireSameUniversity = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED'
    });
    return;
  }

  // Add university-specific logic here if needed
  // For example, restrict access to users from the same university
  next();
};
