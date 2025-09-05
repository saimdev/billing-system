import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/env.js';
import { ApiError } from '../lib/api-error.ts';
import { emailService } from './email.service.js';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  tenantName: string;
  tenantSlug: string;
}

interface LoginResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  async register(data: RegisterData): Promise<LoginResult> {
    const { name, email, password, tenantName, tenantSlug } = data;

    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug }
    });

    if (existingTenant) {
      throw new ApiError('Tenant slug already exists', 400);
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      throw new ApiError('Email already registered', 400);
    }

    const hashedPassword = await argon2.hash(password);

    // Create tenant and owner user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          brandingJson: JSON.stringify({
            primaryColor: '#3B82F6',
            logo: null
          })
        }
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name,
          email,
          hash: hashedPassword,
          role: 'OWNER',
          status: 'ACTIVE'
        }
      });

      // Create default settings
      await tx.setting.createMany({
        data: [
          {
            tenantId: tenant.id,
            key: 'tax_settings',
            valueJson: JSON.stringify({ defaultRate: 0.18, inclusive: false })
          },
          {
            tenantId: tenant.id,
            key: 'invoice_settings',
            valueJson: JSON.stringify({ 
              prefix: 'INV',
              numberFormat: '{PREFIX}-{TENANT}-{YEAR}{MONTH}-{SEQ}',
              dueDays: 15
            })
          },
          {
            tenantId: tenant.id,
            key: 'email_settings',
            valueJson: JSON.stringify({
              enabled: false,
              host: '',
              port: 587,
              user: '',
              pass: '',
              from: `noreply@${tenantSlug}.com`
            })
          }
        ]
      });

      return { user, tenant };
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(result.user.id, result.tenant.id);

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenant: {
          id: result.tenant.id,
          name: result.tenant.name,
          slug: result.tenant.slug
        }
      },
      accessToken,
      refreshToken
    };
  }

  async login(email: string, password: string, tenantSlug?: string): Promise<LoginResult> {
    let user;

    if (tenantSlug) {
      // Login with specific tenant
      user = await prisma.user.findFirst({
        where: {
          email,
          tenant: { slug: tenantSlug }
        },
        include: {
          tenant: true
        }
      });
    } else {
      // Find user across all tenants (return first match)
      user = await prisma.user.findFirst({
        where: { email },
        include: {
          tenant: true
        }
      });
    }

    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new ApiError('Account is inactive', 401);
    }

    const isValidPassword = await argon2.verify(user.hash, password);
    if (!isValidPassword) {
      throw new ApiError('Invalid credentials', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.tenantId);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug
        }
      },
      accessToken,
      refreshToken
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, tenantId: true, status: true }
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new ApiError('Invalid refresh token', 401);
      }

      return this.generateTokens(user.id, user.tenantId);
    } catch (error) {
      throw new ApiError('Invalid refresh token', 401);
    }
  }

  async logout(userId: string): Promise<void> {
    // In a production app, you might want to blacklist the refresh token
    // For now, we just acknowledge the logout
    console.log(`User ${userId} logged out`);
  }

  async forgotPassword(email: string, tenantSlug?: string): Promise<void> {
    let user;

    if (tenantSlug) {
      user = await prisma.user.findFirst({
        where: {
          email,
          tenant: { slug: tenantSlug }
        },
        include: { tenant: true }
      });
    } else {
      user = await prisma.user.findFirst({
        where: { email },
        include: { tenant: true }
      });
    }

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token (in production, store this securely)
    const resetToken = uuidv4();
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}&tenant=${user.tenant.slug}`;

    // Send reset email
    await emailService.sendPasswordReset(user.email, user.name, resetUrl);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    // In production, verify token from secure storage
    // For demo, we'll skip token verification
    throw new ApiError('Password reset not implemented in demo mode', 501);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            brandingJson: true
          }
        }
      }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return user;
  }

  private generateTokens(userId: string, tenantId: string) {
    const payload = { userId, tenantId };
    
    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();