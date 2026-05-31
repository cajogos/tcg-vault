import { defineConfig } from 'drizzle-kit';
import { dbPath } from './src/backend/lib/config';

export default defineConfig({
  schema: './src/backend/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
});
