import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { IJWTPayload } from '../../../../../shared/src/types';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: IJWTPayload;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from headers (set by API Gateway)
    const userId = req.headers['x-user-id'] as string;
    const userEmail = req.headers['x-user-email'] as string;
    const userUniversity = req.headers['x-user-university'] as string;

    if (!userId || !userEmail) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'MISSING_USER_INFO'
      });
      return;
    }

    // Set user info in request
    req.user = {
      userId,
      email: userEmail,
      university: userUniversity || '',
      iat: 0,
      exp: 0
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: 'AUTH_MIDDLEWARE_ERROR'
    });
  }
};
