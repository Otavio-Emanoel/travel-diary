import { z } from 'zod';
import { uuidSchema } from './common';

export const tripStatusSchema = z.enum(['PLANNED', 'ONGOING', 'COMPLETED']);
export type TripStatus = z.infer<typeof tripStatusSchema>;

export const tripVisibilitySchema = z.enum(['PRIVATE', 'UNLISTED', 'PUBLIC']);
export type TripVisibility = z.infer<typeof tripVisibilitySchema>;

export const baseTripSchema = z.object({
  title: z.string().min(1, 'O título da viagem é obrigatório').max(150),
  description: z.string().max(2000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de início deve estar no formato YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de término deve estar no formato YYYY-MM-DD').optional(),
  status: tripStatusSchema.default('PLANNED'),
  visibility: tripVisibilitySchema.default('PRIVATE'),
  coverMediaId: uuidSchema.optional(),
});

export const createTripSchema = baseTripSchema.refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'A data de término deve ser igual ou posterior à data de início',
    path: ['endDate'],
  }
);

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const updateTripSchema = baseTripSchema.partial().refine(
  (data) => {
    if (data.endDate && data.startDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'A data de término deve ser igual ou posterior à data de início',
    path: ['endDate'],
  }
);
export type UpdateTripInput = z.infer<typeof updateTripSchema>;

export const tripSummarySchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  title: z.string(),
  description: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  status: tripStatusSchema,
  visibility: tripVisibilitySchema,
  coverMediaUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TripSummary = z.infer<typeof tripSummarySchema>;
