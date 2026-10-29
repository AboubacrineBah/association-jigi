import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// `base` = nom du dépôt GitHub Pages (https://aboubacrinebah.github.io/association-jigi/).
export default defineConfig({
  base: '/association-jigi/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
