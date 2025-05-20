import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',  // Ensure that @ maps to the /src directory
    },
  },
  css: {
    postcss: './postcss.config.ts',  // Tell Vite to use your TypeScript-based PostCSS config
  },
  server: {
    proxy: {
      // Proxy API requests to the backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,}}}
})


