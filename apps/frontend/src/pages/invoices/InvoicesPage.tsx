import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PaperAirplaneIcon,
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
import { invoicesApi } from '../../services/api';

export function InvoicesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', currentPage, statusFilter, searchQuery],
    queryFn: () => invoicesApi.list({
      page: currentPage,
      limit: 20,
      status: statusFilter || undefined,
      q: searchQuery || undefined
    })
  });

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await invoicesApi.downloadPDF(invoiceId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
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
      <Badge variant={variants[status as keyof typeof variants] || 'default'} size="sm">
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

  const invoices = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Invoices</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customer invoices and billing documents
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
          >
            Export
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
                placeholder="Search invoices by number or customer..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
          <Button variant="outline">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Invoice List */}
      <Card>
        {invoices.length === 0 ? (
          <EmptyState
            icon={<DocumentTextIcon className="h-12 w-12" />}
            title="No invoices found"
            description="No invoices match your current filters."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Invoice #</TableCell>
                  <TableCell header>Customer</TableCell>
                  <TableCell header>Service</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Due Date</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow 
                    key={invoice.id}
                    clickable
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {invoice.number}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {invoice.subscription?.customer?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {invoice.subscription?.customer?.phone || ''}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {invoice.subscription?.plan?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          ${invoice.total.toFixed(2)}
                        </div>
                        {invoice.taxAmount > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            +${invoice.taxAmount.toFixed(2)} tax
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${
                        new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID'
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(invoice.id);
                          }}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle send invoice
                          }}
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                        </Button>
                      </div>
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
    </div>
  );
}