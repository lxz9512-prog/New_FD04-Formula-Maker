import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  cacheDir: '.cache/vite',
  root: 'client',
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@client': path.resolve(__dirname, 'client'),
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.CLIENT_BASE_PATH': JSON.stringify(''),
    'process.env': '{}',
  },
  build: { outDir: '../dist', emptyOutDir: true },
  server: { host: '127.0.0.1', port: 5174 },
});
