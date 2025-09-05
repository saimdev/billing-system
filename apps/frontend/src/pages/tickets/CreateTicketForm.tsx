import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField, Label, Input, Select, Textarea } from '@/components/ui/Form';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { customersApi, ticketsApi } from '../../services/api';
import toast from 'react-hot-toast';

const createTicketSchema = z.object({
  customerId: z.string().optional(),
  subscriptionId: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['TECHNICAL', 'BILLING', 'COMPLAINT', 'REQUEST', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  description: z.string().min(10, 'Description must be at least 10 characters')
});

type CreateTicketForm = z.infer<typeof createTicketSchema>;

interface CreateTicketFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateTicketForm({ onSuccess, onCancel }: CreateTicketFormProps) {
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ limit: 100 })
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      category: 'TECHNICAL',
      priority: 'MEDIUM'
    }
  });

  const selectedCustomerId = watch('customerId');
  const selectedCustomer = customers?.data?.find((c: any) => c.id === selectedCustomerId);

  const onSubmit = async (data: CreateTicketForm) => {
    try {
      await ticketsApi.create(data);
      toast.success('Ticket created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField>
        <Label htmlFor="subject" required>Subject</Label>
        <Input
          {...register('subject')}
          placeholder="Brief description of the issue"
          error={errors.subject?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="category" required>Category</Label>
          <Select {...register('category')} error={errors.category?.message}>
            <option value="TECHNICAL">Technical</option>
            <option value="BILLING">Billing</option>
            <option value="COMPLAINT">Complaint</option>
            <option value="REQUEST">Request</option>
            <option value="OTHER">Other</option>
          </Select>
        </FormField>

        <FormField>
          <Label htmlFor="priority" required>Priority</Label>
          <Select {...register('priority')} error={errors.priority?.message}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </Select>
        </FormField>
      </div>

      <FormField>
        <Label htmlFor="customerId">Customer (optional)</Label>
        <Select {...register('customerId')} error={errors.customerId?.message}>
          <option value="">Select a customer</option>
          {customers?.data?.map((customer: any) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} - {customer.phone}
            </option>
          ))}
        </Select>
      </FormField>

      {selectedCustomer?.subscriptions && selectedCustomer.subscriptions.length > 0 && (
        <FormField>
          <Label htmlFor="subscriptionId">Related Subscription (optional)</Label>
          <Select {...register('subscriptionId')} error={errors.subscriptionId?.message}>
            <option value="">Select a subscription</option>
            {selectedCustomer.subscriptions.map((subscription: any) => (
              <option key={subscription.id} value={subscription.id}>
                {subscription.plan?.name} - {subscription.username || 'No username'}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <FormField>
        <Label htmlFor="description" required>Description</Label>
        <Textarea
          {...register('description')}
          placeholder="Detailed description of the issue or request"
          rows={5}
          error={errors.description?.message}
        />
      </FormField>

      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">SLA Information</h4>
        <div className="text-sm text-yellow-600 dark:text-yellow-300">
          <div className="grid grid-cols-2 gap-4">
            <div>• Low Priority: 72 hours</div>
            <div>• Medium Priority: 24 hours</div>
            <div>• High Priority: 8 hours</div>
            <div>• Urgent Priority: 4 hours</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create Ticket
        </Button>
      </div>
    </form>
  );
}