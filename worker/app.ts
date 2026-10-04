import { Hono, type Context, type MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError, type ZodType } from 'zod';
import type { Config } from './config';
import type { Db } from './db/db';
import type { RateLimiter } from './lib/ratelimit';
import type { HumanCheck } from './lib/turnstile';
import type { ImageStore } from './lib/cloudinary';
import type { OwnerSession } from './auth/sessions';
import { clientIp } from './lib/request';

export interface AppDeps {
  config: Config;
  limiter: RateLimiter;
  human: HumanCheck;
  images: ImageStore;
  /** Opens the database for one request; close() runs after the response. */
  openDb: () => Db & { close?: () => Promise<void> };
}

export type AppEnv = {
  Variables: {
    deps: AppDeps;
    db: Db;
    correlationId: string;
    session: OwnerSession | null;
  };
};

export type Ctx = Context<AppEnv>;

export class ApiError extends Error {
  constructor(public status: number, message: string, public fields?: Record<string, string>, public headers?: Record<string, string>) {
    super(message);
  }
}

export function fail(status: number, message: string, fields?: Record<string, string>): never {
  throw new ApiError(status, message, fields);
}

/** Parse and validate a JSON body with a zod schema (400 with field messages on failure). */
export async function body<T>(c: Ctx, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    fail(400, 'Request body must be valid JSON.');
  }
  return schema.parse(raw);
}

/** Rate-limit by an explicit key. Sensitive routes fail closed if the store is down. */
export async function limit(c: Ctx, name: string, key: string, max: number, windowSeconds: number, failOpen = false): Promise<void> {
  const { limiter } = c.get('deps');
  let result;
  try {
    result = await limiter.hit(`${name}:${key}`, max, windowSeconds);
  } catch (err) {
    console.error(`[${c.get('correlationId')}] rate limiter error: ${err instanceof Error ? err.message : err}`);
    if (failOpen) return;
    throw new ApiError(503, 'Service temporarily unavailable. Please try again shortly.');
  }
  if (!result.ok) {
    throw new ApiError(429, 'Too many requests. Please slow down.', undefined, { 'Retry-After': String(result.retryAfter) });
  }
}

export const ipKey = (c: Ctx) => clientIp(c.req.raw) ?? 'local';

const MAX_JSON_BYTES = 100 * 1024;

export function createApp(deps: AppDeps): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.use('*', async (c, next) => {
    const correlationId = crypto.randomUUID();
    c.set('correlationId', correlationId);
    c.set('deps', deps);
    c.set('session', null);
    const db = deps.openDb();
    c.set('db', db);
    try {
      await next();
    } finally {
      c.header('X-Correlation-ID', correlationId);
      c.header('X-Content-Type-Options', 'nosniff');
      c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
      if (db.close) {
        const closing = db.close();
        try {
          c.executionCtx.waitUntil(closing);
        } catch {
          await closing; // no execution context (Node tests)
        }
      }
    }
  });

  // Bound request bodies before any parsing (webhooks have their own limit).
  app.use('/api/*', async (c, next) => {
    const len = Number(c.req.header('content-length') ?? '0');
    if (len > MAX_JSON_BYTES && !c.req.path.startsWith('/api/webhooks/')) fail(413, 'Request body is too large.');
    await next();
  });

  // Private responses must never be cached by browsers or the CDN.
  app.use('/api/admin/*', noStore);
  app.use('/api/auth/*', noStore);

  // CSRF: cookie-authenticated state changes must come from our own origin.
  // (SameSite=Strict cookies already block most cross-site sends; this is the
  // second, explicit layer.)
  app.use('/api/*', async (c, next) => {
    const m = c.req.method;
    if (m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS' && !c.req.path.startsWith('/api/webhooks/')) {
      const origin = c.req.header('origin');
      const expected = new URL(deps.config.passkey.origin).origin;
      if (origin !== expected) fail(403, 'Cross-origin request rejected.');
    }
    await next();
  });

  app.onError((err, c) => {
    const correlationId = c.get('correlationId');
    if (err instanceof ZodError) {
      const fields: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = issue.path.join('.') || '_';
        fields[key] ??= issue.code === 'unrecognized_keys' ? `Unknown field(s): ${(issue as { keys?: string[] }).keys?.join(', ')}` : issue.message;
      }
      return c.json({ error: 'Please check the highlighted fields.', fields, correlationId }, 400);
    }
    if (err instanceof ApiError) {
      for (const [k, v] of Object.entries(err.headers ?? {})) c.header(k, v);
      return c.json({ error: err.message, fields: err.fields, correlationId }, err.status as 400);
    }
    if (err instanceof HTTPException) {
      return c.json({ error: err.message || 'Request failed.', correlationId }, err.status);
    }
    console.error(`[${correlationId}] unhandled error: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    return c.json({ error: 'An unexpected error occurred.', correlationId }, 500);
  });

  app.notFound((c) => c.json({ error: 'Not found.', correlationId: c.get('correlationId') }, 404));

  return app;
}

const noStore: MiddlewareHandler<AppEnv> = async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
};
