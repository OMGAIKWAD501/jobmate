import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // ✅ VERY IMPORTANT for Vercel
  base: "/",

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // local dev only
        changeOrigin: true,
        secure: false,
      }
    }
  },

  build: {
    outDir: 'build', // matches your current setup
  }
});