import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../../../../../shared/src/types';

export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle custom application errors
  if (error instanceof CustomError && error.isOperational) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: 'APPLICATION_ERROR'
    });
    return;
  }

  // Handle MongoDB duplicate key errors
  if (error.name === 'MongoError' && (error as any).code === 11000) {
    const field = Object.keys((error as any).keyPattern)[0];
    res.status(409).json({
      success: false,
      message: `${field} already exists`,
      error: 'DUPLICATE_KEY_ERROR'
    });
    return;
  }

  // Handle MongoDB validation errors
  if (error.name === 'ValidationError') {
    const validationErrors = Object.values((error as any).errors).map((err: any) => err.message);
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'VALIDATION_ERROR',
      details: validationErrors
    });
    return;
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'INVALID_ID_ERROR'
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN_ERROR'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      error: 'TOKEN_EXPIRED_ERROR'
    });
    return;
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: 'INTERNAL_SERVER_ERROR'
  });
};
