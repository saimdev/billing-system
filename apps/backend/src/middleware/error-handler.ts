import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/api-error.ts';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    if (error.code === 'P2002') {
      message = 'Duplicate entry found';
    } else if (error.code === 'P2025') {
      message = 'Record not found';
      statusCode = 404;
    }
  }

  console.error('Error:', error);

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};