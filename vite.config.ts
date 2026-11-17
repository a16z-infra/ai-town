import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const entry = (file: string) => fileURLToPath(new URL(file, import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ai-town',
  plugins: [react()],
  server: {
    allowedHosts: ['ai-town-your-app-name.fly.dev', 'localhost', '127.0.0.1'],
  },
  build: {
    rollupOptions: {
      input: {
        // The game itself, and the read-only analytics client at /analytics.html.
        main: entry('./index.html'),
        analytics: entry('./analytics.html'),
      },
    },
  },
});
