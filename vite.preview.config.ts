import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Frontend-only character preview; does not require the Worker or Postgres.
export default defineConfig({ plugins: [react(), tailwindcss()] });
