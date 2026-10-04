import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { MiddlewareHandler } from 'hono';
import type { Db } from '../db/db';
import { randomToken, sha256Hex } from '../lib/crypto';
import { fail, type AppEnv, type Ctx } from '../app';

// Server-side owner sessions. The browser holds an opaque random token in an
// HttpOnly, Secure, SameSite=Strict cookie (unreadable by page scripts); the
// database stores only its SHA-256. Every request re-checks the session row and
// the owner, so revocation (sign-out, sign-out-everywhere, disabling an owner)
// takes effect immediately.

export const SESSION_COOKIE = '__Host-rh_session';
const SESSION_HOURS = 12;

export interface OwnerSession {
  idHash: string;
  ownerId: string;
  email: string;
  displayName: string;
  needsPasskey: boolean;
}

export async function createSession(c: Ctx, ownerId: string, opts: { needsPasskey?: boolean } = {}): Promise<void> {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await c.get('db').query(
    `INSERT INTO sessions (id_hash, owner_id, expires_at, user_agent, needs_passkey) VALUES ($1, $2, $3, $4, $5)`,
    [await sha256Hex(token), ownerId, expires, (c.req.header('user-agent') ?? '').slice(0, 300), opts.needsPasskey ?? false]
  );
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true, secure: true, sameSite: 'Strict', path: '/', expires,
  });
}

export async function readSession(c: Ctx): Promise<OwnerSession | null> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  return lookupSession(c.get('db'), await sha256Hex(token));
}

export async function lookupSession(db: Db, idHash: string): Promise<OwnerSession | null> {
  const { rows } = await db.query<{ owner_id: string; email: string; display_name: string; needs_passkey: boolean }>(
    `UPDATE sessions s SET last_seen_at = now()
       FROM owners o
      WHERE s.id_hash = $1 AND o.id = s.owner_id
        AND s.revoked_at IS NULL AND s.expires_at > now() AND o.disabled_at IS NULL
     RETURNING s.owner_id, o.email, o.display_name, s.needs_passkey`,
    [idHash]
  );
  const r = rows[0];
  return r ? { idHash, ownerId: r.owner_id, email: r.email, displayName: r.display_name, needsPasskey: r.needs_passkey } : null;
}

export async function endSession(c: Ctx): Promise<void> {
  const session = c.get('session') ?? (await readSession(c));
  if (session) await c.get('db').query('UPDATE sessions SET revoked_at = now() WHERE id_hash = $1', [session.idHash]);
  deleteCookie(c, SESSION_COOKIE, { path: '/', secure: true });
}

export async function revokeAllSessions(db: Db, ownerId: string, exceptIdHash?: string): Promise<number> {
  const { rowCount } = await db.query(
    `UPDATE sessions SET revoked_at = now() WHERE owner_id = $1 AND revoked_at IS NULL AND id_hash IS DISTINCT FROM $2`,
    [ownerId, exceptIdHash ?? null]
  );
  return rowCount;
}

/** Owner routes: valid session required. Recovery sessions may only add a passkey. */
export function requireOwner(opts: { allowRecoverySession?: boolean } = {}): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const session = await readSession(c);
    if (!session) fail(401, 'Please sign in.');
    if (session.needsPasskey && !opts.allowRecoverySession) {
      fail(403, 'Add a new passkey to finish account recovery.');
    }
    c.set('session', session);
    await next();
  };
}
