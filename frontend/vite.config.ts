import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Firebase phone auth does not work on `localhost`; use the loopback IP.
    host: '127.0.0.1',
    open: '/login',
  },
});
