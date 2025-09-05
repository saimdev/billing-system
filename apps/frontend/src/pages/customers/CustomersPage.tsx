import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  ArrowDownTrayIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { customersApi } from '../../services/api';
import { CreateCustomerForm } from './CreateCustomerForm';
import { ImportCustomersModal } from './ImportCustomersModal';
import toast from 'react-hot-toast';

export function CustomersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', currentPage, searchQuery, statusFilter],
    queryFn: () => customersApi.list({
      page: currentPage,
      limit: 20,
      q: searchQuery || undefined,
      status: statusFilter || undefined
    })
  });

  const handleCreateCustomer = async (customerData: any) => {
    try {
      await customersApi.create(customerData);
      toast.success('Customer created successfully');
      setShowCreateModal(false);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'success',
      SUSPENDED: 'warning',
      TERMINATED: 'danger'
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

  const customers = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your customer database and subscriptions
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<DocumentArrowUpIcon className="h-4 w-4" />}
            onClick={() => setShowImportModal(true)}
          >
            Import
          </Button>
          <Button
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search customers by name, phone, or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white dark:bg-gray-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
          <Button type="submit" variant="outline">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </form>
      </Card>

      {/* Customer List */}
      <Card>
        {customers.length === 0 ? (
          <EmptyState
            icon={<MagnifyingGlassIcon className="h-12 w-12" />}
            title="No customers found"
            description="Get started by adding your first customer."
            action={
              <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                Add Customer
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Customer</TableCell>
                  <TableCell header>Contact</TableCell>
                  <TableCell header>Subscriptions</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Created</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: any) => (
                  <TableRow 
                    key={customer.id} 
                    clickable 
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </div>
                        {customer.cnic && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            CNIC: {customer.cnic}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-gray-900 dark:text-white">
                          {customer._count?.subscriptions || 0} active
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {customer._count?.tickets || 0} tickets
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/customers/${customer.id}`}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
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

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Customer"
        size="lg"
      >
        <CreateCustomerForm
          onSubmit={handleCreateCustomer}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Import Customers Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Customers"
        size="lg"
      >
        <ImportCustomersModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            refetch();
          }}
        />
      </Modal>
    </div>
  );
}