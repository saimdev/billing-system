import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { customerRoutes } from './routes/customers.js';
import { planRoutes } from './routes/plans.js';
// import { subscriptionRoutes } from './routes/subscriptions.js';
import { invoiceRoutes } from './routes/invoices.js';
import { paymentRoutes } from './routes/payments.js';
import { ticketRoutes } from './routes/tickets.js';
import { reportRoutes } from './routes/reports.js';
import { settingRoutes } from './routes/settings.js';
import { usageRoutes } from './routes/usage.js';
import { billingRoutes } from './routes/billing.js';

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
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Auth rate limiting (more strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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
// app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/billing', billingRoutes);

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