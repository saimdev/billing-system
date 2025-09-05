// apps/backend/src/routes/customers.ts
import { Router } from 'express';
import { z } from 'zod';
import { customerService } from '../services/customer.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import multer from 'multer';
import path from 'path';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// All routes require authentication
router.use(authenticate);

const createCustomerSchema = z.object({
  name: z.string().min(2).max(100),
  cnic: z.string().optional(),
  phone: z.string().min(10).max(15),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional()
  }).optional(),
  tags: z.array(z.string()).optional()
});

const updateCustomerSchema = createCustomerSchema.partial();

const searchSchema = z.object({
  q: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'TERMINATED']).optional(),
  tags: z.string().optional(), // comma-separated
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(20),
  sortBy: z.enum(['name', 'createdAt', 'phone']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

// GET /api/customers - List customers with search/filter
router.get('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const params = searchSchema.parse(req.query);
    const result = await customerService.list(req.user!.tenantId, params);
    
    res.json({
      success: true,
      data: result.customers,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id - Get customer details
router.get('/:id', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const customer = await customerService.getById(req.user!.tenantId, req.params.id);
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/customers - Create new customer
router.post('/', authorize('OWNER', 'ADMIN', 'MANAGER'), validateRequest(createCustomerSchema), async (req, res, next) => {
  try {
    const customer = await customerService.create(req.user!.tenantId, req.body);
    
    res.status(201).json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/customers/:id - Update customer
router.patch('/:id', authorize('OWNER', 'ADMIN', 'MANAGER'), validateRequest(updateCustomerSchema), async (req, res, next) => {
  try {
    const customer = await customerService.update(req.user!.tenantId, req.params.id, req.body);
    
    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/customers/:id - Soft delete customer
router.delete('/:id', authorize('OWNER', 'ADMIN'), async (req, res, next) => {
  try {
    await customerService.delete(req.user!.tenantId, req.params.id);
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/customers/:id/documents - Upload customer documents
router.post('/:id/documents', authorize('OWNER', 'ADMIN', 'MANAGER'), upload.array('documents', 5), async (req, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    const documents = await customerService.uploadDocuments(req.user!.tenantId, req.params.id, files);
    
    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/customers/import - Bulk import customers
router.post('/import', authorize('OWNER', 'ADMIN'), upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file!;
    const result = await customerService.bulkImport(req.user!.tenantId, file);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/subscriptions - Get customer subscriptions
router.get('/:id/subscriptions', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const subscriptions = await customerService.getSubscriptions(req.user!.tenantId, req.params.id);
    
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/invoices - Get customer invoices
router.get('/:id/invoices', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'CASHIER'), async (req, res, next) => {
  try {
    const invoices = await customerService.getInvoices(req.user!.tenantId, req.params.id);
    
    res.json({
      success: true,
      data: invoices
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/payments - Get customer payments
router.get('/:id/payments', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'CASHIER'), async (req, res, next) => {
  try {
    const payments = await customerService.getPayments(req.user!.tenantId, req.params.id);
    
    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id/tickets - Get customer tickets
router.get('/:id/tickets', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), async (req, res, next) => {
  try {
    const tickets = await customerService.getTickets(req.user!.tenantId, req.params.id);
    
    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
});

export { router as customerRoutes };
