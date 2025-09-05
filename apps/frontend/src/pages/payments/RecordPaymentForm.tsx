import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { FormField, Label, Input, Select, Textarea } from '../ui/Form';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { invoicesApi, paymentsApi } from '../../services/api';
import toast from 'react-hot-toast';

const recordPaymentSchema = z.object({
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'GATEWAY', 'CHEQUE', 'CREDIT']),
  reference: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().optional(),
  receivedAt: z.string().optional()
});

type RecordPaymentForm = z.infer<typeof recordPaymentSchema>;

interface RecordPaymentFormProps {
  preSelectedInvoiceId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecordPaymentForm({ preSelectedInvoiceId, onSuccess, onCancel }: RecordPaymentFormProps) {
  const { data: pendingInvoices, isLoading } = useQuery({
    queryKey: ['pending-invoices'],
    queryFn: () => invoicesApi.list({ status: 'PENDING,OVERDUE', limit: 100 })
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RecordPaymentForm>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      method: 'CASH',
      invoiceId: preSelectedInvoiceId || undefined,
      receivedAt: new Date().toISOString().split('T')[0]
    }
  });

  const selectedInvoiceId = watch('invoiceId');
  const selectedInvoice = pendingInvoices?.data?.find((inv: any) => inv.id === selectedInvoiceId);

  React.useEffect(() => {
    if (selectedInvoice) {
      setValue('amount', selectedInvoice.total);
    }
  }, [selectedInvoice, setValue]);

  const onSubmit = async (data: RecordPaymentForm) => {
    try {
      await paymentsApi.record({
        ...data,
        receivedAt: data.receivedAt ? new Date(data.receivedAt).toISOString() : undefined
      });
      toast.success('Payment recorded successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
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
        <Label htmlFor="invoiceId">
          Invoice (optional)
        </Label>
        <Select {...register('invoiceId')} error={errors.invoiceId?.message}>
          <option value="">Select an invoice</option>
          {pendingInvoices?.data?.map((invoice: any) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.number} - {invoice.subscription?.customer?.name} - ${invoice.total.toFixed(2)}
            </option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Leave empty for advance payments or manual entries
        </p>
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="amount" required>
            Amount
          </Label>
          <Input
            {...register('amount', { valueAsNumber: true })}
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="method" required>
            Payment Method
          </Label>
          <Select {...register('method')} error={errors.method?.message}>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="GATEWAY">Payment Gateway</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CREDIT">Credit</option>
          </Select>
        </FormField>

        <FormField>
          <Label htmlFor="reference">
            Reference Number
          </Label>
          <Input
            {...register('reference')}
            placeholder="Transaction reference"
            error={errors.reference?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="receivedAt">
            Received Date
          </Label>
          <Input
            {...register('receivedAt')}
            type="date"
            error={errors.receivedAt?.message}
          />
        </FormField>
      </div>

      <FormField>
        <Label htmlFor="notes">
          Notes (optional)
        </Label>
        <Textarea
          {...register('notes')}
          placeholder="Add any additional notes about this payment"
          rows={3}
          error={errors.notes?.message}
        />
      </FormField>

      {selectedInvoice && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Invoice Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-600 dark:text-blue-300">Customer:</span>
              <span className="ml-2">{selectedInvoice.subscription?.customer?.name}</span>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-300">Total:</span>
              <span className="ml-2 font-medium">${selectedInvoice.total.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-300">Due Date:</span>
              <span className="ml-2">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-blue-600 dark:text-blue-300">Status:</span>
              <span className="ml-2">{selectedInvoice.status}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Record Payment
        </Button>
      </div>
    </form>
  );
}