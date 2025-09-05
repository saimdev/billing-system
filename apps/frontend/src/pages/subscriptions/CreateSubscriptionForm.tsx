import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField, Label, Input, Select } from '@/components/ui/Form';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { customersApi, plansApi, subscriptionsApi } from '../../services/api';
import toast from 'react-hot-toast';

const createSubscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  planId: z.string().min(1, 'Plan is required'),
  username: z.string().optional(),
  mac: z.string().optional(),
  accessType: z.enum(['PPPOE', 'HOTSPOT', 'GPON', 'STATIC_IP']),
  autoRenew: z.boolean(),
  startDate: z.string().optional()
});

type CreateSubscriptionForm = z.infer<typeof createSubscriptionSchema>;

interface CreateSubscriptionFormProps {
  customerId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateSubscriptionForm({ customerId, onSuccess, onCancel }: CreateSubscriptionFormProps) {
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ limit: 100 }),
    enabled: !customerId
  });

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: plansApi.list
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateSubscriptionForm>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      customerId: customerId || '',
      accessType: 'PPPOE',
      autoRenew: true
    }
  });

  const onSubmit = async (data: CreateSubscriptionForm) => {
    try {
      await subscriptionsApi.create(data);
      toast.success('Subscription created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create subscription');
    }
  };

  if (customersLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!customerId && (
        <FormField>
          <Label htmlFor="customerId" required>Customer</Label>
          <Select {...register('customerId')} error={errors.customerId?.message}>
            <option value="">Select a customer</option>
            {customers?.data?.map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <FormField>
        <Label htmlFor="planId" required>Service Plan</Label>
        <Select {...register('planId')} error={errors.planId?.message}>
          <option value="">Select a plan</option>
          {plans?.map((plan: any) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} - ${plan.price}/month
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="username">Username</Label>
          <Input
            {...register('username')}
            placeholder="PPPoE username"
            error={errors.username?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="accessType">Access Type</Label>
          <Select {...register('accessType')} error={errors.accessType?.message}>
            <option value="PPPOE">PPPoE</option>
            <option value="HOTSPOT">Hotspot</option>
            <option value="GPON">GPON</option>
            <option value="STATIC_IP">Static IP</option>
          </Select>
        </FormField>
      </div>

      <FormField>
        <Label htmlFor="mac">MAC Address</Label>
        <Input
          {...register('mac')}
          placeholder="00:1A:2B:3C:4D:5E"
          error={errors.mac?.message}
        />
      </FormField>

      <FormField>
        <Label htmlFor="startDate">Start Date</Label>
        <Input
          {...register('startDate')}
          type="date"
          error={errors.startDate?.message}
        />
      </FormField>

      <FormField>
        <div className="flex items-center">
          <input
            {...register('autoRenew')}
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <Label htmlFor="autoRenew" className="ml-2 mb-0">
            Enable Auto Renewal
          </Label>
        </div>
      </FormField>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create Subscription
        </Button>
      </div>
    </form>
  );
}