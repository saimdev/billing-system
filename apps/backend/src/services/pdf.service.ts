// apps/backend/src/services/pdf.service.ts
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config/env.js';

class PDFService {
  async generateInvoice(invoice: any, tenant: any): Promise<Buffer> {
    const html = this.generateInvoiceHTML(invoice, tenant);
    return this.generatePDFFromHTML(html);
  }

  async generateReceipt(payment: any, tenant: any): Promise<Buffer> {
    const html = this.generateReceiptHTML(payment, tenant);
    return this.generatePDFFromHTML(html);
  }

  private async generatePDFFromHTML(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html);
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateInvoiceHTML(invoice: any, tenant: any): string {
    const brandingData = tenant.brandingJson ? JSON.parse(tenant.brandingJson) : {};
    const companyInfo = brandingData.companyInfo || {
      address: '123 Business Street, City, State 12345',
      phone: '(555) 123-4567',
      email: 'billing@yourisp.com'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              border-bottom: 2px solid #3B82F6;
              padding-bottom: 20px;
            }
            .company-info h1 {
              color: #3B82F6;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .company-info p {
              margin: 2px 0;
              font-size: 14px;
              color: #666;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h2 {
              font-size: 32px;
              margin: 0;
              color: #3B82F6;
            }
            .invoice-meta {
              margin-top: 10px;
              font-size: 14px;
            }
            .parties {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .party {
              width: 45%;
            }
            .party h3 {
              margin: 0 0 10px 0;
              color: #333;
              font-size: 16px;
            }
            .party p {
              margin: 2px 0;
              font-size: 14px;
            }
            .service-period {
              background: #F3F4F6;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .service-period h4 {
              margin: 0 0 5px 0;
              color: #374151;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #E5E7EB;
            }
            th {
              background: #F9FAFB;
              font-weight: 600;
              color: #374151;
            }
            .amount {
              text-align: right;
            }
            .totals {
              margin-left: auto;
              width: 300px;
            }
            .totals table {
              margin-bottom: 0;
            }
            .totals .total-row {
              font-weight: 600;
              font-size: 16px;
              border-top: 2px solid #3B82F6;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              font-size: 12px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background: #D1FAE5; color: #065F46; }
            .status-pending { background: #FEF3C7; color: #92400E; }
            .status-overdue { background: #FEE2E2; color: #991B1B; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="company-info">
                <h1>${tenant.name}</h1>
                <p>${companyInfo.address}</p>
                <p>Phone: ${companyInfo.phone}</p>
                <p>Email: ${companyInfo.email}</p>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <div class="invoice-meta">
                  <p><strong>Invoice #:</strong> ${invoice.number}</p>
                  <p><strong>Date:</strong> ${format(new Date(invoice.createdAt), 'MMM dd, yyyy')}</p>
                  <p><strong>Due Date:</strong> ${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                  <p><span class="status-badge status-${invoice.status.toLowerCase()}">${invoice.status}</span></p>
                </div>
              </div>
            </div>

            <div class="parties">
              <div class="party">
                <h3>Bill To:</h3>
                <p><strong>${invoice.subscription?.customer?.name || 'N/A'}</strong></p>
                <p>Phone: ${invoice.subscription?.customer?.phone || 'N/A'}</p>
                ${invoice.subscription?.customer?.email ? `<p>Email: ${invoice.subscription.customer.email}</p>` : ''}
              </div>
            </div>

            ${invoice.periodStart && invoice.periodEnd ? `
              <div class="service-period">
                <h4>Service Period</h4>
                <p>${format(new Date(invoice.periodStart), 'MMM dd, yyyy')} - ${format(new Date(invoice.periodEnd), 'MMM dd, yyyy')}</p>
              </div>
            ` : ''}

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th class="amount">Rate</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items?.map((item: any) => `
                  <tr>
                    <td>
                      <strong>${item.label}</strong>
                      ${item.type !== 'RECURRING' ? `<br><small>${item.type}</small>` : ''}
                    </td>
                    <td>${item.quantity}</td>
                    <td class="amount">$${item.unitPrice.toFixed(2)}</td>
                    <td class="amount">$${item.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="totals">
              <table>
                <tr>
                  <td>Subtotal:</td>
                  <td class="amount">$${invoice.subtotal.toFixed(2)}</td>
                </tr>
                ${invoice.taxAmount > 0 ? `
                  <tr>
                    <td>Tax:</td>
                    <td class="amount">$${invoice.taxAmount.toFixed(2)}</td>
                  </tr>
                ` : ''}
                <tr class="total-row">
                  <td>Total:</td>
                  <td class="amount">$${invoice.total.toFixed(2)}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Please remit payment by the due date to avoid service interruption.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private generateReceiptHTML(payment: any, tenant: any): string {
    const brandingData = tenant.brandingJson ? JSON.parse(tenant.brandingJson) : {};
    const companyInfo = brandingData.companyInfo || {
      address: '123 Business Street, City, State 12345',
      phone: '(555) 123-4567',
      email: 'billing@yourisp.com'
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #10B981;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #10B981;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            .header h2 {
              margin: 0 0 10px 0;
              font-size: 20px;
            }
            .receipt-info {
              background: #F0FDF4;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              text-align: center;
            }
            .amount {
              font-size: 32px;
              font-weight: bold;
              color: #10B981;
              margin: 10px 0;
            }
            .details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .detail-group {
              width: 48%;
            }
            .detail-group h4 {
              margin: 0 0 10px 0;
              color: #374151;
              border-bottom: 1px solid #E5E7EB;
              padding-bottom: 5px;
            }
            .detail-group p {
              margin: 5px 0;
              font-size: 14px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #E5E7EB;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${tenant.name}</h1>
              <h2>PAYMENT RECEIPT</h2>
              <p>${companyInfo.address}</p>
              <p>Phone: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
            </div>

            <div class="receipt-info">
              <p><strong>Receipt #:</strong> ${payment.reference || payment.id}</p>
              <div class="amount">$${payment.amount.toFixed(2)}</div>
              <p><strong>Payment Date:</strong> ${format(new Date(payment.receivedAt), 'MMM dd, yyyy')}</p>
            </div>

            <div class="details">
              <div class="detail-group">
                <h4>Payment Details</h4>
                <p><strong>Method:</strong> ${payment.method.replace('_', ' ')}</p>
                <p><strong>Reference:</strong> ${payment.reference || 'N/A'}</p>
                <p><strong>Status:</strong> ${payment.status}</p>
                ${payment.notes ? `<p><strong>Notes:</strong> ${payment.notes}</p>` : ''}
              </div>
              <div class="detail-group">
                <h4>Customer Details</h4>
                <p><strong>Name:</strong> ${payment.invoice?.subscription?.customer?.name || 'N/A'}</p>
                <p><strong>Phone:</strong> ${payment.invoice?.subscription?.customer?.phone || 'N/A'}</p>
                ${payment.invoice ? `<p><strong>Invoice:</strong> ${payment.invoice.number}</p>` : ''}
              </div>
            </div>

            <div class="footer">
              <p>Thank you for your payment!</p>
              <p>This receipt serves as proof of payment. Please retain for your records.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async savePDF(buffer: Buffer, filePath: string): Promise<void> {
    const fullPath = path.join(config.PDF_STORAGE_DIR, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Save PDF
    await fs.writeFile(fullPath, buffer);
  }
}

export const pdfService = new PDFService();