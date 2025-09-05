// apps/backend/src/services/portal.service.ts
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

class PortalService {
  async authenticateCustomer(phone: string, cnic?: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        phone,
        ...(cnic && { cnic }),
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        tenantId: true
      }
    });

    if (!customer) {
      throw new ApiError('Customer not found or inactive', 404);
    }

    // In a real implementation, you'd generate a JWT token here
    return {
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email
    };
  }

  async getDashboard(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: {
            plan: true
          },
          take: 1
        }
      }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    const subscription = customer.subscriptions[0];

    // Get recent invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        subscription: {
          customerId: customer.id
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        number: true,
        total: true,
        status: true,
        dueDate: true,
        createdAt: true
      }
    });

    // Get tickets
    const tickets = await prisma.ticket.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true
      }
    });

    // Get usage data for current month
    const currentMonth = format(new Date(), 'yyyy-MM');
    const usage = subscription ? await prisma.usageCounter.findFirst({
      where: {
        subscriptionId: subscription.id,
        period: currentMonth
      }
    }) : null;

    // Generate mock usage history
    const usageHistory = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      usageHistory.push({
        month: format(month, 'MMM'),
        usage: Math.floor(Math.random() * 100) + 50 // Mock data
      });
    }

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.addressJson ? JSON.parse(customer.addressJson) : null
      },
      subscription: subscription ? {
        id: subscription.id,
        username: subscription.username,
        status: subscription.status,
        endsAt: subscription.endsAt,
        autoRenew: subscription.autoRenew,
        plan: subscription.plan
      } : null,
      usage: {
        currentMonth: usage ? {
          upBytes: Number(usage.upBytes),
          downBytes: Number(usage.downBytes),
          totalBytes: Number(usage.totalBytes),
          sessions: usage.sessions
        } : {
          upBytes: 0,
          downBytes: 0,
          totalBytes: 0,
          sessions: 0
        },
        history: usageHistory
      },
      invoices,
      tickets
    };
  }

  async getInvoices(customerId: string) {
    return prisma.invoice.findMany({
      where: {
        subscription: {
          customerId: customerId
        }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        number: true,
        total: true,
        status: true,
        dueDate: true,
        createdAt: true,
        paidAt: true
      }
    });
  }

  async getTickets(customerId: string) {
    return prisma.ticket.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        resolvedAt: true
      }
    });
  }

  async createTicket(customerId: string, data: any) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1
        }
      }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    const ticket = await prisma.ticket.create({
      data: {
        tenantId: customer.tenantId,
        customerId: customer.id,
        subscriptionId: customer.subscriptions[0]?.id,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        status: 'OPEN'
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

  async getUsage(subscriptionId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription) {
      throw new ApiError('Subscription not found', 404);
    }

    // Get usage for last 6 months
    const usageData = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const period = format(month, 'yyyy-MM');
      
      const usage = await prisma.usageCounter.findFirst({
        where: {
          subscriptionId,
          period
        }
      });

      usageData.push({
        period: format(month, 'MMM yyyy'),
        upBytes: usage ? Number(usage.upBytes) : 0,
        downBytes: usage ? Number(usage.downBytes) : 0,
        totalBytes: usage ? Number(usage.totalBytes) : 0,
        sessions: usage ? usage.sessions : 0
      });
    }

    return usageData;
  }
}

export const portalService = new PortalService();