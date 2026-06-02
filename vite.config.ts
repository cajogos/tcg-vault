import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import express from 'express';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import * as schema from './src/backend/schema';
import { createInventoryRouter } from './src/backend/routes/inventory';
import { createExportsRouter } from './src/backend/routes/exports';
import { dbPath, imagesDir } from './src/backend/lib/config';

const sqlite = new Database(dbPath);
const db = drizzle(sqlite, { schema });

const apiApp = express();
apiApp.use(express.json());
apiApp.use('/inventory', createInventoryRouter(db));
apiApp.use('/exports', createExportsRouter(db));

const imagesMiddleware = express.static(imagesDir);

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'integrated-local-api',
      configureServer(server)
      {
        server.middlewares.use('/images', imagesMiddleware);
        server.middlewares.use('/api', apiApp);
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve('src/frontend'),
    },
  },
});
