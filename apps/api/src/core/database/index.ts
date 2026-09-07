import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { env } from '../config/env';

// Configuração do pool de conexões otimizado para VPS modesta
export const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
