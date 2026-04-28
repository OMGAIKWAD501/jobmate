import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  base: "/",

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://jobmate-backend-jkx3.onrender.com',// local dev only
        changeOrigin: true,
        secure: false,
      }
    }
  },

  build: {
    outDir: 'build', // matches your current setup
  }
});