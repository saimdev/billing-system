import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { invoicesApi } from '../../services/api';
import { SendInvoiceModal } from '../../components/invoices/SendInvoiceModal';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSendModal, setShowSendModal] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getById(id!),
    enabled: !!id
  });

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      const response = await invoicesApi.downloadPDF(invoice.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      DRAFT: 'default',
      PENDING: 'warning',
      PAID: 'success',
      OVERDUE: 'danger',
      CANCELLED: 'default',
      REFUNDED: 'info'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice not found</h2>
        <Button className="mt-4" onClick={() => navigate('/invoices')}>
          Back to Invoices
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => navigate('/invoices')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Invoice {invoice.number}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Created on {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<PrinterIcon className="h-4 w-4" />}
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            variant="outline"
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
          <Button
            variant="outline"
            icon={<PaperAirplaneIcon className="h-4 w-4" />}
            onClick={() => setShowSendModal(true)}
          >
            Send
          </Button>
          {invoice.status !== 'PAID' && (
            <Button
              icon={<CreditCardIcon className="h-4 w-4" />}
              onClick={() => navigate(`/payments?invoiceId=${invoice.id}`)}
            >
              Record Payment
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-8">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">INVOICE</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Invoice #{invoice.number}
                </p>
              </div>
              <div className="text-right">
                {getStatusBadge(invoice.status)}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Due: {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Customer & Company Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">From:</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">Your ISP Company</p>
                  <p>123 Business Street</p>
                  <p>City, State 12345</p>
                  <p>Phone: (555) 123-4567</p>
                  <p>Email: billing@yourisp.com</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">To:</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">{invoice.subscription?.customer?.name}</p>
                  <p>Phone: {invoice.subscription?.customer?.phone}</p>
                  {invoice.subscription?.customer?.email && (
                    <p>Email: {invoice.subscription?.customer?.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Service Period */}
            {invoice.periodStart && invoice.periodEnd && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Service Period</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(invoice.periodStart).toLocaleDateString()} - {new Date(invoice.periodEnd).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Invoice Items */}
            <div className="mb-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Description</TableCell>
                    <TableCell header>Qty</TableCell>
                    <TableCell header>Rate</TableCell>
                    <TableCell header>Amount</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.label}
                          </div>
                          {item.type !== 'RECURRING' && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.type}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell>${item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Invoice Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                    <span className="text-gray-900 dark:text-white">${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  {invoice.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                      <span className="text-gray-900 dark:text-white">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-gray-900 dark:text-white">${invoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Invoice Details</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <div className="mt-1">
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Invoice Date</span>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Due Date</span>
                <p className={`text-sm ${
                  new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
                    ? 'text-red-600 dark:text-red-400 font-medium'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
              {invoice.paidAt && (
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Paid On</span>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(invoice.paidAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {invoice.payments && invoice.payments.length > 0 && (
            <Card className="p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payments</h3>
              <div className="space-y-3">
                {invoice.payments.map((payment: any) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        ${payment.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.method} • {new Date(payment.receivedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="success" size="sm">
                      {payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Send Invoice Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Invoice"
      >
        <SendInvoiceModal
          invoice={invoice}
          onClose={() => setShowSendModal(false)}
        />
      </Modal>
    </div>
  );
}