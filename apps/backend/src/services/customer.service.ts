import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';
import { Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parser';
import * as XLSX from 'xlsx';

interface CreateCustomerData {
  name: string;
  cnic?: string;
  phone: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  tags?: string[];
}

interface SearchParams {
  q?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  tags?: string;
  page: number;
  limit: number;
  sortBy?: 'name' | 'createdAt' | 'phone';
  sortOrder?: 'asc' | 'desc';
}

interface ImportResult {
  imported: number;
  failed: number;
  errors: string[];
}

class CustomerService {
  async list(tenantId: string, params: SearchParams) {
    const { q, status, tags, page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: Prisma.CustomerWhereInput = {
      tenantId,
      ...(status && { status }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
          { cnic: { contains: q } }
        ]
      }),
      ...(tags && {
        tagsJson: {
          contains: tags // Simple contains check, can be improved
        }
      })
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subscriptions: {
            select: {
              id: true,
              status: true,
              plan: {
                select: { name: true }
              }
            }
          },
          _count: {
            select: {
              subscriptions: true,
              tickets: true
            }
          }
        }
      }),
      prisma.customer.count({ where })
    ]);

    // Parse JSON fields
    const processedCustomers = customers.map(customer => ({
      ...customer,
      address: customer.addressJson ? JSON.parse(customer.addressJson) : null,
      tags: customer.tagsJson ? JSON.parse(customer.tagsJson) : [],
      documents: customer.documentsJson ? JSON.parse(customer.documentsJson) : []
    }));

    return {
      customers: processedCustomers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getById(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        subscriptions: {
          include: {
            plan: {
              select: { name: true, speedMbps: true, quotaGb: true, price: true }
            }
          }
        },
        tickets: {
          where: { status: { not: 'CLOSED' } },
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true
          }
        }
      }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    return {
      ...customer,
      address: customer.addressJson ? JSON.parse(customer.addressJson) : null,
      tags: customer.tagsJson ? JSON.parse(customer.tagsJson) : [],
      documents: customer.documentsJson ? JSON.parse(customer.documentsJson) : []
    };
  }

  async create(tenantId: string, data: CreateCustomerData) {
    // Check if phone already exists for this tenant
    const existingCustomer = await prisma.customer.findFirst({
      where: { tenantId, phone: data.phone }
    });

    if (existingCustomer) {
      throw new ApiError('Phone number already exists', 400);
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: data.name,
        cnic: data.cnic,
        phone: data.phone,
        email: data.email,
        addressJson: data.address ? JSON.stringify(data.address) : null,
        tagsJson: data.tags ? JSON.stringify(data.tags) : null,
        status: 'ACTIVE'
      }
    });

    return {
      ...customer,
      address: customer.addressJson ? JSON.parse(customer.addressJson) : null,
      tags: customer.tagsJson ? JSON.parse(customer.tagsJson) : [],
      documents: []
    };
  }

  async update(tenantId: string, customerId: string, data: Partial<CreateCustomerData>) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    // Check phone uniqueness if phone is being updated
    if (data.phone && data.phone !== customer.phone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { tenantId, phone: data.phone, id: { not: customerId } }
      });

      if (existingCustomer) {
        throw new ApiError('Phone number already exists', 400);
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.cnic !== undefined && { cnic: data.cnic }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.address && { addressJson: JSON.stringify(data.address) }),
        ...(data.tags && { tagsJson: JSON.stringify(data.tags) })
      }
    });

    return {
      ...updatedCustomer,
      address: updatedCustomer.addressJson ? JSON.parse(updatedCustomer.addressJson) : null,
      tags: updatedCustomer.tagsJson ? JSON.parse(updatedCustomer.tagsJson) : [],
      documents: updatedCustomer.documentsJson ? JSON.parse(updatedCustomer.documentsJson) : []
    };
  }

  async delete(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        subscriptions: { where: { status: 'ACTIVE' } }
      }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    if (customer.subscriptions.length > 0) {
      throw new ApiError('Cannot delete customer with active subscriptions', 400);
    }

    await prisma.customer.update({
      where: { id: customerId },
      data: { status: 'TERMINATED' }
    });
  }

  async uploadDocuments(tenantId: string, customerId: string, files: Express.Multer.File[]) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    const documents = [];
    
    for (const file of files) {
      const fileName = `${customerId}-${Date.now()}-${file.originalname}`;
      const filePath = path.join('uploads/documents', fileName);
      
      // Move file to permanent location
      await fs.rename(file.path, filePath);
      
      documents.push({
        name: file.originalname,
        path: filePath,
        type: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString()
      });
    }

    // Update customer documents
    const existingDocs = customer.documentsJson ? JSON.parse(customer.documentsJson) : [];
    const updatedDocs = [...existingDocs, ...documents];

    await prisma.customer.update({
      where: { id: customerId },
      data: { documentsJson: JSON.stringify(updatedDocs) }
    });

    return documents;
  }

  async bulkImport(tenantId: string, file: Express.Multer.File): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      failed: 0,
      errors: []
    };

    try {
      let data: any[] = [];

      if (file.mimetype === 'text/csv') {
        // Parse CSV
        const fileContent = await fs.readFile(file.path, 'utf-8');
        data = this.parseCSV(fileContent);
      } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        // Parse Excel
        const workbook = XLSX.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        throw new ApiError('Unsupported file format', 400);
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          await this.create(tenantId, {
            name: row.name || row.Name,
            phone: row.phone || row.Phone,
            email: row.email || row.Email || undefined,
            cnic: row.cnic || row.CNIC || undefined,
            address: {
              street: row.address || row.Address,
              city: row.city || row.City,
              state: row.state || row.State
            }
          });
          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } finally {
      // Clean up uploaded file
      await fs.unlink(file.path).catch(() => {});
    }

    return result;
  }

  private parseCSV(content: string): any[] {
    const lines = content.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  }

  async getSubscriptions(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    return prisma.subscription.findMany({
      where: { customerId, tenantId },
      include: {
        plan: {
          select: {
            name: true,
            speedMbps: true,
            quotaGb: true,
            price: true,
            durationDays: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInvoices(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    return prisma.invoice.findMany({
      where: {
        tenantId,
        subscription: {
          customerId
        }
      },
      include: {
        subscription: {
          select: {
            username: true,
            plan: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getPayments(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    return prisma.payment.findMany({
      where: {
        tenantId,
        invoice: {
          subscription: {
            customerId
          }
        }
      },
      include: {
        invoice: {
          select: {
            number: true,
            total: true
          }
        }
      },
      orderBy: { receivedAt: 'desc' }
    });
  }

  async getTickets(tenantId: string, customerId: string) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, tenantId }
    });

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    return prisma.ticket.findMany({
      where: { customerId, tenantId },
      select: {
        id: true,
        subject: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        subscription: {
          select: {
            username: true,
            plan: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const customerService = new CustomerService();