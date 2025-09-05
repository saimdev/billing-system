import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';
// import { pdfService } from './pdf.service.js';

interface RecordPaymentData {
  invoiceId?: string;
  customerId?: string;
  method: string;
  reference?: string;
  amount: number;
  notes?: string;
  receivedAt?: string;
}

interface SearchParams {
  page: number;
  limit: number;
  status?: string;
  method?: string;
  fromDate?: string;
  toDate?: string;
}

class PaymentService {
  async list(tenantId: string, params: SearchParams) {
    const { page, limit, status, method, fromDate, toDate } = params;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (method) where.method = method;
    if (fromDate) where.receivedAt = { gte: new Date(fromDate) };
    if (toDate) where.receivedAt = { ...where.receivedAt, lte: new Date(toDate) };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoice: {
            select: {
              id: true,
              number: true,
              total: true,
              subscription: {
                select: {
                  customer: {
                    select: { name: true, phone: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { receivedAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async record(tenantId: string, data: RecordPaymentData) {
    let invoice = null;

    if (data.invoiceId) {
      invoice = await prisma.invoice.findFirst({
        where: { id: data.invoiceId, tenantId }
      });

      if (!invoice) {
        throw new ApiError('Invoice not found', 404);
      }
    }

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        method: data.method as any,
        reference: data.reference,
        amount: data.amount,
        status: 'COMPLETED',
        receivedAt: data.receivedAt ? new Date(data.receivedAt) : new Date(),
        notes: data.notes
      }
    });

    // Update invoice status if payment covers full amount
    if (invoice && data.amount >= invoice.total) {
      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: { 
          status: 'PAID',
          paidAt: new Date()
        }
      });
    }

    return payment;
  }

  async refund(tenantId: string, paymentId: string, amount: number, reason: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId }
    });

    if (!payment) {
      throw new ApiError('Payment not found', 404);
    }

    if (payment.status !== 'COMPLETED') {
      throw new ApiError('Can only refund completed payments', 400);
    }

    if (amount > payment.amount) {
      throw new ApiError('Refund amount cannot exceed payment amount', 400);
    }

    // Create refund record
    const refund = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: payment.invoiceId,
        customerId: payment.customerId,
        method: payment.method,
        reference: `REFUND-${payment.reference}`,
        amount: -amount,
        status: 'COMPLETED',
        receivedAt: new Date(),
        notes: `Refund: ${reason}`
      }
    });

    // Update original payment if full refund
    if (amount === payment.amount) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' }
      });
    }

    return refund;
  }

  async generateReceipt(tenantId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        invoice: {
          include: {
            subscription: {
              include: {
                customer: true,
                plan: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      throw new ApiError('Payment not found', 404);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    // const buffer = await pdfService.generateReceipt(payment, tenant!);
    const filename = `receipt-${payment.reference || payment.id}.pdf`;

    return { buffer, filename };
  }
}

export const paymentService = new PaymentService();