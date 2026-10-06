import { parseHostList } from '../shared/urlPolicy';

// Secrets/vars that are not declared in wrangler.jsonc (set with
// `wrangler secret put` in production and in .env locally).
export interface SecretEnv {
  SESSION_SECRET?: string;
  RECOVERY_CODE_PEPPER?: string;
  OWNER_EMAIL?: string;
  OWNER_SETUP_TOKEN?: string;
  PASSKEY_RP_ID?: string;
  PASSKEY_ORIGIN?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  CLOUDINARY_CLOUD_NAME?: string;
  CLOUDINARY_API_KEY?: string;
  CLOUDINARY_API_SECRET?: string;
  CLOUDINARY_UPLOAD_PRESET?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  AMAZON_ASSOCIATE_TAG?: string;
  CRON_SECRET?: string;
  WEBHOOK_SECRET?: string;
  DEV_LOGIN_TOKEN?: string;
}

export type RawEnv = SecretEnv & {
  ENVIRONMENT?: string;
  REPORT_TIMEZONE?: string;
  AFFILIATE_ALLOWED_HOSTS?: string;
  CLICK_RETENTION_DAYS?: string;
};

export interface Config {
  environment: 'production' | 'development' | 'test';
  sessionSecret: string;
  recoveryPepper: string;
  ownerEmail: string | null;
  ownerSetupToken: string | null;
  passkey: { rpId: string; origin: string; rpName: string };
  turnstile: { siteKey: string | null; secretKey: string | null };
  cloudinary: { cloudName: string; apiKey: string; apiSecret: string; uploadPreset: string } | null;
  upstash: { url: string; token: string } | null;
  /** Amazon tracking IDs per store host (e.g. amazon.in → you-21); '*' = default. */
  associateTags: Record<string, string>;
  allowedHosts: string[];
  reportTimezone: string;
  clickRetentionDays: number;
  cronSecret: string | null;
  webhookSecret: string | null;
  devLoginToken: string | null;
}

export class ConfigError extends Error {}

const DEV_SECRET = 'development-only-secret-do-not-use-in-production-0000';

export function loadConfig(env: RawEnv): Config {
  const environment = env.ENVIRONMENT === 'development' || env.ENVIRONMENT === 'test' ? env.ENVIRONMENT : 'production';
  const prod = environment === 'production';
  const missing: string[] = [];
  const need = (key: keyof SecretEnv, devDefault: string | null = null): string | null => {
    const value = env[key]?.trim();
    if (value) return value;
    if (prod) missing.push(key);
    return devDefault;
  };

  const sessionSecret = need('SESSION_SECRET', DEV_SECRET)!;
  const recoveryPepper = need('RECOVERY_CODE_PEPPER', DEV_SECRET)!;
  const rpId = need('PASSKEY_RP_ID', 'localhost')!;
  const origin = need('PASSKEY_ORIGIN', 'http://localhost:5173')!;
  const turnstileSecret = need('TURNSTILE_SECRET_KEY');
  const turnstileSite = need('TURNSTILE_SITE_KEY');
  const upstashUrl = need('UPSTASH_REDIS_REST_URL');
  const upstashToken = need('UPSTASH_REDIS_REST_TOKEN');
  if (missing.length) {
    throw new ConfigError(`Missing required production settings: ${missing.join(', ')}`);
  }
  if (prod && (sessionSecret.length < 32 || recoveryPepper.length < 32)) {
    throw new ConfigError('SESSION_SECRET and RECOVERY_CODE_PEPPER must be at least 32 characters.');
  }
  if (prod && (sessionSecret === DEV_SECRET || recoveryPepper === DEV_SECRET || sessionSecret === recoveryPepper)) {
    throw new ConfigError('Production session and recovery secrets must be independent and must not use the development default.');
  }
  if (prod) {
    try {
      const site = new URL(origin);
      const redis = new URL(upstashUrl!);
      if (site.protocol !== 'https:' || site.origin !== origin || site.username || site.password
        || !(site.hostname === rpId || site.hostname.endsWith(`.${rpId}`))
        || rpId === 'localhost' || !rpId.includes('.')
        || redis.protocol !== 'https:' || redis.username || redis.password) throw new Error();
    } catch {
      throw new ConfigError('Production requires an https PASSKEY_ORIGIN matching PASSKEY_RP_ID and an https Redis URL without credentials.');
    }
    if (env.OWNER_SETUP_TOKEN && env.OWNER_SETUP_TOKEN.trim().length < 32) {
      throw new ConfigError('OWNER_SETUP_TOKEN must be at least 32 characters in production.');
    }
  }

  const cloud = [env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET].map(v => v?.trim());
  const reportTimezone = env.REPORT_TIMEZONE?.trim() || 'UTC';
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: reportTimezone });
  } catch {
    throw new ConfigError(`REPORT_TIMEZONE "${reportTimezone}" is not a valid IANA time zone.`);
  }

  return {
    environment,
    sessionSecret,
    recoveryPepper,
    ownerEmail: env.OWNER_EMAIL?.trim().toLowerCase() || null,
    ownerSetupToken: env.OWNER_SETUP_TOKEN?.trim() || null,
    passkey: { rpId, origin, rpName: 'Araccoon Hub' },
    turnstile: { siteKey: turnstileSite, secretKey: turnstileSecret },
    cloudinary: cloud.every(Boolean)
      ? { cloudName: cloud[0]!, apiKey: cloud[1]!, apiSecret: cloud[2]!, uploadPreset: env.CLOUDINARY_UPLOAD_PRESET?.trim() || 'raccoon-products' }
      : null,
    upstash: upstashUrl && upstashToken ? { url: upstashUrl, token: upstashToken } : null,
    associateTags: parseAssociateTags(env.AMAZON_ASSOCIATE_TAG),
    allowedHosts: parseHostList(env.AFFILIATE_ALLOWED_HOSTS),
    reportTimezone,
    clickRetentionDays: Math.min(730, Math.max(1, Number.parseInt(env.CLICK_RETENTION_DAYS || '90', 10) || 90)),
    cronSecret: env.CRON_SECRET?.trim() || null,
    webhookSecret: env.WEBHOOK_SECRET?.trim() || null,
    // Dev-only shortcut for local admin review; ignored outside development.
    devLoginToken: environment === 'development' ? env.DEV_LOGIN_TOKEN?.trim() || null : null,
  };
}

// "you-21" → applies to every store; "amazon.in=you-21,amazon.com=you-20" → per store.
export function parseAssociateTags(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (raw ?? '').split(',').map(p => p.trim()).filter(Boolean)) {
    const [host, tag] = part.includes('=') ? part.split('=', 2).map(x => x.trim()) : ['*', part];
    if (host && tag && /^[A-Za-z0-9._-]{1,64}$/.test(tag)) out[host.toLowerCase().replace(/^www\./, '')] = tag;
  }
  return out;
}
