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
import { CreatePlanForm } from './CreatePlanForm';
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
