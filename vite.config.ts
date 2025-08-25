import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    allowedHosts: ['ustypology.github.io', 'localhost', '127.0.0.1'],
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm', '@electric-sql/pglite'],
    include: ['@xenova/transformers'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'duckdb': ['@duckdb/duckdb-wasm'],
          'pglite': ['@electric-sql/pglite'], 
          'transformers': ['@xenova/transformers'],
        },
      },
    },
  },
  define: {
    global: 'globalThis',
  },
});
