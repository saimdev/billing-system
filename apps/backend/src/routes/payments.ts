import { Router } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'GATEWAY', 'CHEQUE', 'CREDIT']),
  reference: z.string().optional(),
  amount: z.number().positive(),
  notes: z.string().optional(),
  receivedAt: z.string().datetime().optional()
});

// GET /api/payments - List payments
router.get('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'CASHIER'), async (req, res, next) => {
  try {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      method: req.query.method as string,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string
    };
    const result = await paymentService.list(req.user!.tenantId, params);
    res.json({ success: true, data: result.payments, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments - Record payment
router.post('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'CASHIER'), validateRequest(recordPaymentSchema), async (req, res, next) => {
  try {
    const payment = await paymentService.record(req.user!.tenantId, req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
});

// POST /api/payments/:id/refund - Process refund
router.post('/:id/refund', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const { amount, reason } = req.body;
    const refund = await paymentService.refund(req.user!.tenantId, req.params.id, amount, reason);
    res.json({ success: true, data: refund });
  } catch (error) {
    next(error);
  }
});

// GET /api/payments/:id/receipt - Download receipt
router.get('/:id/receipt', authorize('OWNER', 'ADMIN', 'MANAGER', 'CASHIER'), async (req, res, next) => {
  try {
    const { buffer, filename } = await paymentService.generateReceipt(req.user!.tenantId, req.params.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

export { router as paymentRoutes };