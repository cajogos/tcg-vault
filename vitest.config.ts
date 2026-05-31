import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(
{
  plugins: [react()],
  resolve:
  {
    alias: { '@': path.resolve('src/frontend') },
  },
  test:
  {
    globals: true,
    environment: 'jsdom',
    environmentMatchGlobs: [['src/test/backend/**', 'node']],
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
});
