// apps/frontend/src/pages/DashboardPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UsersIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Badge } from '../components/ui/Badge';
import { dashboardApi } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardStats {
  totalCustomers: number;
  activeSubscriptions: number;
  pendingInvoices: number;
  openTickets: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
}

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats
  });

  const { data: revenueChart } = useQuery({
    queryKey: ['dashboard-revenue-chart'],
    queryFn: () => dashboardApi.getChartData('revenue', '12months')
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const dashboardStats: DashboardStats = stats || {
    totalCustomers: 0,
    activeSubscriptions: 0,
    pendingInvoices: 0,
    openTickets: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    revenueGrowth: 0
  };

  const statCards = [
    {
      title: 'Total Customers',
      value: dashboardStats.totalCustomers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active Subscriptions',
      value: dashboardStats.activeSubscriptions,
      icon: CreditCardIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Pending Invoices',
      value: dashboardStats.pendingInvoices,
      icon: DocumentTextIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Open Tickets',
      value: dashboardStats.openTickets,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-500',
      textColor: 'text-red-600 dark:text-red-400'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your business.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">This Month Revenue</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(dashboardStats.thisMonthRevenue)}
              </p>
            </div>
            <div className={`flex-shrink-0 p-3 rounded-lg bg-green-100 dark:bg-green-900/30`}>
              <BanknotesIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <div className="flex items-center">
              {dashboardStats.revenueGrowth >= 0 ? (
                <BanknotesIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <BanknotesIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                dashboardStats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(dashboardStats.revenueGrowth)}
              </span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <a
              href="/customers"
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Add New Customer</span>
            </a>
            <a
              href="/billing"
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Run Billing</span>
            </a>
            <a
              href="/payments"
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <BanknotesIcon className="h-5 w-5 text-gray-400 mr-3" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Record Payment</span>
            </a>
          </div>
        </Card>
      </div>

      {/* Charts */}
      {revenueChart && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChart.revenueData}>
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
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChart.revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="customers" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Invoices</h3>
            <a href="/invoices" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              View all
            </a>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">INV-DEMO-2024{item.toString().padStart(2, '0')}-0001</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">John Smith</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">$49.99</p>
                  <Badge variant={item === 1 ? 'success' : item === 2 ? 'warning' : 'danger'} size="sm">
                    {item === 1 ? 'Paid' : item === 2 ? 'Pending' : 'Overdue'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Tickets</h3>
            <a href="/tickets" className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              View all
            </a>
          </div>
          <div className="space-y-3">
            {[
              { id: 1, subject: 'Slow internet speed', customer: 'Sarah Johnson', priority: 'HIGH' },
              { id: 2, subject: 'Billing inquiry', customer: 'Mike Davis', priority: 'MEDIUM' },
              { id: 3, subject: 'Connection issues', customer: 'Emily Brown', priority: 'URGENT' }
            ].map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.subject}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.customer}</p>
                </div>
                <Badge 
                  variant={
                    ticket.priority === 'URGENT' ? 'danger' : 
                    ticket.priority === 'HIGH' ? 'warning' : 'info'
                  } 
                  size="sm"
                >
                  {ticket.priority}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Status</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Billing System</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Operational</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Payment Gateway</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Operational</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-yellow-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Email Service</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Demo Mode</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}