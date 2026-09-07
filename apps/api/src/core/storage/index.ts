import { S3StorageProvider } from './s3-storage-provider';
import { env } from '../config/env';

export * from './storage-provider';
export * from './s3-storage-provider';

export const storageProvider = new S3StorageProvider({
  endpoint: env.STORAGE_ENDPOINT,
  publicUrl: env.STORAGE_PUBLIC_URL,
  bucket: env.STORAGE_BUCKET,
  region: env.STORAGE_REGION,
  accessKey: env.STORAGE_ACCESS_KEY,
  secretKey: env.STORAGE_SECRET_KEY,
  useSsl: env.STORAGE_USE_SSL,
});
