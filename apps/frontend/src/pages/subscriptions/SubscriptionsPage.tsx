// apps/frontend/src/pages/plans/PlansPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  WifiIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Modal } from '../../components/ui/Modal';
import { plansApi } from '../../services/api';
import { CreatePlanForm } from '../../components/plans/CreatePlanForm';
import toast from 'react-hot-toast';

export function PlansPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list
  });

  const deletePlanMutation = useMutation({
    mutationFn: plansApi.delete,
    onSuccess: () => {
      toast.success('Plan deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete plan');
    }
  });

  const handleCreatePlan = () => {
    setShowCreateModal(false);
    queryClient.invalidateQueries({ queryKey: ['plans'] });
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setShowEditModal(true);
  };

  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      deletePlanMutation.mutate(planId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Service Plans</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage internet service plans and pricing
          </p>
        </div>
        <Button
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Add Plan
        </Button>
      </div>

      {/* Plans Grid */}
      {!plans || plans.length === 0 ? (
        <EmptyState
          icon={<WifiIcon className="h-12 w-12" />}
          title="No plans created"
          description="Create your first internet service plan to get started."
          action={
            <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
              Create Plan
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan: any) => (
            <Card key={plan.id} className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    <WifiIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.speedMbps}Mbps
                    </span>
                    {plan.quotaGb && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        • {plan.quotaGb}GB
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Price</span>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {plan.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                      /{plan.durationDays}d
                    </span>
                  </div>
                </div>

                {plan.taxRate > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tax Rate</span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {plan.taxRate}%
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Active Subscriptions</span>
                  <Badge variant="info" size="sm">
                    {plan._count?.subscriptions || 0}
                  </Badge>
                </div>

                {plan.fupJson && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
                    <span className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      Fair Usage Policy
                    </span>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                      {JSON.parse(plan.fupJson).enabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Plan"
        size="lg"
      >
        <CreatePlanForm
          onSuccess={handleCreatePlan}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Plan"
        size="lg"
      >
        <CreatePlanForm
          plan={selectedPlan}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedPlan(null);
            queryClient.invalidateQueries({ queryKey: ['plans'] });
          }}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedPlan(null);
          }}
        />
      </Modal>
    </div>
  );
}

// apps/frontend/src/pages/subscriptions/SubscriptionsPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
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
import { subscriptionsApi } from '../../services/api';
import { CreateSubscriptionForm } from '../../components/subscriptions/CreateSubscriptionForm';

export function SubscriptionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscriptions', currentPage, statusFilter, searchQuery],
    queryFn: () => subscriptionsApi.list({
      page: currentPage,
      limit: 20,
      status: statusFilter || undefined,
      q: searchQuery || undefined
    })
  });

  const handleCreateSubscription = () => {
    setShowCreateModal(false);
    refetch();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'warning',
      ACTIVE: 'success',
      SUSPENDED: 'danger',
      TERMINATED: 'default'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'} size="sm">
        {status}
      </Badge>
    );
  };

  const getAccessTypeBadge = (accessType: string) => {
    const colors = {
      PPPOE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      HOTSPOT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      GPON: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      STATIC_IP: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[accessType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
      }`}>
        {accessType.replace('_', ' ')}
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

  const subscriptions = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Subscriptions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customer service subscriptions and connections
          </p>
        </div>
        <Button
          icon={<PlusIcon className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Add Subscription
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by customer name, username, or MAC..."
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
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="TERMINATED">Terminated</option>
            </Select>
          </div>
          <Button variant="outline">
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Subscriptions List */}
      <Card>
        {subscriptions.length === 0 ? (
          <EmptyState
            icon={<CreditCardIcon className="h-12 w-12" />}
            title="No subscriptions found"
            description="No subscriptions match your current filters."
            action={
              <Button icon={<PlusIcon className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
                Add Subscription
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Customer</TableCell>
                  <TableCell header>Plan</TableCell>
                  <TableCell header>Username</TableCell>
                  <TableCell header>Access Type</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Started</TableCell>
                  <TableCell header>Expires</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription: any) => (
                  <TableRow key={subscription.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {subscription.customer?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {subscription.customer?.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {subscription.plan?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {subscription.plan?.speedMbps}Mbps • ${subscription.plan?.price}/mo
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {subscription.username || '-'}
                      </div>
                      {subscription.mac && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {subscription.mac}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getAccessTypeBadge(subscription.accessType)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(subscription.status)}
                    </TableCell>
                    <TableCell>
                      {subscription.startedAt 
                        ? new Date(subscription.startedAt).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className={`text-sm ${
                        subscription.endsAt && new Date(subscription.endsAt) < new Date()
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {subscription.endsAt 
                          ? new Date(subscription.endsAt).toLocaleDateString()
                          : '-'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {subscription.status === 'ACTIVE' ? (
                          <Button size="sm" variant="ghost" title="Suspend">
                            <PauseIcon className="h-4 w-4" />
                          </Button>
                        ) : subscription.status === 'SUSPENDED' ? (
                          <Button size="sm" variant="ghost" title="Resume">
                            <PlayIcon className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" title="Activate">
                            <PlayIcon className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" title="Terminate">
                          <StopIcon className="h-4 w-4" />
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

      {/* Create Subscription Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Subscription"
        size="lg"
      >
        <CreateSubscriptionForm
          onSuccess={handleCreateSubscription}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}