import { z } from 'zod';
import { uuidSchema } from './common';

export const locationSchema = z.object({
  id: uuidSchema,
  entryId: uuidSchema,
  name: z.string().min(1).max(150),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type Location = z.infer<typeof locationSchema>;

export const createLocationSchema = locationSchema.omit({ id: true, entryId: true });
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
