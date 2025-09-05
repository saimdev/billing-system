import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';
import { addHours } from 'date-fns';

interface CreateTicketData {
  customerId?: string;
  subscriptionId?: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
}

interface SearchParams {
  page: number;
  limit: number;
  status?: string;
  priority?: string;
  category?: string;
  assignedUserId?: string;
}

class TicketService {
  async list(tenantId: string, params: SearchParams) {
    const { page, limit, status, priority, category, assignedUserId } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedUserId) where.assignedUserId = assignedUserId;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, phone: true, email: true }
          },
          subscription: {
            select: {
              id: true,
              username: true,
              plan: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ticket.count({ where })
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async create(tenantId: string, data: CreateTicketData) {
    // Calculate SLA due date based on priority
    const slaHours = {
      'LOW': 72,
      'MEDIUM': 24,
      'HIGH': 8,
      'URGENT': 4
    };

    const slaDueAt = addHours(new Date(), slaHours[data.priority as keyof typeof slaHours]);

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        customerId: data.customerId,
        subscriptionId: data.subscriptionId,
        subject: data.subject,
        category: data.category as any,
        priority: data.priority as any,
        status: 'OPEN',
        slaDueAt
      },
      include: {
        customer: {
          select: { name: true, phone: true, email: true }
        }
      }
    });

    // Add initial message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorType: 'CUSTOMER',
        body: data.description
      }
    });

    return ticket;
  }

  async getById(tenantId: string, ticketId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId },
      include: {
        customer: {
          select: { name: true, phone: true, email: true }
        },
        subscription: {
          select: {
            username: true,
            plan: {
              select: { name: true }
            }
          }
        },
        messages: {
          include: {
            author: {
              select: { name: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      throw new ApiError('Ticket not found', 404);
    }

    return ticket;
  }

  async addReply(tenantId: string, ticketId: string, authorId: string, data: { body: string; attachments?: string[] }) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId }
    });

    if (!ticket) {
      throw new ApiError('Ticket not found', 404);
    }

    const reply = await prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId,
        authorType: 'STAFF',
        body: data.body,
        attachmentsJson: data.attachments ? JSON.stringify(data.attachments) : null
      },
      include: {
        author: {
          select: { name: true, role: true }
        }
      }
    });

    // Update ticket status if it was closed and we're adding a reply
    if (ticket.status === 'CLOSED') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'OPEN' }
      });
    }

    return reply;
  }

  async assign(tenantId: string, ticketId: string, assignedUserId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId }
    });

    if (!ticket) {
      throw new ApiError('Ticket not found', 404);
    }

    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedUserId,
        status: 'IN_PROGRESS'
      }
    });
  }

  async updateStatus(tenantId: string, ticketId: string, status: string) {
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, tenantId }
    });

    if (!ticket) {
      throw new ApiError('Ticket not found', 404);
    }

    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: status as any,
        ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolvedAt: new Date() } : {})
      }
    });
  }
}

export const ticketService = new TicketService();