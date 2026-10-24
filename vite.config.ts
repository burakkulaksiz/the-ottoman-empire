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
    // Düşük bellekli makinelerde her çekirdeğe bir jsdom worker'ı açmak
    // belleği tüketiyor.
    maxWorkers: 2,
    coverage: {
      include: ['src/**'],
    },
    projects: [
      {
        // Oyun motoru DOM'a erişmeden, saf Node ortamında test edilir.
        extends: true,
        test: {
          name: 'engine',
          environment: 'node',
          include: ['src/engine/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          setupFiles: './testing/test-setup.ts',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: ['src/engine/**'],
        },
      },
    ],
  },
});
