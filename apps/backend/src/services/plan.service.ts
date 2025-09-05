import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';

interface CreatePlanData {
  name: string;
  speedMbps?: number;
  quotaGb?: number;
  price: number;
  durationDays: number;
  taxRate: number;
  fupRules?: {
    enabled: boolean;
    threshold?: number;
    reducedSpeed?: number;
  };
}

class PlanService {
  async list(tenantId: string) {
    return prisma.plan.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      },
      orderBy: { price: 'asc' }
    });
  }

  async create(tenantId: string, data: CreatePlanData) {
    return prisma.plan.create({
      data: {
        tenantId,
        name: data.name,
        speedMbps: data.speedMbps,
        quotaGb: data.quotaGb,
        price: data.price,
        durationDays: data.durationDays,
        taxRate: data.taxRate,
        fupJson: data.fupRules ? JSON.stringify(data.fupRules) : null,
        isActive: true
      }
    });
  }

  async update(tenantId: string, planId: string, data: Partial<CreatePlanData>) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, tenantId }
    });

    if (!plan) {
      throw new ApiError('Plan not found', 404);
    }

    return prisma.plan.update({
      where: { id: planId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.speedMbps !== undefined && { speedMbps: data.speedMbps }),
        ...(data.quotaGb !== undefined && { quotaGb: data.quotaGb }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.durationDays && { durationDays: data.durationDays }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.fupRules && { fupJson: JSON.stringify(data.fupRules) })
      }
    });
  }

  async deactivate(tenantId: string, planId: string) {
    const plan = await prisma.plan.findFirst({
      where: { id: planId, tenantId },
      include: {
        subscriptions: { where: { status: 'ACTIVE' } }
      }
    });

    if (!plan) {
      throw new ApiError('Plan not found', 404);
    }

    if (plan.subscriptions.length > 0) {
      throw new ApiError('Cannot deactivate plan with active subscriptions', 400);
    }

    await prisma.plan.update({
      where: { id: planId },
      data: { isActive: false }
    });
  }
}

export const planService = new PlanService();