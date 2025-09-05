import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

class EmailService {
  private transporter;

  constructor() {
    if (config.EMAIL_HOST && !config.DEMO_MODE) {
      this.transporter = nodemailer.createTransporter({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS
        }
      });
    } else {
      // Mock transporter for demo mode
      this.transporter = {
        sendMail: async (options: any) => {
          console.log('📧 Mock Email Sent:', {
            to: options.to,
            subject: options.subject,
            text: options.text?.substring(0, 100) + '...'
          });
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string) {
    const subject = 'Password Reset Request';
    const text = `Hi ${name},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nISP Billing Team`;
    
    await this.transporter.sendMail({
      from: config.EMAIL_FROM,
      to: email,
      subject,
      text
    });
  }

  async sendInvoice(email: string, name: string, invoiceNumber: string, pdfBuffer: Buffer) {
    const subject = `Invoice ${invoiceNumber}`;
    const text = `Hi ${name},\n\nPlease find your invoice ${invoiceNumber} attached.\n\nBest regards,\nBilling Team`;
    
    await this.transporter.sendMail({
      from: config.EMAIL_FROM,
      to: email,
      subject,
      text,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer
        }
      ]
    });
  }

  async sendPaymentReceipt(email: string, name: string, receiptNumber: string, amount: number) {
    const subject = `Payment Receipt ${receiptNumber}`;
    const text = `Hi ${name},\n\nThank you for your payment of $${amount}. Your receipt number is ${receiptNumber}.\n\nBest regards,\nBilling Team`;
    
    await this.transporter.sendMail({
      from: config.EMAIL_FROM,
      to: email,
      subject,
      text
    });
  }
}

export const emailService = new EmailService();