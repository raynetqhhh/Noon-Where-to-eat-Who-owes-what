import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: cached by the browser across deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // In development, /api calls are forwarded to the Express server,
    // so the browser sees one origin and you avoid CORS issues.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
