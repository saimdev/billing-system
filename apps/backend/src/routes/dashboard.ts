import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER', 'CASHIER'), async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.user!.tenantId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/charts - Get chart data
router.get('/charts', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { type, period } = req.query;
    const chartData = await dashboardService.getChartData(req.user!.tenantId, type as string, period as string);
    res.json({ success: true, data: chartData });
  } catch (error) {
    next(error);
  }
});

export { router as dashboardRoutes };