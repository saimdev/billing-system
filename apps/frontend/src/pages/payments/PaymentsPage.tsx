import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  PlusIcon,
  BanknotesIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { paymentsApi } from '../../services/api';
import { RecordPaymentForm } from './RecordPaymentForm';

export function PaymentsPage() {
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  const preSelectedInvoiceId = searchParams.get('invoiceId');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments', currentPage, statusFilter, methodFilter, searchQuery],
    queryFn: () => paymentsApi.list({
      page: currentPage,
      limit: 20,
      status: statusFilter || undefined,
      method: methodFilter || undefined,
      q: searchQuery || undefined
    })
  });

  const handleRecordPayment = () => {
    setShowRecordModal(false);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'warning',
      COMPLETED: 'success',
      FAILED: 'danger',
      REFUNDED: 'info'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} size="sm">
        {status}
      </Badge>
    );
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      CASH: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      BANK_TRANSFER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      GATEWAY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      CHEQUE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      CREDIT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[method as keyof typeof colors] || colors.CREDIT
      }`}>
        {method.replace('_', ' ')}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const payments = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage customer payments and receipts
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
          >
            Export
          </Button>
          <Button
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowRecordModal(true)}
          >
            Record Payment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search payments by reference or customer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-40">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </Select>
          </div>
          <div className="sm:w-40">
            <Select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="GATEWAY">Gateway</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CREDIT">Credit</option>
            </Select>
          </div>
          <Button variant="outline">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Payment List */}
      <Card>
        {payments.length === 0 ? (
          <EmptyState
            icon={<BanknotesIcon className="h-12 w-12" />}
            title="No payments found"
            description="No payments match your current filters."
            action={
              <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowRecordModal(true)}>
                Record Payment
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Reference</TableCell>
                  <TableCell header>Customer</TableCell>
                  <TableCell header>Invoice</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Method</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Date</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: any) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {payment.reference || payment.id.substring(0, 8)}
                        </div>
                        {payment.notes && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.invoice?.subscription?.customer?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.invoice ? (
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {payment.invoice.number}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ${payment.invoice.total.toFixed(2)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">No invoice</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`font-medium ${
                        payment.amount < 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {payment.amount < 0 ? '-' : ''}${Math.abs(payment.amount).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getMethodBadge(payment.method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.receivedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost">
                        Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title="Record Payment"
        size="lg"
      >
        <RecordPaymentForm
          preSelectedInvoiceId={preSelectedInvoiceId}
          onSuccess={handleRecordPayment}
          onCancel={() => setShowRecordModal(false)}
        />
      </Modal>
    </div>
  );
}