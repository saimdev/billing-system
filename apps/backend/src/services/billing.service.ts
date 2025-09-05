import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';
import { invoiceService } from './invoice.service.js';
import { addDays, addMonths, format } from 'date-fns';

interface BillingOptions {
  billingDate: Date;
  subscriptionIds?: string[];
  dryRun: boolean;
}

interface BillingResult {
  processed: number;
  successful: number;
  failed: number;
  totalAmount: number;
  invoices: string[];
  errors: string[];
}

class BillingService {
  async runBilling(tenantId: string, options: BillingOptions): Promise<BillingResult> {
    const { billingDate, subscriptionIds, dryRun } = options;
    
    const result: BillingResult = {
      processed: 0,
      successful: 0,
      failed: 0,
      totalAmount: 0,
      invoices: [],
      errors: []
    };

    // Get subscriptions that need billing
    const subscriptions = await this.getSubscriptionsForBilling(tenantId, billingDate, subscriptionIds);
    result.processed = subscriptions.length;

    for (const subscription of subscriptions) {
      try {
        const invoice = await this.createInvoiceForSubscription(tenantId, subscription, billingDate, dryRun);
        
        if (invoice) {
          result.successful++;
          result.totalAmount += invoice.total;
          result.invoices.push(invoice.id);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Log billing run
    if (!dryRun) {
      await this.logBillingRun(tenantId, result);
    }

    return result;
  }

  private async getSubscriptionsForBilling(tenantId: string, billingDate: Date, subscriptionIds?: string[]) {
    const where: any = {
      tenantId,
      status: 'ACTIVE',
      autoRenew: true,
      endsAt: {
        lte: billingDate
      }
    };

    if (subscriptionIds) {
      where.id = { in: subscriptionIds };
    }

    return prisma.subscription.findMany({
      where,
      include: {
        customer: true,
        plan: true
      }
    });
  }

  private async createInvoiceForSubscription(tenantId: string, subscription: any, billingDate: Date, dryRun: boolean) {
    const { customer, plan } = subscription;
    
    // Calculate billing period
    const periodStart = subscription.endsAt;
    const periodEnd = addDays(periodStart, plan.durationDays);
    
    // Check if invoice already exists for this period
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        subscriptionId: subscription.id,
        periodStart,
        periodEnd
      }
    });

    if (existingInvoice) {
      throw new Error('Invoice already exists for this period');
    }

    if (dryRun) {
      return {
        id: 'dry-run',
        total: plan.price + (plan.price * plan.taxRate / 100)
      };
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);
    
    // Calculate amounts
    const subtotal = plan.price;
    const taxAmount = subtotal * (plan.taxRate / 100);
    const total = subtotal + taxAmount;
    
    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        number: invoiceNumber,
        periodStart,
        periodEnd,
        subtotal,
        taxAmount,
        total,
        status: 'PENDING',
        dueDate: addDays(billingDate, 15), // 15 days due date
        items: {
          create: [
            {
              type: 'RECURRING',
              label: `${plan.name} (${format(periodStart, 'MMM dd')} - ${format(periodEnd, 'MMM dd, yyyy')})`,
              quantity: 1,
              unitPrice: plan.price,
              amount: plan.price
            },
            ...(taxAmount > 0 ? [{
              type: 'TAX' as const,
              label: `Tax (${plan.taxRate}%)`,
              quantity: 1,
              unitPrice: taxAmount,
              amount: taxAmount
            }] : [])
          ]
        }
      }
    });

    // Extend subscription
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        endsAt: periodEnd
      }
    });

    return invoice;
  }

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    const settings = await prisma.setting.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key: 'invoice_settings'
        }
      }
    });

    const invoiceSettings = settings ? JSON.parse(settings.valueJson) : {
      prefix: 'INV',
      numberFormat: '{PREFIX}-{TENANT}-{YEAR}{MONTH}-{SEQ}'
    };

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Get next sequence number for this month
    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        number: {
          startsWith: `${invoiceSettings.prefix}-${tenant!.slug.toUpperCase()}-${year}${month}-`
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.number.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return invoiceSettings.numberFormat
      .replace('{PREFIX}', invoiceSettings.prefix)
      .replace('{TENANT}', tenant!.slug.toUpperCase())
      .replace('{YEAR}', year.toString())
      .replace('{MONTH}', month)
      .replace('{SEQ}', String(sequence).padStart(4, '0'));
  }

  private async logBillingRun(tenantId: string, result: BillingResult) {
    // In a production system, you'd log this to a billing_runs table
    console.log(`Billing run completed for tenant ${tenantId}:`, result);
  }

  async previewBilling(tenantId: string) {
    const subscriptions = await this.getSubscriptionsForBilling(tenantId, new Date());
    
    const preview = await Promise.all(
      subscriptions.map(async (subscription) => {
        const subtotal = subscription.plan.price;
        const taxAmount = subtotal * (subscription.plan.taxRate / 100);
        const total = subtotal + taxAmount;
        
        return {
          subscriptionId: subscription.id,
          customerName: subscription.customer.name,
          planName: subscription.plan.name,
          subtotal,
          taxAmount,
          total,
          dueDate: addDays(new Date(), 15)
        };
      })
    );

    const summary = {
      totalSubscriptions: preview.length,
      totalAmount: preview.reduce((sum, item) => sum + item.total, 0),
      estimatedRevenue: preview.reduce((sum, item) => sum + item.subtotal, 0),
      estimatedTax: preview.reduce((sum, item) => sum + item.taxAmount, 0)
    };

    return { preview, summary };
  }

  async getBillingStatus(tenantId: string) {
    // Return billing status - in production, this would track running jobs
    const pendingSubscriptions = await prisma.subscription.count({
      where: {
        tenantId,
        status: 'ACTIVE',
        autoRenew: true,
        endsAt: { lte: new Date() }
      }
    });

    const lastBillingRun = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    return {
      pendingSubscriptions,
      lastBillingRun: lastBillingRun?.createdAt,
      status: pendingSubscriptions > 0 ? 'PENDING' : 'UP_TO_DATE'
    };
  }
}

export const billingService = new BillingService();