import { z } from 'zod';
import { uuidSchema } from './common';

export const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
] as const;

export const requestUploadUrlSchema = z.object({
  tripId: uuidSchema.optional(),
  entryId: uuidSchema.optional(),
  filename: z.string().min(1).max(255),
  mimeType: z.enum(allowedMimeTypes, {
    errorMap: () => ({ message: 'Formato não suportado. Use JPEG, PNG ou WebP.' }),
  }),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(15 * 1024 * 1024, 'O tamanho máximo da foto é de 15MB'),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;

export const presignedUploadResponseSchema = z.object({
  mediaId: uuidSchema,
  uploadUrl: z.string().url(),
  storageKey: z.string(),
  expiresInSeconds: z.number().int(),
});

export type PresignedUploadResponse = z.infer<typeof presignedUploadResponseSchema>;

export const mediaItemSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  tripId: uuidSchema.nullable(),
  entryId: uuidSchema.nullable(),
  storageKey: z.string(),
  publicUrl: z.string().url(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  status: z.enum(['PENDING_UPLOAD', 'READY', 'FAILED']),
  createdAt: z.string().datetime(),
});

export type MediaItem = z.infer<typeof mediaItemSchema>;
