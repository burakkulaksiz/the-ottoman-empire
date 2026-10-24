/// <reference types="vitest/config" />

import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const isTest = process.env.VITEST === 'true';

export default defineConfig({
  plugins: [tailwindcss(), !isTest && reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './testing/test-setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['src/**'],
    },
  },
});
