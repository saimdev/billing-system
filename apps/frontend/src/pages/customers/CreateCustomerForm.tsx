import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { FormField, Label, Input, Textarea } from '@/components/ui/Form';

const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  cnic: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Valid email is required').optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).optional()
});

type CreateCustomerForm = z.infer<typeof createCustomerSchema>;

interface CreateCustomerFormProps {
  onSubmit: (data: CreateCustomerForm) => void;
  onCancel: () => void;
}

export function CreateCustomerForm({ onSubmit, onCancel }: CreateCustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CreateCustomerForm>({
    resolver: zodResolver(createCustomerSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormField>
        <Label htmlFor="name" required>Full Name</Label>
        <Input
          {...register('name')}
          placeholder="Customer full name"
          error={errors.name?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField>
          <Label htmlFor="phone" required>Phone Number</Label>
          <Input
            {...register('phone')}
            placeholder="+1234567890"
            error={errors.phone?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="email">Email Address</Label>
          <Input
            {...register('email')}
            type="email"
            placeholder="customer@email.com"
            error={errors.email?.message}
          />
        </FormField>
      </div>

      <FormField>
        <Label htmlFor="cnic">CNIC/ID Number</Label>
        <Input
          {...register('cnic')}
          placeholder="National ID or identification number"
          error={errors.cnic?.message}
        />
      </FormField>

      <FormField>
        <Label htmlFor="address.street">Street Address</Label>
        <Input
          {...register('address.street')}
          placeholder="Street address"
          error={errors.address?.street?.message}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField>
          <Label htmlFor="address.city">City</Label>
          <Input
            {...register('address.city')}
            placeholder="City"
            error={errors.address?.city?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="address.state">State/Province</Label>
          <Input
            {...register('address.state')}
            placeholder="State"
            error={errors.address?.state?.message}
          />
        </FormField>

        <FormField>
          <Label htmlFor="address.zipCode">ZIP Code</Label>
          <Input
            {...register('address.zipCode')}
            placeholder="ZIP Code"
            error={errors.address?.zipCode?.message}
          />
        </FormField>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Create Customer
        </Button>
      </div>
    </form>
  );
}