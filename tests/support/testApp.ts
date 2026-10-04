// Boots the REAL API (worker/server.ts) against a fresh, uniquely named
// database on the disposable cluster from globalPostgres.ts. Requests go
// through Hono's in-process app.request(), with a cookie jar per "browser".
// Never reads .env, never contacts Turnstile/Cloudinary/Upstash.
import crypto from 'node:crypto';
import pg from 'pg';
import { buildApp } from '../../worker/server';
import { loadConfig, type RawEnv } from '../../worker/config';
import { createPoolDb } from '../../worker/db/db';
import { migrate } from '../../worker/db/migrations';
import { memoryLimiter } from '../../worker/lib/ratelimit';
import type { ImageStore } from '../../worker/lib/cloudinary';
import { VirtualAuthenticator } from './virtualAuthenticator';

export const integrationSkipReason = process.env.TEST_DATABASE_ADMIN_URL
  ? false
  : (process.env.TEST_DATABASE_UNAVAILABLE || 'TEST_DATABASE_ADMIN_URL not set');

const LOCAL = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
export function assertDisposableUrl(raw: string, requireTestDb = true): URL {
  const url = new URL(raw);
  if (!LOCAL.has(url.hostname)) throw new Error(`Refusing non-local test database host "${url.hostname}".`);
  if (requireTestDb && !url.pathname.slice(1).startsWith('araccoon_test_')) throw new Error('Refusing a database not named araccoon_test_*.');
  return url;
}

export const ORIGIN = 'http://localhost:5173';
export const OWNER_EMAIL = 'owner@example.test';
export const SETUP_TOKEN = 'setup-token-for-tests-0123456789';
export const TURNSTILE_PASS = 'turnstile-ok';
export const FAKE_CLOUD = 'testcloud';

export function fakeImages(): ImageStore & { destroyed: string[] } {
  const destroyed: string[] = [];
  return {
    configured: true,
    destroyed,
    async signUpload() {
      return { cloudName: FAKE_CLOUD, apiKey: 'k', timestamp: 1, signature: 'sig', folder: 'araccoon-hub/products', uploadPreset: 'p' };
    },
    isOwnImage: (url, id) => !!id && id.startsWith('araccoon-hub/products/') && url.startsWith(`https://res.cloudinary.com/${FAKE_CLOUD}/image/upload/`) && url.includes(id),
    deliveryUrl: (id) => `https://res.cloudinary.com/${FAKE_CLOUD}/image/upload/f_auto,q_auto,c_limit,w_1200/${id}`,
    async destroy(id) { destroyed.push(id); return true; },
  };
}

export interface Res { status: number; headers: Headers; body: any; text: string }

export class Browser {
  cookies = new Map<string, string>();
  constructor(private ctx: TestContext, public ip = `203.0.113.${Math.floor(Math.random() * 200) + 1}`) {}

  async request(method: string, path: string, opts: { body?: unknown; raw?: string; headers?: Record<string, string>; origin?: string | null } = {}): Promise<Res> {
    const headers: Record<string, string> = { 'cf-connecting-ip': this.ip, ...(opts.headers ?? {}) };
    if (opts.origin !== null) headers.origin = opts.origin ?? ORIGIN;
    if (this.cookies.size) headers.cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    let payload: string | undefined = opts.raw;
    if (opts.body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(opts.body);
    }
    const res = await this.ctx.app.request(path, { method, headers, body: payload });
    for (const sc of res.headers.getSetCookie()) {
      const [pair] = sc.split(';');
      const [name, ...rest] = pair!.split('=');
      const value = rest.join('=');
      if (!value || /max-age=0/i.test(sc) || /expires=Thu, 01 Jan 1970/i.test(sc)) this.cookies.delete(name!);
      else this.cookies.set(name!, value);
    }
    const text = await res.text();
    let body: any;
    try { body = JSON.parse(text); } catch { body = undefined; }
    return { status: res.status, headers: res.headers, body, text };
  }

  get = (p: string, o?: Parameters<Browser['request']>[2]) => this.request('GET', p, o);
  post = (p: string, b?: unknown, o?: Parameters<Browser['request']>[2]) => this.request('POST', p, { ...o, body: b ?? {} });
  patch = (p: string, b: unknown) => this.request('PATCH', p, { body: b });
  del = (p: string) => this.request('DELETE', p, { body: {} });
}

export interface TestContext {
  app: ReturnType<typeof buildApp>;
  db: ReturnType<typeof createPoolDb>;
  images: ReturnType<typeof fakeImages>;
  browser(ip?: string): Browser;
  /** Completes first-owner setup with a virtual passkey; returns the signed-in browser. */
  setupOwner(): Promise<{ browser: Browser; authenticator: VirtualAuthenticator; recoveryCodes: string[] }>;
  close(): Promise<void>;
}

export async function createTestContext(env: Partial<RawEnv> = {}): Promise<TestContext> {
  const admin = assertDisposableUrl(process.env.TEST_DATABASE_ADMIN_URL!, false);
  const name = `araccoon_test_${crypto.randomBytes(6).toString('hex')}`;
  const adminClient = new pg.Client({ connectionString: admin.toString() });
  await adminClient.connect();
  await adminClient.query(`CREATE DATABASE ${name}`);
  await adminClient.end();
  const url = new URL(admin.toString());
  url.pathname = `/${name}`;
  assertDisposableUrl(url.toString());

  const db = createPoolDb(url.toString());
  await migrate(db);
  const images = fakeImages();
  const config = loadConfig({
    ENVIRONMENT: 'test',
    OWNER_EMAIL,
    OWNER_SETUP_TOKEN: SETUP_TOKEN,
    PASSKEY_RP_ID: 'localhost',
    PASSKEY_ORIGIN: ORIGIN,
    REPORT_TIMEZONE: 'Asia/Kolkata',
    AMAZON_ASSOCIATE_TAG: 'amazon.in=test-21,amazon.com=test-20',
    ...env,
  });
  const app = buildApp({
    config,
    limiter: memoryLimiter(),
    human: { verify: async (token) => token === TURNSTILE_PASS },
    images,
    openDb: () => ({ query: db.query, tx: db.tx }), // shared pool; no per-request close
  });

  const ctx: TestContext = {
    app, db, images,
    browser: (ip) => new Browser(ctx, ip),
    async setupOwner() {
      const browser = ctx.browser();
      const authenticator = new VirtualAuthenticator('localhost', ORIGIN);
      const start = await browser.post('/api/auth/setup/options', { email: OWNER_EMAIL, setupToken: SETUP_TOKEN, turnstileToken: TURNSTILE_PASS });
      if (start.status !== 200) throw new Error(`setup/options ${start.status}: ${start.text}`);
      const finish = await browser.post('/api/auth/setup/verify', {
        challengeId: start.body.challengeId, response: await authenticator.createResponse(start.body.options), name: 'Test key',
      });
      if (finish.status !== 200) throw new Error(`setup/verify ${finish.status}: ${finish.text}`);
      return { browser, authenticator, recoveryCodes: finish.body.recoveryCodes };
    },
    close: () => db.close(),
  };
  return ctx;
}

export const VALID_PRODUCT = {
  title: 'Desk Lamp',
  description: 'Bright and clever.',
  category: 'Desk & Office',
  rating: 4.5,
  reviewCount: 120,
  imageUrl: `https://res.cloudinary.com/${FAKE_CLOUD}/image/upload/v1/araccoon-hub/products/lamp`,
  imagePublicId: 'araccoon-hub/products/lamp',
  affiliateUrl: 'https://www.amazon.in/dp/B0TEST0001',
};
