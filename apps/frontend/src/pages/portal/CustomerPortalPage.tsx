import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  WifiIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  SignalIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { FormField, Label, Textarea } from '../../components/ui/Form';
import { customerPortalApi } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


export function CustomerPortalPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['customer-portal'],
    queryFn: customerPortalApi.getDashboard
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'success',
      SUSPENDED: 'warning',
      TERMINATED: 'danger',
      PAID: 'success',
      PENDING: 'warning',
      OVERDUE: 'danger',
      OPEN: 'warning',
      RESOLVED: 'success',
      CLOSED: 'default'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} size="sm">
        {status}
      </Badge>
    );
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject || !ticketDescription) return;
    
    try {
      await customerPortalApi.createTicket({
        subject: ticketSubject,
        description: ticketDescription
      });
      setShowTicketModal(false);
      setTicketSubject('');
      setTicketDescription('');
      // Refetch data or show success message
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await customerPortalApi.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { customer, subscription, usage, invoices, tickets } = dashboardData || {};

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'usage', label: 'Usage', icon: SignalIcon },
    { id: 'invoices', label: 'Invoices', icon: DocumentTextIcon },
    { id: 'support', label: 'Support', icon: ExclamationTriangleIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <GlobeAltIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Customer Portal
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {customer?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(subscription?.status || 'INACTIVE')}
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {subscription?.plan?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {subscription?.plan?.speedMbps}Mbps
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Service Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <WifiIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Connection Status
                    </p>
                    <p className="text-lg font-bold text-green-600">
                      Online
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <SignalIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Current Speed
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {subscription?.plan?.speedMbps}Mbps
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Next Billing
                    </p>
                    <p className="text-lg font-bold text-orange-600">
                      {subscription?.endsAt ? new Date(subscription.endsAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Account Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {customer?.phone}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {customer?.email}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer?.address?.street}<br />
                      {customer?.address?.city}, {customer?.address?.state} {customer?.address?.zipCode}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Service Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Plan</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscription?.plan?.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Username</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                      {subscription?.username}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Rate</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${subscription?.plan?.price}/month
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Auto Renewal</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscription?.autoRenew ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowTicketModal(true)}
                >
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab('invoices')}
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  View Invoices
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab('usage')}
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Check Usage
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-6">
            {/* Current Month Usage */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Upload
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatBytes(usage?.currentMonth?.upBytes || 0)}
                  </p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Download
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatBytes(usage?.currentMonth?.downBytes || 0)}
                  </p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Usage
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatBytes(usage?.currentMonth?.totalBytes || 0)}
                  </p>
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sessions
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {usage?.currentMonth?.sessions || 0}
                  </p>
                </div>
              </Card>
            </div>

            {/* Usage Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Usage History
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usage?.history || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} GB`, 'Usage']} />
                  <Line 
                    type="monotone" 
                    dataKey="usage" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {activeTab === 'invoices' && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Invoice History
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Invoice #</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Due Date</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {invoice.number}
                      </div>
                    </TableCell>
                    <TableCell>
                      ${invoice.total.toFixed(2)}
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(invoice.id, invoice.number)}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {activeTab === 'support' && (
          <div className="space-y-6">
            {/* Create Ticket Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Support Tickets
              </h2>
              <Button onClick={() => setShowTicketModal(true)}>
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Create Ticket
              </Button>
            </div>

            {/* Support Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      +1 (555) 123-4567
                    </span>
                  </div>
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      support@demo-isp.com
                    </span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      24/7 Support Available
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Common Issues
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    • Slow internet connection
                  </button>
                  <button className="w-full text-left text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    • Connection drops frequently
                  </button>
                  <button className="w-full text-left text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    • Unable to connect to WiFi
                  </button>
                  <button className="w-full text-left text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                    • Billing questions
                  </button>
                </div>
              </Card>
            </div>

            {/* Ticket History */}
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Your Tickets
                </h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Subject</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Priority</TableCell>
                    <TableCell header>Created</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets?.map((ticket: any) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {ticket.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ticket.priority === 'HIGH' ? 'warning' : 'default'} size="sm">
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {/* Create Ticket Modal */}
        <Modal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          title="Create Support Ticket"
          size="lg"
        >
          <div className="space-y-4">
            <FormField>
              <Label htmlFor="subject" required>
                Subject
              </Label>
              <Input
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief description of your issue"
              />
            </FormField>

            <FormField>
              <Label htmlFor="description" required>
                Description
              </Label>
              <Textarea
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Please provide detailed information about your issue"
                rows={5}
              />
            </FormField>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Before submitting a ticket:
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Check if your modem/router is properly connected</li>
                <li>• Try restarting your network equipment</li>
                <li>• Check our service status page for known issues</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowTicketModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!ticketSubject || !ticketDescription}
              >
                Create Ticket
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}