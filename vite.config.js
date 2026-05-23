import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    // ── API Proxy ────────────────────────────────────────────────────────────
    // Forwards any request starting with /api from the React dev server
    // to the Express backend (port 5000), avoiding CORS issues during
    // local development. In production, nginx or a load balancer handles
    // this routing instead.
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/ml-api': {
        target: 'http://ml-service:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ml-api/, ''),
      },
    },
  },
});
