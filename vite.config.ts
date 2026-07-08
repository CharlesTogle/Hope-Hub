/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import postcssTailwind from '@tailwindcss/postcss';
import path from 'path';
import { fileURLToPath } from 'url';
import checker from 'vite-plugin-checker';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    react(),
    checker({ typescript: true }),
  ],
  css: {
    postcss: {
      plugins: [postcssTailwind()],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});