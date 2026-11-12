import { buildApp } from './server';
import { loadConfig, type Config, type RawEnv } from './config';
import { createRequestDb } from './db/db';
import { memoryLimiter, upstashLimiter } from './lib/ratelimit';
import { turnstileVerifier } from './lib/turnstile';
import { cloudinaryStore } from './lib/cloudinary';
import { runMaintenance } from './maintenance';
import { checkListings } from './lib/linkCheck';

// Config and the app are built once per isolate and reused across requests;
// only the database connection is per request (Hyperdrive pools for us).
let cached: { app: ReturnType<typeof buildApp>; config: Config } | null = null;
let currentEnv: Env | null = null;

function getApp(env: Env) {
  currentEnv = env;
  if (!cached) {
    const config = loadConfig(env as unknown as RawEnv);
    const app = buildApp({
      config,
      limiter: config.upstash ? upstashLimiter(config.upstash.url, config.upstash.token) : memoryLimiter(),
      human: turnstileVerifier(config.turnstile.secretKey),
      images: cloudinaryStore(config.cloudinary),
      assets: { fetch: (request: Request) => currentEnv!.ASSETS.fetch(request) },
      // Rendered pages are cached at the edge in production only, so dev always shows fresh output.
      pageCache: config.environment === 'production' ? caches.default : undefined,
      openDb: () => createRequestDb(currentEnv!.HYPERDRIVE.connectionString),
    });
    cached = { app, config };
  }
  return cached;
}

export default {
  fetch(request, env, ctx) {
    return getApp(env).app.fetch(request, env, ctx);
  },

  async scheduled(_controller, env, ctx) {
    const { config } = getApp(env);
    const db = createRequestDb(env.HYPERDRIVE.connectionString);
    ctx.waitUntil((async () => {
      try {
        const result = await runMaintenance(db, config.clickRetentionDays);
        console.info(`[maintenance] ${JSON.stringify(result)}`);
        // Separate from the cleanup above so a slow or failing Amazon never stops it.
        try {
          console.info(`[listing-check] ${JSON.stringify(await checkListings(db, (...args) => fetch(...args)))}`);
        } catch (err) {
          console.error(`[listing-check] failed: ${err instanceof Error ? err.message : err}`);
        }
      } finally {
        await db.close();
      }
    })());
  },
} satisfies ExportedHandler<Env>;
