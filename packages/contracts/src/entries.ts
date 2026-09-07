import { z } from 'zod';
import { uuidSchema } from './common';
import { createLocationSchema, locationSchema } from './locations';
import { mediaItemSchema } from './media';

export const entryCategorySchema = z.enum([
  'TRAVEL',
  'FOOD',
  'ACTIVITY',
  'LODGING',
  'JOURNAL',
]);

export type EntryCategory = z.infer<typeof entryCategorySchema>;

export const createEntrySchema = z.object({
  title: z.string().max(150).optional(),
  content: z.string().min(1, 'O conteúdo do relato não pode estar vazio'),
  entryTime: z.string().datetime().default(() => new Date().toISOString()),
  category: entryCategorySchema.default('JOURNAL'),
  tripDayId: uuidSchema.optional(),
  location: createLocationSchema.optional(),
  mediaIds: z.array(uuidSchema).default([]),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

export const updateEntrySchema = createEntrySchema.partial();
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

export const entryDetailsSchema = z.object({
  id: uuidSchema,
  tripId: uuidSchema,
  tripDayId: uuidSchema.nullable(),
  title: z.string().nullable(),
  content: z.string(),
  entryTime: z.string().datetime(),
  category: entryCategorySchema,
  orderIndex: z.number().int(),
  location: locationSchema.nullable(),
  media: z.array(mediaItemSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EntryDetails = z.infer<typeof entryDetailsSchema>;

export const tripDaySchema = z.object({
  id: uuidSchema,
  tripId: uuidSchema,
  dayDate: z.string(),
  dayNumber: z.number().int(),
  notes: z.string().nullable(),
});

export type TripDay = z.infer<typeof tripDaySchema>;

export const timelineResponseSchema = z.object({
  tripId: uuidSchema,
  days: z.array(
    tripDaySchema.extend({
      entries: z.array(entryDetailsSchema),
    })
  ),
  unassignedEntries: z.array(entryDetailsSchema),
});

export type TimelineResponse = z.infer<typeof timelineResponseSchema>;
