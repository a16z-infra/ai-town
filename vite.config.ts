import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/ai-town',
  plugins: [react()],
  // The frontend imports shared code from convex/, which pulls in
  // convex/_generated/server.js. Since convex 1.39 that file has
  // `export const env = process.env;` at the top level, and the browser has
  // no `process`, so the page threw "process is not defined" on load.
  define: { 'process.env': {} },
  server: {
    allowedHosts: ['ai-town-your-app-name.fly.dev', 'localhost', '127.0.0.1'],
  },
});
