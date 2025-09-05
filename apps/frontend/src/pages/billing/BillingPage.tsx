import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlayIcon, 
  EyeIcon, 
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../components/ui/Table';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { billingApi } from '../../services/api';
import toast from 'react-hot-toast';

export function BillingPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const queryClient = useQueryClient();

  const { data: billingStatus, isLoading } = useQuery({
    queryKey: ['billing-status'],
    queryFn: billingApi.getStatus,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: preview } = useQuery({
    queryKey: ['billing-preview'],
    queryFn: billingApi.preview,
    enabled: showPreview
  });

  const runBillingMutation = useMutation({
    mutationFn: (options: { dryRun: boolean }) => billingApi.run(options),
    onSuccess: (result) => {
      if (dryRun) {
        toast.success(`Dry run completed: ${result.successful} invoices would be generated`);
      } else {
        toast.success(`Billing completed: ${result.successful} invoices generated`);
      }
      queryClient.invalidateQueries({ queryKey: ['billing-status'] });
      setShowRunModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Billing failed');
    }
  });

  const handleRunBilling = () => {
    runBillingMutation.mutate({ dryRun });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const status = billingStatus || {
    pendingSubscriptions: 0,
    lastBillingRun: null,
    status: 'UP_TO_DATE'
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      UP_TO_DATE: { variant: 'success' as const, icon: CheckCircleIcon, text: 'Up to Date' },
      PENDING: { variant: 'warning' as const, icon: ClockIcon, text: 'Pending' },
      RUNNING: { variant: 'info' as const, icon: PlayIcon, text: 'Running' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.UP_TO_DATE;
    
    return (
      <div className="flex items-center space-x-2">
        <config.icon className="h-5 w-5" />
        <Badge variant={config.variant}>{config.text}</Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Billing Engine</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage recurring billing and invoice generation
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<EyeIcon className="h-4 w-4" />}
            onClick={() => setShowPreview(true)}
          >
            Preview
          </Button>
          <Button
            icon={<PlayIcon className="h-4 w-4" />}
            onClick={() => setShowRunModal(true)}
            disabled={status.pendingSubscriptions === 0}
          >
            Run Billing
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarDaysIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Billing Status</p>
              <div className="mt-1">
                {getStatusBadge(status.status)}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {status.pendingSubscriptions}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Billing Run</p>
              <p className="text-sm text-gray-900 dark:text-white">
                {status.lastBillingRun 
                  ? new Date(status.lastBillingRun).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Billing Information */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">How Billing Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Automatic Billing</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Runs automatically for subscriptions reaching their end date</li>
              <li>• Generates invoices with 15-day payment terms</li>
              <li>• Extends subscription period upon successful billing</li>
              <li>• Handles proration for mid-cycle changes</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Manual Controls</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Preview billing before running</li>
              <li>• Dry run to test without creating invoices</li>
              <li>• Select specific subscriptions to bill</li>
              <li>• Override billing dates when needed</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Recent Billing Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Last billing cycle completed</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generated 45 invoices for monthly subscriptions
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {status.lastBillingRun ? new Date(status.lastBillingRun).toLocaleDateString() : 'N/A'}
              </p>
              <Badge variant="success" size="sm">Completed</Badge>
            </div>
          </div>
        </div>
      </Card>
      <Modal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Billing Preview"
        size="xl"
      >
        <div className="space-y-4">
          {preview ? (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Summary</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-blue-600 dark:text-blue-300">Total Subscriptions:</span>
                    <span className="ml-2 font-medium">{preview.summary.totalSubscriptions}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-300">Total Amount:</span>
                    <span className="ml-2 font-medium">${preview.summary.totalAmount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-300">Estimated Revenue:</span>
                    <span className="ml-2 font-medium">${preview.summary.estimatedRevenue.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600 dark:text-blue-300">Estimated Tax:</span>
                    <span className="ml-2 font-medium">${preview.summary.estimatedTax.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell header>Customer</TableCell>
                      <TableCell header>Plan</TableCell>
                      <TableCell header>Subtotal</TableCell>
                      <TableCell header>Tax</TableCell>
                      <TableCell header>Total</TableCell>
                      <TableCell header>Due Date</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.preview.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.planName}</TableCell>
                        <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                        <TableCell>${item.taxAmount.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${item.total.toFixed(2)}</TableCell>
                        <TableCell>{new Date(item.dueDate).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner size="md" />
            </div>
          )}
        </div>
      </Modal>

      {/* Run Billing Modal */}
      <Modal
        isOpen={showRunModal}
        onClose={() => setShowRunModal(false)}
        title="Run Billing Cycle"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important</h4>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                  This will generate invoices for {status.pendingSubscriptions} subscription(s). 
                  {!dryRun && ' This action cannot be undone.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dryRun"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="dryRun" className="ml-2 text-sm text-gray-900 dark:text-white">
                Dry run (preview only, don't create actual invoices)
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowRunModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRunBilling}
              loading={runBillingMutation.isPending}
              variant={dryRun ? 'outline' : 'primary'}
            >
              {runBillingMutation.isPending 
                ? 'Running...' 
                : dryRun 
                  ? 'Run Dry Test' 
                  : 'Run Billing'
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}