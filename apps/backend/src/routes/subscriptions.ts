// apps/backend/src/routes/subscriptions.ts
import { Router } from 'express';
import { z } from 'zod';
import { subscriptionService } from '../services/subscription.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid(),
  username: z.string().optional(),
  mac: z.string().optional(),
  accessType: z.enum(['PPPOE', 'HOTSPOT', 'GPON', 'STATIC_IP']).default('PPPOE'),
  autoRenew: z.boolean().default(true),
  startDate: z.string().datetime().optional()
});

// GET /api/subscriptions - List subscriptions
router.get('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      customerId: req.query.customerId as string,
      q: req.query.q as string
    };
    const result = await subscriptionService.list(req.user!.tenantId, params);
    res.json({ success: true, data: result.subscriptions, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
});

// GET /api/subscriptions/:id - Get subscription details
router.get('/:id', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getById(req.user!.tenantId, req.params.id);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// POST /api/subscriptions - Create subscription
router.post('/', authorize('OWNER', 'ADMIN', 'MANAGER'), validateRequest(createSubscriptionSchema), async (req, res, next) => {
  try {
    const subscription = await subscriptionService.create(req.user!.tenantId, req.body);
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/subscriptions/:id - Update subscription
router.patch('/:id', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const subscription = await subscriptionService.update(req.user!.tenantId, req.params.id, req.body);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/subscriptions/:id/status - Update subscription status
router.patch('/:id/status', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const subscription = await subscriptionService.updateStatus(req.user!.tenantId, req.params.id, status);
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/subscriptions/:id - Delete subscription
router.delete('/:id', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    await subscriptionService.delete(req.user!.tenantId, req.params.id);
    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as subscriptionRoutes };