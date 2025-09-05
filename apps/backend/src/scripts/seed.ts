import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create demo tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'demo-isp' },
      update: {},
      create: {
        name: 'Demo ISP Company',
        slug: 'demo-isp',
        brandingJson: JSON.stringify({
          primaryColor: '#3B82F6',
          logo: null,
          companyInfo: {
            address: '123 Main Street, Tech City, TC 12345',
            phone: '+1 (555) 123-4567',
            email: 'billing@demo-isp.com',
            website: 'https://demo-isp.com'
          }
        })
      }
    });

    console.log('✅ Created demo tenant');

    // Create owner user
    const hashedPassword = await argon2.hash('admin123');
    const owner = await prisma.user.upsert({
      where: {
        tenantId_email: { tenantId: tenant.id, email: 'admin@demo-isp.com' },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Admin User',
        email: 'admin@demo-isp.com',
        hash: hashedPassword,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    console.log('✅ Created owner user (admin@demo-isp.com / admin123)');

    // Create additional staff users
    const staffUsers = [
      { name: 'Manager User', email: 'manager@demo-isp.com', role: 'MANAGER' },
      { name: 'Support Agent', email: 'support@demo-isp.com', role: 'SUPPORT' },
      { name: 'Cashier User', email: 'cashier@demo-isp.com', role: 'CASHIER' }
    ];

    for (const user of staffUsers) {
      await prisma.user.upsert({
        where: {
          tenantId_email: { tenantId: tenant.id, email: user.email },
        },
        update: {
          // optional: keep name/role in sync if re-running the seed
          name: user.name,
          role: user.role as any,
          status: 'ACTIVE',
        },
        create: {
          tenantId: tenant.id,
          name: user.name,
          email: user.email,
          hash: hashedPassword,
          role: user.role as any,
          status: 'ACTIVE',
        },
      });
    }

    console.log('✅ Created staff users');

    // Create default settings
    const settings = [
      {
        key: 'tax_settings',
        value: { defaultRate: 18, inclusive: false, name: 'GST' }
      },
      {
        key: 'invoice_settings',
        value: {
          prefix: 'INV',
          numberFormat: '{PREFIX}-{TENANT}-{YEAR}{MONTH}-{SEQ}',
          dueDays: 15,
          termsAndConditions: 'Payment is due within 15 days of invoice date. Late payments may incur additional charges.'
        }
      },
      {
        key: 'email_settings',
        value: {
          enabled: false,
          host: '',
          port: 587,
          user: '',
          pass: '',
          from: 'billing@demo-isp.com'
        }
      },
      {
        key: 'sms_settings',
        value: {
          enabled: false,
          provider: 'mock',
          apiKey: '',
          senderId: 'DEMO-ISP'
        }
      }
    ];

    for (const setting of settings) {
      await prisma.setting.upsert({
        where: {
          tenantId_key: {
            tenantId: tenant.id,
            key: setting.key
          }
        },
        update: { valueJson: JSON.stringify(setting.value) },
        create: {
          tenantId: tenant.id,
          key: setting.key,
          valueJson: JSON.stringify(setting.value)
        }
      });
    }

    console.log('✅ Created default settings');

    // Create internet plans
    const plans = [
      {
        name: 'Basic 25 Mbps',
        speedMbps: 25,
        quotaGb: null,
        price: 29.99,
        durationDays: 30,
        taxRate: 18,
        fupJson: JSON.stringify({
          enabled: false,
          threshold: null,
          reducedSpeed: null
        })
      },
      {
        name: 'Standard 50 Mbps',
        speedMbps: 50,
        quotaGb: null,
        price: 49.99,
        durationDays: 30,
        taxRate: 18,
        fupJson: JSON.stringify({
          enabled: true,
          threshold: 500,
          reducedSpeed: 10
        })
      },
      {
        name: 'Premium 100 Mbps',
        speedMbps: 100,
        quotaGb: null,
        price: 79.99,
        durationDays: 30,
        taxRate: 18,
        fupJson: JSON.stringify({
          enabled: false,
          threshold: null,
          reducedSpeed: null
        })
      },
      {
        name: 'Business 200 Mbps',
        speedMbps: 200,
        quotaGb: null,
        price: 149.99,
        durationDays: 30,
        taxRate: 18,
        fupJson: JSON.stringify({
          enabled: false,
          threshold: null,
          reducedSpeed: null
        })
      }
    ];

    const createdPlans = [];
    for (const plan of plans) {
      const created = await prisma.plan.create({
        data: {
          tenantId: tenant.id,
          ...plan
        }
      });
      createdPlans.push(created);
    }

    console.log('✅ Created internet plans');

    // Create sample customers
    const customers = [
      {
        name: 'John Smith',
        cnic: '12345-6789012-3',
        phone: '+1234567890',
        email: 'john.smith@email.com',
        addressJson: JSON.stringify({
          street: '123 Oak Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62701',
          country: 'USA',
          latitude: 39.7817,
          longitude: -89.6501
        }),
        status: 'ACTIVE'
      },
      {
        name: 'Sarah Johnson',
        cnic: '23456-7890123-4',
        phone: '+1234567891',
        email: 'sarah.j@email.com',
        addressJson: JSON.stringify({
          street: '456 Pine Avenue',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62702',
          country: 'USA'
        }),
        status: 'ACTIVE'
      },
      {
        name: 'Mike Davis',
        cnic: '34567-8901234-5',
        phone: '+1234567892',
        email: 'mike.davis@email.com',
        addressJson: JSON.stringify({
          street: '789 Maple Drive',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62703',
          country: 'USA'
        }),
        status: 'ACTIVE'
      },
      {
        name: 'Emily Brown',
        phone: '+1234567893',
        email: 'emily.brown@email.com',
        addressJson: JSON.stringify({
          street: '321 Elm Street',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62704',
          country: 'USA'
        }),
        status: 'SUSPENDED'
      },
      {
        name: 'Tech Solutions LLC',
        phone: '+1234567894',
        email: 'billing@techsolutions.com',
        addressJson: JSON.stringify({
          street: '555 Business Blvd',
          city: 'Springfield',
          state: 'IL',
          zipCode: '62705',
          country: 'USA'
        }),
        status: 'ACTIVE',
        tagsJson: JSON.stringify(['business', 'priority'])
      }
    ];

    const createdCustomers = [];
    for (const customer of customers) {
      const created = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          ...customer
        }
      });
      createdCustomers.push(created);
    }

    console.log('✅ Created sample customers');

    // Create subscriptions for customers
    const subscriptions = [
      {
        customerId: createdCustomers[0].id,
        planId: createdPlans[1].id, // Standard plan
        username: 'john_smith',
        mac: '00:1B:44:11:3A:B7',
        accessType: 'PPPOE',
        status: 'ACTIVE',
        autoRenew: true,
        startedAt: new Date('2024-01-01'),
        endsAt: new Date('2024-02-01')
      },
      {
        customerId: createdCustomers[1].id,
        planId: createdPlans[0].id, // Basic plan
        username: 'sarah_johnson',
        mac: '00:1B:44:11:3A:B8',
        accessType: 'PPPOE',
        status: 'ACTIVE',
        autoRenew: true,
        startedAt: new Date('2024-01-15'),
        endsAt: new Date('2024-02-15')
      },
      {
        customerId: createdCustomers[2].id,
        planId: createdPlans[2].id, // Premium plan
        username: 'mike_davis',
        mac: '00:1B:44:11:3A:B9',
        accessType: 'GPON',
        status: 'ACTIVE',
        autoRenew: true,
        startedAt: new Date('2024-01-10'),
        endsAt: new Date('2024-02-10')
      },
      {
        customerId: createdCustomers[3].id,
        planId: createdPlans[0].id, // Basic plan
        username: 'emily_brown',
        mac: '00:1B:44:11:3A:BA',
        accessType: 'PPPOE',
        status: 'SUSPENDED',
        autoRenew: false,
        startedAt: new Date('2023-12-01'),
        endsAt: new Date('2024-01-01')
      },
      {
        customerId: createdCustomers[4].id,
        planId: createdPlans[3].id, // Business plan
        username: 'techsolutions',
        mac: '00:1B:44:11:3A:BB',
        accessType: 'STATIC_IP',
        status: 'ACTIVE',
        autoRenew: true,
        startedAt: new Date('2024-01-01'),
        endsAt: new Date('2024-02-01')
      }
    ];

    const createdSubscriptions = [];
    for (const subscription of subscriptions) {
      const created = await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          ...subscription
        }
      });
      createdSubscriptions.push(created);
    }

    console.log('✅ Created subscriptions');

    // Create sample invoices
    const currentDate = new Date();
    const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    
    for (let i = 0; i < createdSubscriptions.length; i++) {
      const subscription = createdSubscriptions[i];
      const plan = createdPlans.find(p => p.id === subscription.planId)!;
      
      const subtotal = plan.price;
      const taxAmount = subtotal * (plan.taxRate / 100);
      const total = subtotal + taxAmount;
      
      const invoiceNumber = `INV-DEMO-${lastMonth.getFullYear()}${String(lastMonth.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(4, '0')}`;
      
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          subscriptionId: subscription.id,
          number: invoiceNumber,
          periodStart: new Date(lastMonth),
          periodEnd: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
          subtotal,
          taxAmount,
          total,
          status: i < 3 ? 'PAID' : i === 3 ? 'OVERDUE' : 'PENDING',
          dueDate: new Date(currentDate.getTime() + (15 * 24 * 60 * 60 * 1000)), // 15 days from now
          paidAt: i < 3 ? new Date(currentDate.getTime() - (5 * 24 * 60 * 60 * 1000)) : null
        }
      });

      // Create invoice items
      await prisma.invoiceItem.createMany({
        data: [
          {
            invoiceId: invoice.id,
            type: 'RECURRING',
            label: `${plan.name} - Monthly Service`,
            quantity: 1,
            unitPrice: plan.price,
            amount: plan.price
          },
          {
            invoiceId: invoice.id,
            type: 'TAX',
            label: `Tax (${plan.taxRate}%)`,
            quantity: 1,
            unitPrice: taxAmount,
            amount: taxAmount
          }
        ]
      });

      // Create payments for paid invoices
      if (i < 3) {
        await prisma.payment.create({
          data: {
            tenantId: tenant.id,
            invoiceId: invoice.id,
            method: i === 0 ? 'CASH' : i === 1 ? 'BANK_TRANSFER' : 'GATEWAY',
            reference: i === 0 ? 'CASH-001' : i === 1 ? 'TXN-1234567890' : 'GW-ABC123',
            amount: total,
            status: 'COMPLETED',
            receivedAt: new Date(currentDate.getTime() - (5 * 24 * 60 * 60 * 1000)),
            notes: i === 0 ? 'Cash payment received at office' : ''
          }
        });
      }
    }

    console.log('✅ Created sample invoices and payments');

    // Create sample support tickets
    const tickets = [
      {
        customerId: createdCustomers[0].id,
        subscriptionId: createdSubscriptions[0].id,
        subject: 'Slow internet speed',
        category: 'TECHNICAL',
        priority: 'MEDIUM',
        status: 'OPEN',
        slaDueAt: new Date(currentDate.getTime() + (24 * 60 * 60 * 1000))
      },
      {
        customerId: createdCustomers[1].id,
        subject: 'Billing inquiry',
        category: 'BILLING',
        priority: 'LOW',
        status: 'RESOLVED',
        resolvedAt: new Date(currentDate.getTime() - (2 * 24 * 60 * 60 * 1000))
      },
      {
        customerId: createdCustomers[4].id,
        subscriptionId: createdSubscriptions[4].id,
        subject: 'Request for static IP configuration',
        category: 'REQUEST',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        slaDueAt: new Date(currentDate.getTime() + (12 * 60 * 60 * 1000))
      }
    ];

    for (const ticket of tickets) {
      const created = await prisma.ticket.create({
        data: {
          tenantId: tenant.id,
          ...ticket
        }
      });

      // Add initial message
      await prisma.ticketMessage.create({
        data: {
          ticketId: created.id,
          authorType: 'CUSTOMER',
          body: ticket.subject === 'Slow internet speed' 
            ? 'I am experiencing very slow internet speeds for the past few days. My connection is much slower than the advertised speed.'
            : ticket.subject === 'Billing inquiry'
            ? 'I have a question about my recent bill. Could you please explain the charges?'
            : 'I need help setting up the static IP address for my business connection. Can someone assist me with the configuration?'
        }
      });
    }

    console.log('✅ Created sample support tickets');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Email: admin@demo-isp.com');
    console.log('   Password: admin123');
    console.log('   Tenant: demo-isp');
    console.log('\n🔗 URLs:');
    console.log('   Admin Panel: http://localhost:5173/login');
    console.log('   Customer Portal: http://localhost:5173/portal');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});