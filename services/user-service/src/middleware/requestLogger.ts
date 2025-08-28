import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(
      `[${new Date().toISOString()}] ${logLevel} ${req.method} ${req.path} - ` +
      `${res.statusCode} - ${duration}ms`
    );
    
    // Log additional details for errors
    if (res.statusCode >= 400) {
      console.log(`Request details: ${JSON.stringify({
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }, null, 2)}`);
    }
  });
  
  next();
};
