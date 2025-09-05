import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API response wrapper
const handleResponse = <T>(response: AxiosResponse<{ success: boolean; data: T }>): T => {
  return response.data.data;
};

// Auth API
export const authApi = {
  login: (data: { email: string; password: string; tenantSlug?: string }) =>
    api.post('/auth/login', data).then(handleResponse),
  
  register: (data: { name: string; email: string; password: string; tenantName: string; tenantSlug: string }) =>
    api.post('/auth/register', data).then(handleResponse),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then(handleResponse),
  
  logout: () =>
    api.post('/auth/logout'),
  
  getProfile: () =>
    api.get('/auth/me').then(handleResponse),
  
  forgotPassword: (data: { email: string; tenantSlug?: string }) =>
    api.post('/auth/forgot-password', data),
  
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
};

// Customers API
export const customersApi = {
  list: (params?: any) =>
    api.get('/customers', { params }).then(handleResponse),
  
  getById: (id: string) =>
    api.get(`/customers/${id}`).then(handleResponse),
  
  create: (data: any) =>
    api.post('/customers', data).then(handleResponse),
  
  update: (id: string, data: any) =>
    api.patch(`/customers/${id}`, data).then(handleResponse),
  
  delete: (id: string) =>
    api.delete(`/customers/${id}`),
  
  uploadDocuments: (id: string, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('documents', file));
    return api.post(`/customers/${id}/documents`, formData).then(handleResponse);
  },
  
  bulkImport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/customers/import', formData).then(handleResponse);
  },
  
  getSubscriptions: (id: string) =>
    api.get(`/customers/${id}/subscriptions`).then(handleResponse),
  
  getInvoices: (id: string) =>
    api.get(`/customers/${id}/invoices`).then(handleResponse),
  
  getPayments: (id: string) =>
    api.get(`/customers/${id}/payments`).then(handleResponse),
  
  getTickets: (id: string) =>
    api.get(`/customers/${id}/tickets`).then(handleResponse),
};

// Plans API
export const plansApi = {
  list: () =>
    api.get('/plans').then(handleResponse),
  
  getById: (id: string) =>
    api.get(`/plans/${id}`).then(handleResponse),
  
  create: (data: any) =>
    api.post('/plans', data).then(handleResponse),
  
  update: (id: string, data: any) =>
    api.patch(`/plans/${id}`, data).then(handleResponse),
  
  delete: (id: string) =>
    api.delete(`/plans/${id}`),
};

// Invoices API
export const invoicesApi = {
  list: (params?: any) =>
    api.get('/invoices', { params }).then(handleResponse),
  
  getById: (id: string) =>
    api.get(`/invoices/${id}`).then(handleResponse),
  
  downloadPDF: (id: string) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  
  send: (id: string, method: string, recipient?: string) =>
    api.post(`/invoices/${id}/send`, { method, recipient }),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/invoices/${id}/status`, { status }).then(handleResponse),
};

// Billing API
export const billingApi = {
  run: (data?: any) =>
    api.post('/billing/run', data).then(handleResponse),
  
  preview: () =>
    api.get('/billing/preview').then(handleResponse),
  
  getStatus: () =>
    api.get('/billing/status').then(handleResponse),
};

// Search API
export const searchApi = {
  global: (query: string) =>
    api.get('/search/global', { params: { q: query } }).then(handleResponse),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    api.get('/dashboard/stats').then(handleResponse),
  
  getChartData: (type: string, period: string) =>
    api.get('/dashboard/charts', { params: { type, period } }).then(handleResponse),
};

export const settingsApi = {
  getAll: () =>
    api.get('/settings').then(handleResponse),
  
  get: (key: string) =>
    api.get(`/settings/${key}`).then(handleResponse),
  
  update: (key: string, value: any) =>
    api.put(`/settings/${key}`, { value }).then(handleResponse),
};

// Subscriptions API
export const subscriptionsApi = {
  list: (params?: any) =>
    api.get('/subscriptions', { params }).then(handleResponse),
  
  getById: (id: string) =>
    api.get(`/subscriptions/${id}`).then(handleResponse),
  
  create: (data: any) =>
    api.post('/subscriptions', data).then(handleResponse),
  
  update: (id: string, data: any) =>
    api.patch(`/subscriptions/${id}`, data).then(handleResponse),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/subscriptions/${id}/status`, { status }).then(handleResponse),
  
  delete: (id: string) =>
    api.delete(`/subscriptions/${id}`),
};

