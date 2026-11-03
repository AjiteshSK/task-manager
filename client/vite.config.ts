import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Express server, so the browser only talks to one origin (no CORS)
    proxy: { '/api': 'http://localhost:5000' },
  },
});
