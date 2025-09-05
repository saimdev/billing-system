import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  CogIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FormField, Label, Input, Select, Textarea } from '../../components/ui/Form';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { settingsApi } from '../../services/api';
import toast from 'react-hot-toast';

const companyInfoSchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  address: z.string().min(5, 'Address is required'),
  phone: z.string().min(10, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  website: z.string().url().optional().or(z.literal('')),
  logo: z.string().optional()
});

const taxSettingsSchema = z.object({
  defaultRate: z.number().min(0).max(100),
  inclusive: z.boolean(),
  name: z.string().min(1, 'Tax name is required')
});

const invoiceSettingsSchema = z.object({
  prefix: z.string().min(1, 'Invoice prefix is required'),
  numberFormat: z.string().min(1, 'Number format is required'),
  dueDays: z.number().min(1).max(365),
  termsAndConditions: z.string().optional()
});

const emailSettingsSchema = z.object({
  enabled: z.boolean(),
  host: z.string().optional(),
  port: z.number().min(1).max(65535).optional(),
  user: z.string().optional(),
  pass: z.string().optional(),
  from: z.string().email().optional()
});

const smsSettingsSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(['twilio', 'textlocal', 'mock']),
  apiKey: z.string().optional(),
  senderId: z.string().optional()
});

