import { Router } from 'express';
import { reportService } from '../services/report.service.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/reports/dashboard - Dashboard statistics
router.get('/dashboard', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const stats = await reportService.getDashboardStats(req.user!.tenantId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/revenue - Revenue reports
router.get('/revenue', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { period, startDate, endDate } = req.query;
    const report = await reportService.getRevenueReport(req.user!.tenantId, {
      period: period as string,
      startDate: startDate as string,
      endDate: endDate as string
    });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/customers - Customer reports
router.get('/customers', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const report = await reportService.getCustomerReport(req.user!.tenantId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/aging - Aging report (unpaid invoices)
router.get('/aging', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const report = await reportService.getAgingReport(req.user!.tenantId);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

export { router as reportRoutes };