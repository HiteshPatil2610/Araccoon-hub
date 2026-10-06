import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import { loadEnv } from './scripts/env';

// One build produces the React client (static assets) and the Worker (API).
// `npm run dev` runs the Worker in the real workerd runtime with Vite HMR.
export default defineConfig({
  plugins: [{
    name: 'canonical-local-origin',
    apply: 'serve',
    configureServer(server) {
      const settings = loadEnv();
      if (settings.ENVIRONMENT !== 'development') return;
      const origin = new URL(settings.PASSKEY_ORIGIN || 'http://localhost:5173');
      if (origin.protocol !== 'http:' || origin.hostname !== 'localhost') return;
      server.middlewares.use((req, res, next) => {
        const path = req.url || '/';
        const isPage = req.method === 'GET' && req.headers.accept?.includes('text/html');
        if (isPage && req.headers.host === `127.0.0.1:${origin.port}` && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/api/')) {
          res.writeHead(302, { Location: `${origin.origin}${path}`, 'Cache-Control': 'no-store' });
          res.end();
          return;
        }
        next();
      });
    },
  }, react(), tailwindcss(), cloudflare()],
  // The API only accepts writes from PASSKEY_ORIGIN (http://localhost:5173 in dev). Fail loudly
  // if the port is taken instead of silently moving to 5174, where every sign-in/out is rejected.
  server: { port: 5173, strictPort: true },
});