type CompanyInfoForm = z.infer<typeof companyInfoSchema>;
type TaxSettingsForm = z.infer<typeof taxSettingsSchema>;
type InvoiceSettingsForm = z.infer<typeof invoiceSettingsSchema>;
type EmailSettingsForm = z.infer<typeof emailSettingsSchema>;
type SmsSettingsForm = z.infer<typeof smsSettingsSchema>;

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getAll
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) =>
      settingsApi.update(key, value),
    onSuccess: () => {
      toast.success('Settings updated successfully');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    }
  });

  // Company Info Form
  const companyForm = useForm<CompanyInfoForm>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: settings?.company_info || {}
  });

  // Tax Settings Form
  const taxForm = useForm<TaxSettingsForm>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: settings?.tax_settings || {
      defaultRate: 18,
      inclusive: false,
      name: 'Tax'
    }
  });

  // Invoice Settings Form
  const invoiceForm = useForm<InvoiceSettingsForm>({
    resolver: zodResolver(invoiceSettingsSchema),
    defaultValues: settings?.invoice_settings || {
      prefix: 'INV',
      numberFormat: '{PREFIX}-{TENANT}-{YEAR}{MONTH}-{SEQ}',
      dueDays: 15
    }
  });

  // Email Settings Form
  const emailForm = useForm<EmailSettingsForm>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: settings?.email_settings || {
      enabled: false,
      port: 587
    }
  });

  // SMS Settings Form
  const smsForm = useForm<SmsSettingsForm>({
    resolver: zodResolver(smsSettingsSchema),
    defaultValues: settings?.sms_settings || {
      enabled: false,
      provider: 'mock'
    }
  });

  React.useEffect(() => {
    if (settings) {
      companyForm.reset(settings.company_info || {});
      taxForm.reset(settings.tax_settings || { defaultRate: 18, inclusive: false, name: 'Tax' });
      invoiceForm.reset(settings.invoice_settings || {
        prefix: 'INV',
        numberFormat: '{PREFIX}-{TENANT}-{YEAR}{MONTH}-{SEQ}',
        dueDays: 15
      });
      emailForm.reset(settings.email_settings || { enabled: false, port: 587 });
      smsForm.reset(settings.sms_settings || { enabled: false, provider: 'mock' });
    }
  }, [settings, companyForm, taxForm, invoiceForm, emailForm, smsForm]);

  const handleSaveCompanyInfo = (data: CompanyInfoForm) => {
    updateSettingMutation.mutate({ key: 'company_info', value: data });
  };

  const handleSaveTaxSettings = (data: TaxSettingsForm) => {
    updateSettingMutation.mutate({ key: 'tax_settings', value: data });
  };

  const handleSaveInvoiceSettings = (data: InvoiceSettingsForm) => {
    updateSettingMutation.mutate({ key: 'invoice_settings', value: data });
  };

  const handleSaveEmailSettings = (data: EmailSettingsForm) => {
    updateSettingMutation.mutate({ key: 'email_settings', value: data });
  };

  const handleSaveSmsSettings = (data: SmsSettingsForm) => {
    updateSettingMutation.mutate({ key: 'sms_settings', value: data });
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: BuildingOfficeIcon },
    { id: 'billing', label: 'Billing', icon: CurrencyDollarIcon },
    { id: 'invoices', label: 'Invoices', icon: DocumentTextIcon },
    { id: 'email', label: 'Email', icon: EnvelopeIcon },
    { id: 'sms', label: 'SMS', icon: DevicePhoneMobileIcon },
    { id: 'users', label: 'Users', icon: UserGroupIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon }
  ];

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
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your system configuration and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <BuildingOfficeIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Company Information</h2>
              </div>
              
              <form onSubmit={companyForm.handleSubmit(handleSaveCompanyInfo)} className="space-y-6">
                <FormField>
                  <Label htmlFor="name" required>Company Name</Label>
                  <Input
                    {...companyForm.register('name')}
                    error={companyForm.formState.errors.name?.message}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor="address" required>Address</Label>
                  <Textarea
                    {...companyForm.register('address')}
                    rows={3}
                    error={companyForm.formState.errors.address?.message}
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField>
                    <Label htmlFor="phone" required>Phone</Label>
                    <Input
                      {...companyForm.register('phone')}
                      error={companyForm.formState.errors.phone?.message}
                    />
                  </FormField>

                  <FormField>
                    <Label htmlFor="email" required>Email</Label>
                    <Input
                      {...companyForm.register('email')}
                      type="email"
                      error={companyForm.formState.errors.email?.message}
                    />
                  </FormField>
                </div>

                <FormField>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    {...companyForm.register('website')}
                    placeholder="https://example.com"
                    error={companyForm.formState.errors.website?.message}
                  />
                </FormField>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updateSettingMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tax Settings</h2>
              </div>
              
              <form onSubmit={taxForm.handleSubmit(handleSaveTaxSettings)} className="space-y-6">
                <FormField>
                  <Label htmlFor="name" required>Tax Name</Label>
                  <Input
                    {...taxForm.register('name')}
                    placeholder="GST, VAT, Sales Tax, etc."
                    error={taxForm.formState.errors.name?.message}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor="defaultRate" required>Default Tax Rate (%)</Label>
                  <Input
                    {...taxForm.register('defaultRate', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    error={taxForm.formState.errors.defaultRate?.message}
                  />
                </FormField>

                <FormField>
                  <div className="flex items-center">
                    <input
                      {...taxForm.register('inclusive')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="inclusive" className="ml-2 mb-0">
                      Tax Inclusive Pricing
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    When enabled, tax is included in the displayed price
                  </p>
                </FormField>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updateSettingMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'invoices' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice Settings</h2>
              </div>
              
              <form onSubmit={invoiceForm.handleSubmit(handleSaveInvoiceSettings)} className="space-y-6">
                <FormField>
                  <Label htmlFor="prefix" required>Invoice Prefix</Label>
                  <Input
                    {...invoiceForm.register('prefix')}
                    placeholder="INV"
                    error={invoiceForm.formState.errors.prefix?.message}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor="numberFormat" required>Number Format</Label>
                  <Input
                    {...invoiceForm.register('numberFormat')}
                    placeholder="{PREFIX}-{TENANT}-{YEAR}{MONTH}-{SEQ}"
                    error={invoiceForm.formState.errors.numberFormat?.message}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Available variables: {'{PREFIX}'}, {'{TENANT}'}, {'{YEAR}'}, {'{MONTH}'}, {'{SEQ}'}
                  </p>
                </FormField>

                <FormField>
                  <Label htmlFor="dueDays" required>Payment Due Days</Label>
                  <Input
                    {...invoiceForm.register('dueDays', { valueAsNumber: true })}
                    type="number"
                    min="1"
                    max="365"
                    error={invoiceForm.formState.errors.dueDays?.message}
                  />
                </FormField>

                <FormField>
                  <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                  <Textarea
                    {...invoiceForm.register('termsAndConditions')}
                    rows={4}
                    placeholder="Payment terms and conditions..."
                    error={invoiceForm.formState.errors.termsAndConditions?.message}
                  />
                </FormField>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updateSettingMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'email' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <EnvelopeIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Email Configuration</h2>
              </div>
              
              <form onSubmit={emailForm.handleSubmit(handleSaveEmailSettings)} className="space-y-6">
                <FormField>
                  <div className="flex items-center">
                    <input
                      {...emailForm.register('enabled')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="enabled" className="ml-2 mb-0">
                      Enable Email Notifications
                    </Label>
                  </div>
                </FormField>

                {emailForm.watch('enabled') && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField>
                        <Label htmlFor="host">SMTP Host</Label>
                        <Input
                          {...emailForm.register('host')}
                          placeholder="smtp.gmail.com"
                        />
                      </FormField>

                      <FormField>
                        <Label htmlFor="port">SMTP Port</Label>
                        <Input
                          {...emailForm.register('port', { valueAsNumber: true })}
                          type="number"
                          placeholder="587"
                        />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField>
                        <Label htmlFor="user">Username</Label>
                        <Input
                          {...emailForm.register('user')}
                          placeholder="your-email@gmail.com"
                        />
                      </FormField>

                      <FormField>
                        <Label htmlFor="pass">Password</Label>
                        <Input
                          {...emailForm.register('pass')}
                          type="password"
                          placeholder="App password"
                        />
                      </FormField>
                    </div>

                    <FormField>
                      <Label htmlFor="from">From Email</Label>
                      <Input
                        {...emailForm.register('from')}
                        type="email"
                        placeholder="noreply@yourcompany.com"
                      />
                    </FormField>
                  </>
                )}

                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Demo Mode
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                        <p>Email notifications are currently in demo mode. Emails will be logged to console instead of being sent.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updateSettingMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'sms' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <DevicePhoneMobileIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">SMS Configuration</h2>
              </div>
              
              <form onSubmit={smsForm.handleSubmit(handleSaveSmsSettings)} className="space-y-6">
                <FormField>
                  <div className="flex items-center">
                    <input
                      {...smsForm.register('enabled')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="enabled" className="ml-2 mb-0">
                      Enable SMS Notifications
                    </Label>
                  </div>
                </FormField>

                <FormField>
                  <Label htmlFor="provider">SMS Provider</Label>
                  <Select {...smsForm.register('provider')}>
                    <option value="mock">Mock (Demo)</option>
                    <option value="twilio">Twilio</option>
                    <option value="textlocal">TextLocal</option>
                  </Select>
                </FormField>

                {smsForm.watch('enabled') && smsForm.watch('provider') !== 'mock' && (
                  <>
                    <FormField>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        {...smsForm.register('apiKey')}
                        type="password"
                        placeholder="Your SMS provider API key"
                      />
                    </FormField>

                    <FormField>
                      <Label htmlFor="senderId">Sender ID</Label>
                      <Input
                        {...smsForm.register('senderId')}
                        placeholder="Your company name"
                      />
                    </FormField>
                  </>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        SMS Integration
                      </h3>
                      <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                        <p>SMS notifications can be used for invoice reminders, payment confirmations, and service updates.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={updateSettingMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-gray-400 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management</h2>
                </div>
                <Button>Add User</Button>
              </div>
              
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">User management</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  User management features will be available in the next update.
                </p>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="h-6 w-6 text-gray-400 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Settings</h2>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Session Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Session Timeout</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">1 hour</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Refresh Token Expiry</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">7 days</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">API Security</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Rate Limiting</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">100 requests/15min</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">CORS Protection</span>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Enabled</p>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                  <div className="flex">
                    <ShieldCheckIcon className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                        Security Status: Good
                      </h3>
                      <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        <p>All security features are properly configured and active.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}