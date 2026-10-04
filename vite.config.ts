import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';

// One build produces the React client (static assets) and the Worker (API).
// `npm run dev` runs the Worker in the real workerd runtime with Vite HMR.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  // The API only accepts writes from PASSKEY_ORIGIN (http://localhost:5173 in dev). Fail loudly
  // if the port is taken instead of silently moving to 5174, where every sign-in/out is rejected.
  server: { port: 5173, strictPort: true },
});
