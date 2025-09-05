import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { FormField, Label, Input } from '../../components/ui/Form';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  tenantName: z.string().min(2, 'Company name must be at least 2 characters'),
  tenantSlug: z.string()
    .min(2, 'Company code must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Company code can only contain lowercase letters, numbers, and hyphens')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const tenantName = watch('tenantName');

  // Auto-generate slug from tenant name
  React.useEffect(() => {
    if (tenantName) {
      const slug = tenantName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      register('tenantSlug').onChange({ target: { value: slug } });
    }
  }, [tenantName, register]);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        tenantName: data.tenantName,
        tenantSlug: data.tenantSlug
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">ISP</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              sign in to existing account
            </Link>
          </p>
        </div>

        <Card className="p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <FormField>
              <Label htmlFor="name" required>
                Full Name
              </Label>
              <Input
                {...register('name')}
                placeholder="Enter your full name"
                error={errors.name?.message}
              />
            </FormField>

            <FormField>
              <Label htmlFor="email" required>
                Email Address
              </Label>
              <Input
                {...register('email')}
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
              />
            </FormField>

            <FormField>
              <Label htmlFor="tenantName" required>
                Company Name
              </Label>
              <Input
                {...register('tenantName')}
                placeholder="Enter your company name"
                error={errors.tenantName?.message}
              />
            </FormField>

            <FormField>
              <Label htmlFor="tenantSlug" required>
                Company Code
              </Label>
              <Input
                {...register('tenantSlug')}
                placeholder="company-code"
                error={errors.tenantSlug?.message}
              />
              <p className="mt-1 text-xs text-gray-500">
                This will be your unique company identifier. Only lowercase letters, numbers, and hyphens allowed.
              </p>
            </FormField>

            <FormField>
              <Label htmlFor="password" required>
                Password
              </Label>
              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </FormField>

            <FormField>
              <Label htmlFor="confirmPassword" required>
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  error={errors.confirmPassword?.message}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </FormField>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}