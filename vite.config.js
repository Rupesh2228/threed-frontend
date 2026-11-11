import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Everything stays on localhost: the dev server proxies API + file requests to the Express backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:5000',
      '/files': 'http://127.0.0.1:5000',
    },
  },
});
