// apps/backend/src/services/dashboard.service.ts
import { prisma } from '../lib/prisma.js';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

class DashboardService {
  async getStats(tenantId: string) {
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

  async getChartData(tenantId: string, type: string, period: string) {
    const now = new Date();
    let months: Date[] = [];
    
    // Determine the number of months based on period
    const periodMonths = {
      '3months': 3,
      '6months': 6,
      '12months': 12,
      'revenue': 12 // default for revenue
    };

    const monthCount = periodMonths[period as keyof typeof periodMonths] || 12;

    // Generate months array
    for (let i = monthCount - 1; i >= 0; i--) {
      months.push(subMonths(now, i));
    }

    const revenueData = await Promise.all(
      months.map(async (month) => {
        const startDate = startOfMonth(month);
        const endDate = endOfMonth(month);
        
        const [revenue, customerCount] = await Promise.all([
          prisma.payment.aggregate({
            where: {
              tenantId,
              status: 'COMPLETED',
              receivedAt: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true }
          }),
          prisma.customer.count({
            where: {
              tenantId,
              createdAt: { lte: endDate }
            }
          })
        ]);

        return {
          period: format(month, 'MMM yyyy'),
          revenue: revenue._sum.amount || 0,
          customers: customerCount
        };
      })
    );

    return { revenueData };
  }
}

export const dashboardService = new DashboardService();