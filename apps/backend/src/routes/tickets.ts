import { Router } from 'express';
import { z } from 'zod';
import { ticketService } from '../services/ticket.service.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

const createTicketSchema = z.object({
  customerId: z.string().uuid().optional(),
  subscriptionId: z.string().uuid().optional(),
  subject: z.string().min(5).max(200),
  category: z.enum(['TECHNICAL', 'BILLING', 'COMPLAINT', 'REQUEST', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  description: z.string().min(10)
});

const replySchema = z.object({
  body: z.string().min(1),
  attachments: z.array(z.string()).optional()
});

// GET /api/tickets - List tickets
router.get('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER'), async (req, res, next) => {
  try {
    const params = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      priority: req.query.priority as string,
      category: req.query.category as string,
      assignedUserId: req.query.assignedUserId as string
    };
    const result = await ticketService.list(req.user!.tenantId, params);
    res.json({ success: true, data: result.tickets, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
});

// POST /api/tickets - Create ticket
router.post('/', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'), validateRequest(createTicketSchema), async (req, res, next) => {
  try {
    const ticket = await ticketService.create(req.user!.tenantId, req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// GET /api/tickets/:id - Get ticket details
router.get('/:id', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER'), async (req, res, next) => {
  try {
    const ticket = await ticketService.getById(req.user!.tenantId, req.params.id);
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// POST /api/tickets/:id/reply - Add reply to ticket
router.post('/:id/reply', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER'), validateRequest(replySchema), async (req, res, next) => {
  try {
    const reply = await ticketService.addReply(req.user!.tenantId, req.params.id, req.user!.id, req.body);
    res.json({ success: true, data: reply });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tickets/:id/assign - Assign ticket
router.patch('/:id/assign', authorize('OWNER', 'ADMIN', 'MANAGER'), async (req, res, next) => {
  try {
    const { assignedUserId } = req.body;
    const ticket = await ticketService.assign(req.user!.tenantId, req.params.id, assignedUserId);
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tickets/:id/status - Update ticket status
router.patch('/:id/status', authorize('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const ticket = await ticketService.updateStatus(req.user!.tenantId, req.params.id, status);
    res.json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
});

export { router as ticketRoutes };