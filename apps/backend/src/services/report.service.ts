import { prisma } from '../lib/prisma.js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

class ReportService {
  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subMonths(now, 1));

    const [
      totalCustomers,
      activeSubscriptions,
      pendingInvoices,
      openTickets,
      thisMonthRevenue,
      lastMonthRevenue
    ] = await Promise.all([
      prisma.customer.count({
        where: { tenantId, status: 'ACTIVE' }
      }),
      prisma.subscription.count({
        where: { tenantId, status: 'ACTIVE' }
      }),
      prisma.invoice.count({
        where: { tenantId, status: { in: ['PENDING', 'OVERDUE'] } }
      }),
      prisma.ticket.count({
        where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } }
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: 'COMPLETED',
          receivedAt: { gte: thisMonth }
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          tenantId,
          status: 'COMPLETED',
          receivedAt: { gte: lastMonth, lt: thisMonth }
        },
        _sum: { amount: true }
      })
    ]);

    const thisMonthAmount = thisMonthRevenue._sum.amount || 0;
    const lastMonthAmount = lastMonthRevenue._sum.amount || 0;
    const revenueGrowth = lastMonthAmount > 0 
      ? ((thisMonthAmount - lastMonthAmount) / lastMonthAmount) * 100 
      : 0;

    return {
      totalCustomers,
      activeSubscriptions,
      pendingInvoices,
      openTickets,
      thisMonthRevenue: thisMonthAmount,
      lastMonthRevenue: lastMonthAmount,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100
    };
  }

  async getRevenueReport(tenantId: string, params: { period?: string; startDate?: string; endDate?: string }) {
    const { period = 'monthly' } = params;
    const now = new Date();
    
    let months: Date[] = [];
    if (period === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        months.push(subMonths(now, i));
      }
    }

    const revenueData = await Promise.all(
      months.map(async (month) => {
        const startDate = startOfMonth(month);
        const endDate = endOfMonth(month);
        
        const revenue = await prisma.payment.aggregate({
          where: {
            tenantId,
            status: 'COMPLETED',
            receivedAt: { gte: startDate, lte: endDate }
          },
          _sum: { amount: true }
        });

        return {
          period: format(month, 'MMM yyyy'),
          revenue: revenue._sum.amount || 0
        };
      })
    );

    return { revenueData };
  }

  async getCustomerReport(tenantId: string) {
    const [
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      customersByPlan
    ] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId, status: 'ACTIVE' } }),
      prisma.customer.count({ where: { tenantId, status: 'SUSPENDED' } }),
      prisma.subscription.groupBy({
        by: ['planId'],
        where: { tenantId, status: 'ACTIVE' },
        _count: true
      })
    ]);

    return {
      totalCustomers,
      activeCustomers,
      suspendedCustomers,
      customersByPlan
    };
  }

  async getAgingReport(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

    const [current, days30, days60, days90] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { gte: now }
        },
        _sum: { total: true },
        _count: true
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { gte: thirtyDaysAgo, lt: now }
        },
        _sum: { total: true },
        _count: true
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        },
        _sum: { total: true },
        _count: true
      }),
      prisma.invoice.aggregate({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { lt: sixtyDaysAgo }
        },
        _sum: { total: true },
        _count: true
      })
    ]);

    return {
      current: { amount: current._sum.total || 0, count: current._count },
      days30: { amount: days30._sum.total || 0, count: days30._count },
      days60: { amount: days60._sum.total || 0, count: days60._count },
      days90: { amount: days90._sum.total || 0, count: days90._count }
    };
  }
}

export const reportService = new ReportService();