import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';

class SettingService {
  async getAll(tenantId: string) {
    const settings = await prisma.setting.findMany({
      where: { tenantId }
    });

    const result: Record<string, any> = {};
    settings.forEach(setting => {
      result[setting.key] = JSON.parse(setting.valueJson);
    });

    return result;
  }

  async get(tenantId: string, key: string) {
    const setting = await prisma.setting.findUnique({
      where: {
        tenantId_key: { tenantId, key }
      }
    });

    if (!setting) {
      throw new ApiError('Setting not found', 404);
    }

    return {
      key: setting.key,
      value: JSON.parse(setting.valueJson)
    };
  }

  async update(tenantId: string, key: string, value: any) {
    return prisma.setting.upsert({
      where: {
        tenantId_key: { tenantId, key }
      },
      update: {
        valueJson: JSON.stringify(value)
      },
      create: {
        tenantId,
        key,
        valueJson: JSON.stringify(value)
      }
    });
  }
}

export const settingService = new SettingService();