import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField, Label, Input } from '@/components/ui/Form';
import { plansApi } from '../../services/api';
import toast from 'react-hot-toast';

const createPlanSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  speedMbps: z.number().positive('Speed must be positive').optional(),
  quotaGb: z.number().positive('Quota must be positive').optional(),
  price: z.number().positive('Price must be positive'),
  durationDays: z.number().positive('Duration must be positive').default(30),
  taxRate: z.number().min(0).max(100).default(0),
  fupEnabled: z.boolean().default(false),
  fupThreshold: z.number().positive().optional(),
  fupReducedSpeed: z.number().positive().optional()
});

type CreatePlanForm = z.infer<typeof createPlanSchema>;

interface CreatePlanFormProps {
  plan?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreatePlanForm({ plan, onSuccess, onCancel }: CreatePlanFormProps) {
  const isEditing = !!plan;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreatePlanForm>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: plan ? {
      name: plan.name,
      speedMbps: plan.speedMbps,
      quotaGb: plan.quotaGb,
      price: plan.price,
      durationDays: plan.durationDays,
      taxRate: plan.taxRate,
      fupEnabled: plan.fupJson ? JSON.parse(plan.fupJson).enabled : false,
      fupThreshold: plan.fupJson ? JSON.parse(plan.fupJson).threshold : undefined,
      fupReducedSpeed: plan.fupJson ? JSON.parse(plan.fupJson).reducedSpeed : undefined
    } : {
      durationDays: 30,
      taxRate: 0,
      fupEnabled: false
    }
  });

  const fupEnabled = watch('fupEnabled');

  const onSubmit = async (data: CreatePlanForm) => {
    try {
      const planData = {
        name: data.name,
        speedMbps: data.speedMbps,
        quotaGb: data.quotaGb,
        price: data.price,
        durationDays: data.durationDays,
        taxRate: data.taxRate,
        fupRules: {
          enabled: data.fupEnabled,
          threshold: data.fupEnabled ? data.fupThreshold : undefined,
          reducedSpeed: data.fupEnabled ? data.fupReducedSpeed : undefined
        }
      };

      if (isEditing) {
        await plansApi.update(plan.id, planData);
        toast.success('Plan updated successfully');
      } else {
        await plansApi.create(planData);
        toast.success('Plan created successfully');
      }
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} plan`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField>
        <Label htmlFor="name" required>Plan Name</Label>
        <Input
          {...register('name')}
          placeholder="e.g., Basic 25Mbps, Premium 100Mbps"
          error={errors.name?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="speedMbps">Speed (Mbps)</Label>
          <Input
            {...register('speedMbps', { valueAsNumber: true })}
            type="number"
            placeholder="25"
            error={errors.speedMbps?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="quotaGb">Monthly Quota (GB)</Label>
          <Input
            {...register('quotaGb', { valueAsNumber: true })}
            type="number"
            placeholder="Leave empty for unlimited"
            error={errors.quotaGb?.message}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField>
          <Label htmlFor="price" required>Price ($)</Label>
          <Input
            {...register('price', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="29.99"
            error={errors.price?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="durationDays" required>Duration (Days)</Label>
          <Input
            {...register('durationDays', { valueAsNumber: true })}
            type="number"
            placeholder="30"
            error={errors.durationDays?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            {...register('taxRate', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="18"
            error={errors.taxRate?.message}
          />
        </FormField>
      </div>

      <div className="border-t pt-6">
        <div className="flex items-center mb-4">
          <input
            {...register('fupEnabled')}
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <Label htmlFor="fupEnabled" className="ml-2 mb-0">
            Enable Fair Usage Policy (FUP)
          </Label>
        </div>

        {fupEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField>
              <Label htmlFor="fupThreshold">FUP Threshold (GB)</Label>
              <Input
                {...register('fupThreshold', { valueAsNumber: true })}
                type="number"
                placeholder="500"
                error={errors.fupThreshold?.message}
              />
            </FormField>

            <FormField>
              <Label htmlFor="fupReducedSpeed">Reduced Speed (Mbps)</Label>
              <Input
                {...register('fupReducedSpeed', { valueAsNumber: true })}
                type="number"
                placeholder="5"
                error={errors.fupReducedSpeed?.message}
              />
            </FormField>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? 'Update Plan' : 'Create Plan'}
        </Button>
      </div>
    </form>
  );
}