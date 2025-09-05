import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  DATABASE_URL: z.string().default('file:../../data/app.sqlite'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().transform(Number).optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
  SMS_PROVIDER: z.enum(['twilio', 'textlocal', 'mock']).default('mock'),
  SMS_API_KEY: z.string().optional(),
  SMS_SENDER_ID: z.string().default('ISP-BILL'),
  UPLOAD_DIR: z.string().default('./uploads'),
  PDF_STORAGE_DIR: z.string().default('./pdfs'),
  DEMO_MODE: z.string().transform(v => v === 'true').default(false)
});

export const config = envSchema.parse(process.env);