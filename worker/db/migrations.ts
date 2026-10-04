import type { Db } from './db';

// Versioned schema. Each migration runs once in its own transaction and is
// recorded in schema_migrations; a session advisory lock serializes concurrent
// runs. Run with `npm run db:migrate` (deploy step) — never at request time.
// Never edit an applied migration: append a new one.

export interface Migration { version: number; name: string; sql: string }

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'baseline',
    sql: `
CREATE TABLE owners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text NOT NULL UNIQUE CHECK (email = lower(email) AND char_length(email) <= 254),
  display_name    text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  role            text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner')),
  disabled_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- WebAuthn credentials. public_key is the COSE key from registration.
CREATE TABLE passkeys (
  id              text PRIMARY KEY,
  owner_id        uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  public_key      bytea NOT NULL,
  counter         bigint NOT NULL DEFAULT 0,
  transports      text[] NOT NULL DEFAULT '{}',
  device_type     text,
  backed_up       boolean NOT NULL DEFAULT false,
  name            text NOT NULL DEFAULT 'Passkey' CHECK (char_length(name) <= 60),
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz
);
CREATE INDEX passkeys_owner_idx ON passkeys(owner_id);

-- One-time recovery codes, stored as keyed HMACs (pepper lives outside the DB).
CREATE TABLE recovery_codes (
  id              bigserial PRIMARY KEY,
  owner_id        uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  code_hash       text NOT NULL UNIQUE,
  used_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Server-side sessions: the HttpOnly cookie holds a random token; only its
-- SHA-256 is stored, so a database read cannot be replayed as a cookie.
CREATE TABLE sessions (
  id_hash         text PRIMARY KEY,
  owner_id        uuid NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  user_agent      text,
  needs_passkey   boolean NOT NULL DEFAULT false
);
CREATE INDEX sessions_owner_idx ON sessions(owner_id);

CREATE TABLE auth_challenges (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge       text NOT NULL,
  purpose         text NOT NULL CHECK (purpose IN ('register', 'authenticate')),
  owner_id        uuid REFERENCES owners(id) ON DELETE CASCADE,
  expires_at      timestamptz NOT NULL,
  used_at         timestamptz
);

CREATE TABLE owner_invites (
  token_hash      text PRIMARY KEY,
  email           text NOT NULL CHECK (email = lower(email)),
  created_by      uuid REFERENCES owners(id) ON DELETE SET NULL,
  expires_at      timestamptz NOT NULL,
  used_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description     text NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000),
  category        text NOT NULL CHECK (char_length(category) BETWEEN 1 AND 60),
  rating          numeric(2,1) NOT NULL DEFAULT 5 CHECK (rating BETWEEN 0 AND 5),
  review_count    integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  image_url       text NOT NULL CHECK (image_url LIKE 'https://%' AND char_length(image_url) <= 2048),
  image_public_id text,
  affiliate_url   text NOT NULL CHECK (affiliate_url LIKE 'https://%' AND char_length(affiliate_url) <= 2048),
  affiliate_tag   text CHECK (affiliate_tag ~ '^[A-Za-z0-9._-]{1,64}$'),
  sub_id          text CHECK (sub_id ~ '^[A-Za-z0-9._-]{1,64}$'),
  badge           text CHECK (char_length(badge) <= 40),
  featured        boolean NOT NULL DEFAULT false,
  status          text NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_status_idx ON products(status, featured DESC, sort_order, created_at DESC);

-- Click history keeps a product snapshot so reports survive product deletion.
CREATE TABLE clicks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      uuid REFERENCES products(id) ON DELETE SET NULL,
  product_title   text NOT NULL,
  category        text NOT NULL,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  referrer        text NOT NULL DEFAULT 'direct',
  device          text NOT NULL CHECK (device IN ('Mobile', 'Desktop', 'Tablet')),
  country         text CHECK (country ~ '^[A-Z]{2}$'),
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  destination_url text NOT NULL,
  visitor_hash    text,
  client_event_id uuid UNIQUE,
  is_owner        boolean NOT NULL DEFAULT false
);
CREATE INDEX clicks_time_idx ON clicks(occurred_at);
CREATE INDEX clicks_product_time_idx ON clicks(product_id, occurred_at);

CREATE TABLE conversions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid REFERENCES products(id) ON DELETE SET NULL,
  product_title     text NOT NULL,
  click_id          uuid REFERENCES clicks(id) ON DELETE SET NULL,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  source            text NOT NULL CHECK (source IN ('manual', 'webhook')),
  external_event_id text,
  amount_cents      integer CHECK (amount_cents >= 0),
  note              text CHECK (char_length(note) <= 200),
  UNIQUE (source, external_event_id)
);
CREATE INDEX conversions_time_idx ON conversions(occurred_at);

-- Append-only owner/system action history (no credentials, no emails).
CREATE TABLE audit_events (
  id              bigserial PRIMARY KEY,
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  actor_id        uuid REFERENCES owners(id) ON DELETE SET NULL,
  action          text NOT NULL,
  target          text,
  result          text NOT NULL CHECK (result IN ('success', 'failure')),
  correlation_id  text
);
CREATE INDEX audit_events_time_idx ON audit_events(occurred_at DESC);
`,
  },
];

const LOCK_KEY = 4_204_201_337;

// Each migration takes a transaction-scoped advisory lock and re-checks the
// ledger inside the same transaction, so concurrent runners (two deploys)
// apply every migration exactly once even through a connection pool.
export async function migrate(db: Db, log: (msg: string) => void = () => {}): Promise<number[]> {
  await db.tx(async (t) => {
    await t.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY]);
    await t.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version integer PRIMARY KEY, name text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
  });
  const applied: number[] = [];
  for (const m of MIGRATIONS) {
    const ran = await db.tx(async (t) => {
      await t.query('SELECT pg_advisory_xact_lock($1)', [LOCK_KEY]);
      const { rowCount } = await t.query('SELECT 1 FROM schema_migrations WHERE version = $1', [m.version]);
      if (rowCount > 0) return false;
      await t.query(m.sql);
      await t.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [m.version, m.name]);
      return true;
    });
    if (ran) {
      applied.push(m.version);
      log(`applied migration ${m.version} (${m.name})`);
    }
  }
  return applied;
}
