import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
  }

  // Handle Prisma errors
  if (error.message.includes('Unique constraint failed')) {
    return res.status(400).json({
      error: 'Record already exists',
      details: 'This record violates a unique constraint',
    });
  }

  if (error.message.includes('Foreign key constraint failed')) {
    return res.status(400).json({
      error: 'Invalid reference',
      details: 'The referenced record does not exist',
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}
