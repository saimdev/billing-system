// apps/backend/src/routes/billing.ts
import { Router } from 'express';
import { z } from 'zod';
import { billingService } from '../services/billing.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const runBillingSchema = z.object({
  billingDate: z.string().datetime().optional(),
  subscriptionIds: z.array(z.string()).optional(),
  dryRun: z.boolean().default(false)
});

// POST /api/billing/run - Run billing cycle
router.post('/run', authorize('OWNER', 'ADMIN'), validateRequest(runBillingSchema), async (req, res, next) => {
  try {
    const { billingDate, subscriptionIds, dryRun } = req.body;
    const result = await billingService.runBilling(req.user!.tenantId, {
      billingDate: billingDate ? new Date(billingDate) : new Date(),
      subscriptionIds,
      dryRun
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/billing/preview - Preview billing for current period
router.get('/preview', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const preview = await billingService.previewBilling(req.user!.tenantId);
    
    res.json({
      success: true,
      data: preview
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/billing/status - Get billing job status
router.get('/status', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const status = await billingService.getBillingStatus(req.user!.tenantId);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

export { router as billingRoutes };
