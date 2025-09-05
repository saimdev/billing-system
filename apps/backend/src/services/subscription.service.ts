import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';
import { addDays } from 'date-fns';

interface CreateSubscriptionData {
    customerId: string;
    planId: string;
    username?: string;
    mac?: string;
    accessType: string;
    autoRenew: boolean;
    startDate?: string;
}

interface SearchParams {
    page: number;
    limit: number;
    status?: string;
    customerId?: string;
}

class SubscriptionService {
    async list(tenantId: string, params: SearchParams) {
        const { page, limit, status, customerId } = params;
        const skip = (page - 1) * limit;

        const where: any = { tenantId };
        if (status) where.status = status;
        if (customerId) where.customerId = customerId;

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                skip,
                take: limit,
                include: {
                    customer: {
                        select: { id: true, name: true, phone: true, email: true }
                    },
                    plan: {
                        select: { id: true, name: true, speedMbps: true, quotaGb: true, price: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.subscription.count({ where })
        ]);

        return {
            subscriptions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async create(tenantId: string, data: CreateSubscriptionData) {
        // Verify customer exists
        const customer = await prisma.customer.findFirst({
            where: { id: data.customerId, tenantId }
        });

        if (!customer) {
            throw new ApiError('Customer not found', 404);
        }

        // Verify plan exists
        const plan = await prisma.plan.findFirst({
            where: { id: data.planId, tenantId, isActive: true }
        });

        if (!plan) {
            throw new ApiError('Plan not found or inactive', 404);
        }

        // Check username uniqueness if provided
        if (data.username) {
            const existingSubscription = await prisma.subscription.findFirst({
                where: { tenantId, username: data.username }
            });

            if (existingSubscription) {
                throw new ApiError('Username already exists', 400);
            }
        }

        const startDate = data.startDate ? new Date(data.startDate) : new Date();
        const endDate = addDays(startDate, plan.durationDays);

        return prisma.subscription.create({
            data: {
                tenantId,
                customerId: data.customerId,
                planId: data.planId,
                username: data.username,
                mac: data.mac,
                accessType: data.accessType as any,
                autoRenew: data.autoRenew,
                status: 'PENDING',
                startedAt: startDate,
                endsAt: endDate
            },
            include: {
                customer: {
                    select: { name: true, phone: true, email: true }
                },
                plan: {
                    select: { name: true, speedMbps: true, quotaGb: true, price: true }
                }
            }
        });
    }

    async updateStatus(tenantId: string, subscriptionId: string, status: string) {
        const subscription = await prisma.subscription.findFirst({
            where: { id: subscriptionId, tenantId }
        });

        if (!subscription) {
            throw new ApiError('Subscription not found', 404);
        }

        return prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: status as any,
                ...(status === 'ACTIVE' && !subscription.startedAt && { startedAt: new Date() })
            },
            include: {
                customer: {
                    select: { name: true, phone: true }
                },
                plan: {
                    select: { name: true }
                }
            }
        });
    }
}

export const subscriptionService = new SubscriptionService();