import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/api-error.ts';
import argon2 from 'argon2';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string;
}

class UserService {
  async list(tenantId: string) {
    return prisma.user.findMany({
      where: { tenantId, status: { not: 'INACTIVE' } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(tenantId: string, data: CreateUserData) {
    const existingUser = await prisma.user.findFirst({
      where: { tenantId, email: data.email }
    });

    if (existingUser) {
      throw new ApiError('Email already exists', 400);
    }

    const hashedPassword = await argon2.hash(data.password);

    return prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        hash: hashedPassword,
        role: data.role as any,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
  }

  async update(tenantId: string, userId: string, data: Partial<CreateUserData>) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findFirst({
        where: { tenantId, email: data.email, id: { not: userId } }
      });

      if (existingUser) {
        throw new ApiError('Email already exists', 400);
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role as any })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });
  }

  async deactivate(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    if (user.role === 'OWNER') {
      throw new ApiError('Cannot deactivate owner', 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' }
    });
  }
}

export const userService = new UserService();