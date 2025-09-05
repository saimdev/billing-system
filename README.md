# ISP Billing & Customer Management System

A comprehensive white-label ISP billing and customer management system built with modern web technologies.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture** - Support multiple ISP clients with isolated data
- **Customer Management** - Complete CRM with document storage and bulk import
- **Subscription Management** - Flexible plans with various access types (PPPoE, GPON, Hotspot)
- **Automated Billing** - Recurring billing engine with invoice generation
- **Payment Processing** - Multiple payment methods with receipt generation
- **Support Ticketing** - Built-in helpdesk with SLA tracking
- **Role-based Access Control** - Fine-grained permissions for different staff roles

### Technical Highlights
- **Modern Stack** - React 18, Node.js 20+, TypeScript, SQLite
- **Mobile-first Design** - Responsive UI with dark mode support
- **Real-time Updates** - Live notifications and status updates
- **PDF Generation** - Branded invoices and receipts
- **Bulk Operations** - CSV/Excel import and export
- **API Documentation** - OpenAPI/Swagger specification

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- React Query for data fetching
- React Router for navigation
- Headless UI for components

### Backend
- Node.js 20+ with Express
- TypeScript for type safety
- SQLite with Prisma ORM
- JWT authentication
- Zod for validation
- Argon2 for password hashing

### Development Tools
- ESLint + Prettier for code quality
- Vitest for testing
- Playwright for E2E testing
- Husky for git hooks

## 📦 Installation

### Prerequisites
- Node.js 20 or higher
- npm or yarn package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd isp-billing-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cp apps/backend/.env.example apps/backend/.env
   
   # Frontend
   cp apps/frontend/.env.example apps/frontend/.env
   ```

4. **Setup database**
   ```bash
   npm run migrate
   npm run seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:3000)

### Demo Credentials
- **Email:** admin@demo-isp.com
- **Password:** admin123
- **Tenant:** demo-isp

## 🏗️ Project Structure

```
├── apps/
│   ├── backend/           # Node.js API server
│   │   ├── src/
│   │   │   ├── routes/    # API routes
│   │   │   ├── services/  # Business logic
│   │   │   ├── middleware/# Express middleware
│   │   │   ├── lib/       # Utilities
│   │   │   └── scripts/   # Database scripts
│   │   └── prisma/        # Database schema
│   └── frontend/          # React application
│       ├── src/
│       │   ├── components/# Reusable components
│       │   ├── pages/     # Page components
│       │   ├── contexts/  # React contexts
│       │   ├── hooks/     # Custom hooks
│       │   └── services/  # API clients
│       └── public/        # Static assets
├── packages/
│   └── shared/            # Shared types and utilities
└── data/                  # SQLite database files
```

## 📊 Database Schema

The system uses a multi-tenant SQLite database with the following main entities:

- **Tenants** - ISP companies
- **Users** - Staff members with role-based access
- **Customers** - End users of internet services
- **Plans** - Service packages (speed, pricing, quotas)
- **Subscriptions** - Customer plan assignments
- **Invoices** - Billing documents with line items
- **Payments** - Payment records and receipts
- **Tickets** - Support requests and communications

## 🔐 Authentication & Authorization

### Roles & Permissions

- **Owner** - Full access to tenant settings and all modules
- **Admin/Manager** - Customer and subscription management, reporting
- **Support/Engineer** - Ticket management, customer support
- **Cashier** - Payment processing and receipts

### Security Features

- JWT-based authentication with refresh tokens
- Argon2 password hashing
- Rate limiting on authentication endpoints
- Multi-tenant data isolation
- Audit logging for critical actions

## 📋 API Documentation

API documentation is available at `/api/docs` when running in development mode.

### Key Endpoints

```
Authentication:
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh

Customers:
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PATCH  /api/customers/:id

Billing:
POST   /api/billing/run
GET    /api/billing/preview
GET    /api/invoices
GET    /api/invoices/:id/pdf

Payments:
POST   /api/payments
GET    /api/payments/:id/receipt
```

## 🚀 Deployment

### Production Build

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

### Environment Configuration

Key environment variables for production:

```env
NODE_ENV=production
JWT_SECRET=your-secure-secret-key
DATABASE_URL=file:./data/production.sqlite
EMAIL_HOST=your-smtp-host
SMS_API_KEY=your-sms-provider-key
```

### Docker Deployment (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### Tenant Branding

Each tenant can customize:
- Logo and primary colors
- Invoice templates and numbering
- Email/SMS sender configurations
- Tax settings and rates

### Payment Gateways

The system supports pluggable payment gateway integrations:
- Built-in support for manual payments (cash, bank transfer)
- Webhook-ready architecture for gateway integration
- Refund and partial payment handling

### Network Device Integration

Future-ready architecture for network device management:
- RADIUS/AAA integration placeholders
- MikroTik RouterOS API support
- OLT/ONU management interfaces

## 📈 Reporting & Analytics

Built-in reports include:
- Monthly Recurring Revenue (MRR)
- Customer acquisition and churn
- Payment collection rates
- Support ticket metrics
- Revenue by plan/service

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For technical support or feature requests:
- Create an issue on GitHub
- Email: support@yourcompany.com

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Roadmap

### Version 1.1
- [ ] Advanced reporting dashboard
- [ ] WhatsApp notification integration
- [ ] Mobile app for customer portal

### Version 1.2
- [ ] Multi-currency support
- [ ] Advanced billing rules engine
- [ ] Integration marketplace

### Version 2.0
- [ ] Network device auto-discovery
- [ ] AI-powered support chatbot
- [ ] Advanced analytics and forecasting