import { defineConfig } from 'drizzle-kit';
import { env } from './src/core/config/env';

export default defineConfig({
  schema: './src/core/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
