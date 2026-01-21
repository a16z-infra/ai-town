import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/x402-world',
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'convex'],
  },
});
