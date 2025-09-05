// apps/backend/src/routes/auth.ts
import { Router } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantSlug: z.string().optional()
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  tenantName: z.string().min(2),
  tenantSlug: z.string().min(2).regex(/^[a-z0-9-]+$/)
});

const refreshSchema = z.object({
  refreshToken: z.string()
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
  tenantSlug: z.string().optional()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8)
});

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
  try {
    const { email, password, tenantSlug } = req.body;
    const result = await authService.login(email, password, tenantSlug);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register (Owner registration)
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, tenantName, tenantSlug } = req.body;
    const result = await authService.register({
      name,
      email,
      password,
      tenantName,
      tenantSlug
    });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', validateRequest(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await authService.logout(req.user!.id);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validateRequest(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email, tenantSlug } = req.body;
    await authService.forgotPassword(email, tenantSlug);
    
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', validateRequest(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    
    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user!.id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
