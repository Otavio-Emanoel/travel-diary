import { z } from 'zod';

export const uuidSchema = z.string().uuid({ message: 'Identificador deve ser um UUID válido' });

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  cursor: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface ApiResponse<T> {
  success: true;
  data: T;
  pagination?: {
    total?: number;
    limit: number;
    offset?: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}
