import { Router } from 'express';
import { z } from 'zod';
import { invoiceService } from '../services/invoice.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const searchSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED']).optional(),
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(20)
});

const sendInvoiceSchema = z.object({
  method: z.enum(['email', 'sms', 'whatsapp']),
  recipient: z.string().optional()
});

// GET /api/invoices - List invoices
router.get('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'CASHIER'), async (req, res, next) => {
  try {
    const params = searchSchema.parse(req.query);
    const result = await invoiceService.list(req.user!.tenantId, params);
    
    res.json({
      success: true,
      data: result.invoices,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id - Get invoice details
router.get('/:id', authorize('OWNER', 'ADMIN', 'MANAGER', 'CASHIER'), async (req, res, next) => {
  try {
    const invoice = await invoiceService.getById(req.user!.tenantId, req.params.id);
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id/pdf - Download invoice PDF
router.get('/:id/pdf', authorize('OWNER', 'ADMIN', 'MANAGER', 'CASHIER'), async (req, res, next) => {
  try {
    const { buffer, filename } = await invoiceService.generatePDF(req.user!.tenantId, req.params.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// POST /api/invoices/:id/send - Send invoice
router.post('/:id/send', authorize('OWNER', 'ADMIN', 'MANAGER'), validateRequest(sendInvoiceSchema), async (req, res, next) => {
  try {
    const { method, recipient } = req.body;
    await invoiceService.send(req.user!.tenantId, req.params.id, method, recipient);
    
    res.json({
      success: true,
      message: 'Invoice sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/invoices/:id/status - Update invoice status
router.patch('/:id/status', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const invoice = await invoiceService.updateStatus(req.user!.tenantId, req.params.id, status);
    
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
});

export { router as invoiceRoutes };