// apps/backend/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';

// Import all routes
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { customerRoutes } from './routes/customers.js';
import { planRoutes } from './routes/plans.js';
import { subscriptionRoutes } from './routes/subscriptions.js';
import { invoiceRoutes } from './routes/invoices.js';
import { paymentRoutes } from './routes/payments.js';
import { ticketRoutes } from './routes/tickets.js';
import { reportRoutes } from './routes/reports.js';
import { settingRoutes } from './routes/settings.js';
import { usageRoutes } from './routes/usage.js';
import { billingRoutes } from './routes/billing.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { searchRoutes } from './routes/search.js';
import { portalRoutes } from './routes/portal.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 100 se increase kar do
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Auth rate limiting (more strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 5 se 20 kar do
  message: 'Too many authentication attempts'
});
app.use('/api/auth', authLimiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/portal', portalRoutes);

// Swagger/OpenAPI docs
if (config.NODE_ENV === 'development') {
  app.get('/api/docs', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>ISP Billing API Docs</title></head>
        <body>
          <h1>API Documentation</h1>
          <p>OpenAPI documentation will be available here</p>
          <h2>Available Endpoints:</h2>
          <ul>
            <li><strong>Auth:</strong> /api/auth/*</li>
            <li><strong>Users:</strong> /api/users/*</li>
            <li><strong>Customers:</strong> /api/customers/*</li>
            <li><strong>Plans:</strong> /api/plans/*</li>
            <li><strong>Subscriptions:</strong> /api/subscriptions/*</li>
            <li><strong>Invoices:</strong> /api/invoices/*</li>
            <li><strong>Payments:</strong> /api/payments/*</li>
            <li><strong>Tickets:</strong> /api/tickets/*</li>
            <li><strong>Reports:</strong> /api/reports/*</li>
            <li><strong>Settings:</strong> /api/settings/*</li>
            <li><strong>Usage:</strong> /api/usage/*</li>
            <li><strong>Billing:</strong> /api/billing/*</li>
            <li><strong>Dashboard:</strong> /api/dashboard/*</li>
            <li><strong>Search:</strong> /api/search/*</li>
            <li><strong>Portal:</strong> /api/portal/*</li>
          </ul>
        </body>
      </html>
    `);
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 API docs: http://localhost:${PORT}/api/docs`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export { app };