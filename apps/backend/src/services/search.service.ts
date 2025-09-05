// apps/backend/src/services/search.service.ts
import { prisma } from '../lib/prisma.js';

class SearchService {
  async globalSearch(tenantId: string, query: string) {
    const searchTerm = query.toLowerCase();
    const results: any[] = [];

    // Search customers
    const customers = await prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true
      }
    });

    customers.forEach(customer => {
      results.push({
        id: customer.id,
        type: 'customer',
        title: customer.name,
        subtitle: customer.phone,
        url: `/customers/${customer.id}`
      });
    });

    // Search invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        OR: [
          { number: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        number: true,
        total: true,
        status: true,
        subscription: {
          select: {
            customer: {
              select: { name: true }
            }
          }
        }
      }
    });

    invoices.forEach(invoice => {
      results.push({
        id: invoice.id,
        type: 'invoice',
        title: invoice.number,
        subtitle: `${invoice.subscription?.customer?.name} - $${invoice.total.toFixed(2)}`,
        url: `/invoices/${invoice.id}`
      });
    });

    // Search tickets
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        OR: [
          { subject: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: {
        id: true,
        subject: true,
        status: true,
        customer: {
          select: { name: true }
        }
      }
    });

    tickets.forEach(ticket => {
      results.push({
        id: ticket.id,
        type: 'ticket',
        title: ticket.subject,
        subtitle: `${ticket.customer?.name || 'Internal'} - ${ticket.status}`,
        url: `/tickets/${ticket.id}`
      });
    });

    return results;
  }
}

export const searchService = new SearchService();