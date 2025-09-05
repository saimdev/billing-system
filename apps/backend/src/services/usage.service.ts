import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';

interface UsageData {
  subscriptionId: string;
  period: string;
  upBytes: number;
  downBytes: number;
  sessions: number;
}

class UsageService {
  async import(tenantId: string, data: UsageData[]) {
    const result = {
      imported: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const usage of data) {
      try {
        // Verify subscription exists and belongs to tenant
        const subscription = await prisma.subscription.findFirst({
          where: { id: usage.subscriptionId, tenantId }
        });

        if (!subscription) {
          result.failed++;
          result.errors.push(`Subscription ${usage.subscriptionId} not found`);
          continue;
        }

        await prisma.usageCounter.upsert({
          where: {
            tenantId_subscriptionId_period: {
              tenantId,
              subscriptionId: usage.subscriptionId,
              period: usage.period
            }
          },
          update: {
            upBytes: usage.upBytes,
            downBytes: usage.downBytes,
            totalBytes: usage.upBytes + usage.downBytes,
            sessions: usage.sessions,
            lastUpdatedAt: new Date()
          },
          create: {
            tenantId,
            subscriptionId: usage.subscriptionId,
            period: usage.period,
            upBytes: usage.upBytes,
            downBytes: usage.downBytes,
            totalBytes: usage.upBytes + usage.downBytes,
            sessions: usage.sessions
          }
        });

        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Error processing ${usage.subscriptionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  async getBySubscription(tenantId: string, subscriptionId: string, period?: string) {
    const where: any = { tenantId, subscriptionId };
    if (period) where.period = period;

    return prisma.usageCounter.findMany({
      where,
      orderBy: { period: 'desc' }
    });
  }
}

export const usageService = new UsageService();