import { z } from 'zod';
import { uuidSchema } from './common';

export const destinationSchema = z.object({
  id: uuidSchema,
  tripId: uuidSchema,
  name: z.string().min(1, 'Nome do destino é obrigatório').max(120),
  country: z.string().min(1, 'País é obrigatório').max(80),
  countryCode: z.string().length(2).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  orderIndex: z.number().int().default(0),
});

export type Destination = z.infer<typeof destinationSchema>;

export const addDestinationSchema = destinationSchema.omit({ id: true, tripId: true });
export type AddDestinationInput = z.infer<typeof addDestinationSchema>;