// Payments API
export const paymentsApi = {
  list: (params?: any) =>
    api.get('/payments', { params }).then(handleResponse),
  
  getById: (id: string) =>
    api.get(`/payments/${id}`).then(handleResponse),
  
  record: (data: any) =>
    api.post('/payments', data).then(handleResponse),
  
  refund: (id: string, amount: number, reason: string) =>
    api.post(`/payments/${id}/refund`, { amount, reason }).then(handleResponse),
  
  generateReceipt: (id: string) =>
    api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
};

// Tickets API
export const ticketsApi = {
  list: (params?: any) =>
    api.get('/tickets', { params }).then(handleResponse),
  
  getById: (id: string) =>
    api.get(`/tickets/${id}`).then(handleResponse),
  
  create: (data: any) =>
    api.post('/tickets', data).then(handleResponse),
  
  update: (id: string, data: any) =>
    api.patch(`/tickets/${id}`, data).then(handleResponse),
  
  addReply: (id: string, data: { body: string; attachments?: string[] }) =>
    api.post(`/tickets/${id}/reply`, data).then(handleResponse),
  
  assign: (id: string, assignedUserId: string) =>
    api.patch(`/tickets/${id}/assign`, { assignedUserId }).then(handleResponse),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/tickets/${id}/status`, { status }).then(handleResponse),
};

// Reports API
export const reportsApi = {
  getDashboardStats: () =>
    api.get('/reports/dashboard').then(handleResponse),
  
  getRevenueReport: (params?: any) =>
    api.get('/reports/revenue', { params }).then(handleResponse),
  
  getCustomerReport: () =>
    api.get('/reports/customers').then(handleResponse),
  
  getAgingReport: () =>
    api.get('/reports/aging').then(handleResponse),
};

// Usage API
export const usageApi = {
  import: (data: any) =>
    api.post('/usage/import', data).then(handleResponse),
  
  getBySubscription: (subscriptionId: string, period?: string) =>
    api.get(`/usage/${subscriptionId}`, { params: { period } }).then(handleResponse),
};

// Users API
export const usersApi = {
  list: () =>
    api.get('/users').then(handleResponse),
  
  getById: (id: string) =>
    api.get(`/users/${id}`).then(handleResponse),
  
  create: (data: any) =>
    api.post('/users', data).then(handleResponse),
  
  update: (id: string, data: any) =>
    api.patch(`/users/${id}`, data).then(handleResponse),
  
  deactivate: (id: string) =>
    api.delete(`/users/${id}`),
};

// Customer Portal API (separate endpoint or public API)
export const customerPortalApi = {
  getDashboard: () =>
    api.get('/portal/dashboard').then(handleResponse),
  
  getUsage: (subscriptionId: string) =>
    api.get(`/portal/usage/${subscriptionId}`).then(handleResponse),
  
  getInvoices: () =>
    api.get('/portal/invoices').then(handleResponse),
  
  downloadInvoice: (invoiceId: string) =>
    api.get(`/portal/invoices/${invoiceId}/pdf`, { responseType: 'blob' }),
  
  getTickets: () =>
    api.get('/portal/tickets').then(handleResponse),
  
  createTicket: (data: any) =>
    api.post('/portal/tickets', data).then(handleResponse),
  
  updateProfile: (data: any) =>
    api.patch('/portal/profile', data).then(handleResponse),
};

export default api;