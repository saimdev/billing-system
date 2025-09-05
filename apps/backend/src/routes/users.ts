import { Router } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER', 'CASHIER'])
});

const updateUserSchema = createUserSchema.partial().omit({ password: true });

// GET /api/users - List users
router.get('/', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const users = await userService.list(req.user!.tenantId);
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create user
router.post('/', authorize('OWNER', 'ADMIN'), validateRequest(createUserSchema), async (req, res, next) => {
  try {
    const user = await userService.create(req.user!.tenantId, req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id - Update user
router.patch('/:id', authorize('OWNER', 'ADMIN'), validateRequest(updateUserSchema), async (req, res, next) => {
  try {
    const user = await userService.update(req.user!.tenantId, req.params.id, req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Deactivate user
router.delete('/:id', authorize('OWNER'), async (req, res, next) => {
  try {
    await userService.deactivate(req.user!.tenantId, req.params.id);
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };