import { Router } from 'express';
import { z } from 'zod';
import { usageService } from '../services/usage.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const importUsageSchema = z.object({
  data: z.array(z.object({
    subscriptionId: z.string().uuid(),
    period: z.string().regex(/^\d{4}-\d{2}$/),
    upBytes: z.number().nonnegative(),
    downBytes: z.number().nonnegative(),
    sessions: z.number().nonnegative()
  }))
});

// POST /api/usage/import - Import usage data
router.post('/import', authorize('OWNER', 'ADMIN'), validateRequest(importUsageSchema), async (req, res, next) => {
  try {
    const result = await usageService.import(req.user!.tenantId, req.body.data);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/usage/:subscriptionId - Get usage for subscription
router.get('/:subscriptionId', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const { period } = req.query;
    const usage = await usageService.getBySubscription(req.user!.tenantId, req.params.subscriptionId, period as string);
    res.json({ success: true, data: usage });
  } catch (error) {
    next(error);
  }
});

export { router as usageRoutes };