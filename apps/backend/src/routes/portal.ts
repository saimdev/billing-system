// apps/backend/src/routes/portal.ts
import { Router } from 'express';
import { z } from 'zod';
import { portalService } from '../services/portal.service.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();

const authSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  cnic: z.string().optional()
});

const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['TECHNICAL', 'BILLING', 'COMPLAINT', 'REQUEST', 'OTHER']).default('TECHNICAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM')
});

// POST /api/portal/auth - Authenticate customer for portal access
router.post('/auth', validateRequest(authSchema), async (req, res, next) => {
  try {
    const { phone, cnic } = req.body;
    const result = await portalService.authenticateCustomer(phone, cnic);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/dashboard - Get customer dashboard data
router.get('/dashboard', async (req, res, next) => {
  try {
    // In a real implementation, you'd authenticate the customer first
    // For demo purposes, we'll use a mock customer
    const customerId = req.query.customerId as string;
    
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID required' });
    }

    const dashboard = await portalService.getDashboard(customerId);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/invoices - Get customer invoices
router.get('/invoices', async (req, res, next) => {
  try {
    const customerId = req.query.customerId as string;
    
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID required' });
    }

    const invoices = await portalService.getInvoices(customerId);
    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/invoices/:id/pdf - Download invoice PDF
router.get('/invoices/:id/pdf', async (req, res, next) => {
  try {
    const { id } = req.params;
    const customerId = req.query.customerId as string;

    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID required' });
    }

    // Mock PDF response - in real implementation, generate actual PDF
    const pdfBuffer = Buffer.from('Mock PDF content for invoice ' + id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/tickets - Get customer tickets
router.get('/tickets', async (req, res, next) => {
  try {
    const customerId = req.query.customerId as string;
    
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID required' });
    }

    const tickets = await portalService.getTickets(customerId);
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
});

// POST /api/portal/tickets - Create support ticket
router.post('/tickets', validateRequest(createTicketSchema), async (req, res, next) => {
  try {
    const customerId = req.query.customerId as string;
    
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Customer ID required' });
    }

    const ticket = await portalService.createTicket(customerId, req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// GET /api/portal/usage/:subscriptionId - Get usage data
router.get('/usage/:subscriptionId', async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const usage = await portalService.getUsage(subscriptionId);
    res.json({ success: true, data: usage });
  } catch (error) {
    next(error);
  }
});

export { router as portalRoutes };