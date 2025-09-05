import { Router } from 'express';
import { z } from 'zod';
import { settingService } from '../services/setting.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const updateSettingSchema = z.object({
  value: z.any()
});

// GET /api/settings - Get all settings
router.get('/', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const settings = await settingService.getAll(req.user!.tenantId);
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// GET /api/settings/:key - Get specific setting
router.get('/:key', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const setting = await settingService.get(req.user!.tenantId, req.params.key);
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
});

// PUT /api/settings/:key - Update setting
router.put('/:key', authorize('OWNER', 'ADMIN'), validateRequest(updateSettingSchema), async (req, res, next) => {
  try {
    const setting = await settingService.update(req.user!.tenantId, req.params.key, req.body.value);
    res.json({ success: true, data: setting });
  } catch (error) {
    next(error);
  }
});

export { router as settingRoutes };