import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Form';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { reportsApi } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days');
  const [selectedReport, setSelectedReport] = useState('revenue');

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportsApi.getDashboardStats
  });

  const { data: revenueReport, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-report', selectedPeriod],
    queryFn: () => reportsApi.getRevenueReport({ period: selectedPeriod })
  });

  const { data: customerReport } = useQuery({
    queryKey: ['customer-report'],
    queryFn: reportsApi.getCustomerReport
  });

  const { data: agingReport } = useQuery({
    queryKey: ['aging-report'],
    queryFn: reportsApi.getAgingReport
  });

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = dashboardStats || {
    totalCustomers: 0,
    activeSubscriptions: 0,
    thisMonthRevenue: 0,
    revenueGrowth: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Business insights and performance metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <Select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_12_months">Last 12 Months</option>
            <option value="this_year">This Year</option>
          </Select>
          <Button
            variant="outline"
            icon={<ArrowDownTrayIcon className="h-4 w-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalCustomers.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeSubscriptions.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.thisMonthRevenue)}
              </p>
              <p className={`text-sm ${
                stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% from last month
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ARPU</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.activeSubscriptions > 0 ? stats.thisMonthRevenue / stats.activeSubscriptions : 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Revenue Per User</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Revenue Trend</h3>
            <Select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <option value="revenue">Revenue</option>
              <option value="customers">Customers</option>
              <option value="subscriptions">Subscriptions</option>
            </Select>
          </div>
          {revenueLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="md" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueReport?.revenueData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Customer Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Active', value: customerReport?.activeCustomers || 0 },
                  { name: 'Suspended', value: customerReport?.suspendedCustomers || 0 },
                  { name: 'Terminated', value: (customerReport?.totalCustomers || 0) - (customerReport?.activeCustomers || 0) - (customerReport?.suspendedCustomers || 0) }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: 'Active', value: customerReport?.activeCustomers || 0 },
                  { name: 'Suspended', value: customerReport?.suspendedCustomers || 0 },
                  { name: 'Terminated', value: (customerReport?.totalCustomers || 0) - (customerReport?.activeCustomers || 0) - (customerReport?.suspendedCustomers || 0) }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Aging Report */}
      {agingReport && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Accounts Receivable Aging</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Current</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {formatCurrency(agingReport.current.amount)}
              </p>
              <p className="text-sm text-green-600 dark:text-green-300">
                {agingReport.current.count} invoices
              </p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">1-30 Days</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {formatCurrency(agingReport.days30.amount)}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-300">
                {agingReport.days30.count} invoices
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">31-60 Days</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatCurrency(agingReport.days60.amount)}
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                {agingReport.days60.count} invoices
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">60+ Days</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {formatCurrency(agingReport.days90.amount)}
              </p>
              <p className="text-sm text-red-600 dark:text-red-300">
                {agingReport.days90.count} invoices
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}