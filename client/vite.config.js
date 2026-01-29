import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // Increase proxy timeouts for large repository analysis
        proxyTimeout: 300000, // 5 minutes for target to respond
        timeout: 300000,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('[Proxy] Error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[Proxy] Request:', req.method, req.url);
          });
        }
      }
    }
  }
});
