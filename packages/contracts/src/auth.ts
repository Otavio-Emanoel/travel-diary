import { z } from 'zod';
import { uuidSchema } from './common';

export const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'A senha deve conter ao menos um número'),
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres').max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Token de atualização inválido'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const userProfileSchema = z.object({
  id: uuidSchema,
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  bio: z.string().nullable(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const authResponseSchema = z.object({
  user: userProfileSchema,
  accessToken: z.string(),
  refreshToken: z.string().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
