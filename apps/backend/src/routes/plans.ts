import { Router } from 'express';
import { z } from 'zod';
import { planService } from '../services/plan.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createPlanSchema = z.object({
  name: z.string().min(2).max(100),
  speedMbps: z.number().positive().optional(),
  quotaGb: z.number().positive().optional(),
  price: z.number().positive(),
  durationDays: z.number().positive().default(30),
  taxRate: z.number().min(0).max(100).default(0),
  fupRules: z.object({
    enabled: z.boolean().default(false),
    threshold: z.number().positive().optional(),
    reducedSpeed: z.number().positive().optional()
  }).optional()
});

// GET /api/plans - List plans
router.get('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const plans = await planService.list(req.user!.tenantId);
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

// POST /api/plans - Create plan
router.post('/', authorize('OWNER', 'ADMIN', 'MANAGER'), validateRequest(createPlanSchema), async (req, res, next) => {
  try {
    const plan = await planService.create(req.user!.tenantId, req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/plans/:id - Update plan
router.patch('/:id', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const plan = await planService.update(req.user!.tenantId, req.params.id, req.body);
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/plans/:id - Deactivate plan
router.delete('/:id', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    await planService.deactivate(req.user!.tenantId, req.params.id);
    res.json({ success: true, message: 'Plan deactivated successfully' });
  } catch (error) {
    next(error);
  }
});

export { router as planRoutes };