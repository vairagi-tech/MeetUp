import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('API Gateway Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: 'VALIDATION_ERROR',
      details: error.message
    });
    return;
  }

  if (error.name === 'UnauthorizedError' || error.message.includes('token')) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'AUTHENTICATION_ERROR'
    });
    return;
  }

  if (error.message.includes('ECONNREFUSED') || error.message.includes('Service')) {
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      error: 'SERVICE_UNAVAILABLE'
    });
    return;
  }

  if (error.message.includes('timeout')) {
    res.status(408).json({
      success: false,
      message: 'Request timeout',
      error: 'REQUEST_TIMEOUT'
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
