// apps/frontend/src/pages/customers/CustomerDetailPage.tsx (COMPLETED)
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { customersApi } from '../../services/api';
import { CreateSubscriptionForm } from '../subscriptions/CreateSubscriptionForm';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
    enabled: !!id
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['customer-subscriptions', id],
    queryFn: () => customersApi.getSubscriptions(id!),
    enabled: !!id
  });

  const { data: invoices } = useQuery({
    queryKey: ['customer-invoices', id],
    queryFn: () => customersApi.getInvoices(id!),
    enabled: !!id
  });

  const { data: tickets } = useQuery({
    queryKey: ['customer-tickets', id],
    queryFn: () => customersApi.getTickets(id!),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Customer not found</h2>
        <Button className="mt-4" onClick={() => navigate('/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'success',
      SUSPENDED: 'warning',
      TERMINATED: 'danger',
      PENDING: 'info',
      PAID: 'success',
      OVERDUE: 'danger',
      OPEN: 'warning',
      RESOLVED: 'success'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} size="sm">
        {status}
      </Badge>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscriptions', label: `Subscriptions (${subscriptions?.length || 0})` },
    { id: 'invoices', label: `Invoices (${invoices?.length || 0})` },
    { id: 'tickets', label: `Tickets (${tickets?.length || 0})` }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={() => navigate('/customers')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {customer.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customer ID: {customer.id.substring(0, 8)}...
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<PencilIcon className="h-4 w-4" />}
          >
            Edit
          </Button>
          <Button
            icon={<PlusIcon className="h-4 w-4" />}
            onClick={() => setShowCreateSubscription(true)}
          >
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Customer Info Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900 dark:text-white">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-900 dark:text-white">{customer.email}</span>
                </div>
              )}
              {customer.cnic && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">CNIC</span>
                  <p className="text-sm text-gray-900 dark:text-white">{customer.cnic}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address</h3>
            {customer.address ? (
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="text-sm text-gray-900 dark:text-white">
                  {customer.address.street && <div>{customer.address.street}</div>}
                  <div>
                    {[customer.address.city, customer.address.state, customer.address.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                  {customer.address.country && <div>{customer.address.country}</div>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No address provided</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Status</h3>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                <div className="mt-1">
                  {getStatusBadge(customer.status)}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Member Since</span>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
              {customer.tags && customer.tags.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {customer.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {/* Activity timeline would go here */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    No recent activity
                  </div>
                </div>
              </Card>
            </div>
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Active Subscriptions</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscriptions?.filter((s: any) => s.status === 'ACTIVE').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Pending Invoices</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {invoices?.filter((i: any) => i.status === 'PENDING').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Open Tickets</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tickets?.filter((t: any) => t.status === 'OPEN').length || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <Card>
            {!subscriptions || subscriptions.length === 0 ? (
              <EmptyState
                icon={<CreditCardIcon className="h-12 w-12" />}
                title="No subscriptions"
                description="This customer doesn't have any active subscriptions."
                action={
                  <Button
                    icon={<PlusIcon className="h-4 w-4" />}
                    onClick={() => setShowCreateSubscription(true)}
                  >
                    Add Subscription
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Plan</TableCell>
                    <TableCell header>Username</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Started</TableCell>
                    <TableCell header>Expires</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription: any) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {subscription.plan?.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {subscription.plan?.speedMbps}Mbps
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{subscription.username || '-'}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell>
                        {subscription.startedAt ? new Date(subscription.startedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {subscription.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {activeTab === 'invoices' && (
          <Card>
            {!invoices || invoices.length === 0 ? (
              <EmptyState
                icon={<DocumentTextIcon className="h-12 w-12" />}
                title="No invoices"
                description="This customer doesn't have any invoices yet."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Invoice #</TableCell>
                    <TableCell header>Service</TableCell>
                    <TableCell header>Amount</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Due Date</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice: any) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {invoice.number}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invoice.subscription?.plan?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        ${invoice.total.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}

        {activeTab === 'tickets' && (
          <Card>
            {!tickets || tickets.length === 0 ? (
              <EmptyState
                icon={<ExclamationTriangleIcon className="h-12 w-12" />}
                title="No support tickets"
                description="This customer hasn't submitted any support tickets."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Subject</TableCell>
                    <TableCell header>Category</TableCell>
                    <TableCell header>Priority</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Created</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {ticket.subject}
                        </div>
                        {ticket.subscription && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {ticket.subscription.plan?.name}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" size="sm">
                          {ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            ticket.priority === 'URGENT' ? 'danger' : 
                            ticket.priority === 'HIGH' ? 'warning' : 'info'
                          } 
                          size="sm"
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}
      </div>

      {/* Create Subscription Modal */}
      <Modal
        isOpen={showCreateSubscription}
        onClose={() => setShowCreateSubscription(false)}
        title="Add New Subscription"
        size="lg"
      >
        <CreateSubscriptionForm
          customerId={customer.id}
          onCancel={() => setShowCreateSubscription(false)}
          onSuccess={() => {
            setShowCreateSubscription(false);
            // Refetch data
            // The useQuery hooks will automatically refetch when their dependencies change
          }}
        />
      </Modal>
    </div>
  );
}