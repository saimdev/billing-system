import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export const tenantIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Ensure all database queries are scoped to the user's tenant
  req.tenantId = req.user?.tenantId;
  next();
};