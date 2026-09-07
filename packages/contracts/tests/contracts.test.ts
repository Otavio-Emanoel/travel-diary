import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  createTripSchema,
  createEntrySchema,
  requestUploadUrlSchema,
} from '../src';

describe('Contracts & DTO Validation (Zod)', () => {
  it('should validate registerSchema', () => {
    const valid = registerSchema.safeParse({
      name: 'Viajante',
      email: 'viajante@example.com',
      password: 'Password123',
    });
    expect(valid.success).toBe(true);

    const invalid = registerSchema.safeParse({
      name: 'V',
      email: 'not-an-email',
      password: 'short',
    });
    expect(invalid.success).toBe(false);
  });

  it('should validate createTripSchema date ordering', () => {
    const valid = createTripSchema.safeParse({
      title: 'Viagem a Roma',
      startDate: '2026-06-01',
      endDate: '2026-06-15',
    });
    expect(valid.success).toBe(true);

    const invalidDates = createTripSchema.safeParse({
      title: 'Viagem com Datas Invertidas',
      startDate: '2026-06-15',
      endDate: '2026-06-01',
    });
    expect(invalidDates.success).toBe(false);
  });

  it('should validate createEntrySchema categories', () => {
    const valid = createEntrySchema.safeParse({
      content: 'Comendo uma autêntica pizza napolitana',
      entryDate: '2026-06-02',
      category: 'FOOD',
    });
    expect(valid.success).toBe(true);

    const invalidCategory = createEntrySchema.safeParse({
      content: 'Nota qualquer',
      category: 'INVALID_CATEGORY',
    });
    expect(invalidCategory.success).toBe(false);
  });

  it('should validate requestUploadUrlSchema mime types and size', () => {
    const valid = requestUploadUrlSchema.safeParse({
      filename: 'coliseu.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048576,
    });
    expect(valid.success).toBe(true);

    const invalidMime = requestUploadUrlSchema.safeParse({
      filename: 'virus.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: 1000,
    });
    expect(invalidMime.success).toBe(false);
  });
});
