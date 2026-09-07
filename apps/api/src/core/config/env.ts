import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Carrega .env da raiz do monorepo se presente
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default('postgresql://travel_user:travel_password_change_me@localhost:5435/travel_diary'),
  
  // Storage (MinIO / S3)
  STORAGE_PROVIDER: z.enum(['s3', 'local']).default('s3'),
  STORAGE_ENDPOINT: z.string().default('http://localhost:9000'),
  STORAGE_PUBLIC_URL: z.string().default('http://localhost:9000'),
  STORAGE_BUCKET: z.string().default('travel-diary-media'),
  STORAGE_ACCESS_KEY: z.string().default('minio_admin'),
  STORAGE_SECRET_KEY: z.string().default('minio_password_change_me'),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_USE_SSL: z.coerce.boolean().default(false),

  // Auth & Secrets
  JWT_ACCESS_SECRET: z.string().min(16).default('change_this_super_secret_access_jwt_key_in_production'),
  JWT_REFRESH_SECRET: z.string().min(16).default('change_this_super_secret_refresh_jwt_key_in_production'),
  ACCESS_TOKEN_EXPIRATION: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRATION: z.string().default('30d'),
  
  // Web & CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Configurações de ambiente inválidas:', parsedEnv.error.format());
  process.exit(1);
}

export const env: Env = parsedEnv.data;
