import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField, Label, Input, Select } from '@/components/ui/Form';
import { invoicesApi } from '../../services/api';
import toast from 'react-hot-toast';

const sendInvoiceSchema = z.object({
  method: z.enum(['email', 'sms']),
  recipient: z.string().optional()
});

type SendInvoiceForm = z.infer<typeof sendInvoiceSchema>;

interface SendInvoiceModalProps {
  invoice: any;
  onClose: () => void;
}

export function SendInvoiceModal({ invoice, onClose }: SendInvoiceModalProps) {
  const [sending, setSending] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<SendInvoiceForm>({
    resolver: zodResolver(sendInvoiceSchema),
    defaultValues: {
      method: 'email'
    }
  });

  const method = watch('method');

  const onSubmit = async (data: SendInvoiceForm) => {
    setSending(true);
    try {
      await invoicesApi.send(invoice.id, data.method, data.recipient);
      toast.success(`Invoice sent via ${data.method}`);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send invoice');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField>
        <Label htmlFor="method" required>Send Method</Label>
        <Select {...register('method')} error={errors.method?.message}>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </Select>
      </FormField>

      <FormField>
        <Label htmlFor="recipient">
          {method === 'email' ? 'Email Address' : 'Phone Number'} (optional)
        </Label>
        <Input
          {...register('recipient')}
          type={method === 'email' ? 'email' : 'tel'}
          placeholder={
            method === 'email' 
              ? invoice.subscription?.customer?.email || 'Enter email address'
              : invoice.subscription?.customer?.phone || 'Enter phone number'
          }
          error={errors.recipient?.message}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Leave empty to use customer's default {method === 'email' ? 'email' : 'phone number'}
        </p>
      </FormField>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Preview</h4>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p><strong>To:</strong> {invoice.subscription?.customer?.name}</p>
          <p><strong>Invoice:</strong> {invoice.number}</p>
          <p><strong>Amount:</strong> ${invoice.total.toFixed(2)}</p>
          <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={sending}>
          Send Invoice
        </Button>
      </div>
    </form>
  );
}