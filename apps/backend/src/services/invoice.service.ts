import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';
// import { pdfService } from './pdf.service.js';
import { emailService } from './email.service.js';
// import { smsService } from './sms.service.js';
import { Prisma } from '@prisma/client';

interface SearchParams {
  status?: string;
  customerId?: string;
  subscriptionId?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  limit: number;
}

class InvoiceService {
  async list(tenantId: string, params: SearchParams) {
    const { status, customerId, subscriptionId, fromDate, toDate, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      ...(status && { status: status as any }),
      ...(subscriptionId && { subscriptionId }),
      ...(customerId && {
        subscription: { customerId }
      }),
      ...(fromDate && {
        createdAt: { gte: new Date(fromDate) }
      }),
      ...(toDate && {
        createdAt: { lte: new Date(toDate) }
      })
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          subscription: {
            include: {
              customer: {
                select: { id: true, name: true, phone: true, email: true }
              },
              plan: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(tenantId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: {
        items: true,
        payments: true,
        subscription: {
          include: {
            customer: true,
            plan: true
          }
        }
      }
    });

    if (!invoice) {
      throw new ApiError('Invoice not found', 404);
    }

    return invoice;
  }

  async generatePDF(tenantId: string, invoiceId: string) {
    const invoice = await this.getById(tenantId, invoiceId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    // const buffer = await pdfService.generateInvoice(invoice, tenant!);
    const filename = `invoice-${invoice.number}.pdf`;

    // Update invoice with PDF URL if not exists
    if (!invoice.pdfUrl) {
      const pdfUrl = `pdfs/invoices/${invoiceId}.pdf`;
      // await pdfService.savePDF(buffer, pdfUrl);
      
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { pdfUrl }
      });
    }

    return { buffer, filename };
  }

  async send(tenantId: string, invoiceId: string, method: 'email' | 'sms' | 'whatsapp', recipient?: string) {
    const invoice = await this.getById(tenantId, invoiceId);
    const customer = invoice.subscription?.customer;

    if (!customer) {
      throw new ApiError('Customer not found for invoice', 400);
    }

    const { buffer } = await this.generatePDF(tenantId, invoiceId);

    switch (method) {
      case 'email':
        const email = recipient || customer.email;
        if (!email) {
          throw new ApiError('Customer email not available', 400);
        }
        await emailService.sendInvoice(email, customer.name, invoice.number, buffer);
        break;

      case 'sms':
        const phone = recipient || customer.phone;
        // await smsService.sendInvoiceNotification(phone, customer.name, invoice.number, invoice.total);
        break;

      case 'whatsapp':
        // Placeholder for WhatsApp integration
        throw new ApiError('WhatsApp integration not implemented', 501);
    }
  }

  async updateStatus(tenantId: string, invoiceId: string, status: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId }
    });

    if (!invoice) {
      throw new ApiError('Invoice not found', 404);
    }

    return prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: status as any }
    });
  }
}

export const invoiceService = new InvoiceService();