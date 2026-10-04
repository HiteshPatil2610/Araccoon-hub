import { Hono } from 'hono';
import { z } from 'zod';
import { body, fail, limit, type AppEnv, type Ctx } from '../app';
import { requireOwner, revokeAllSessions, endSession } from '../auth/sessions';
import { audit } from '../lib/audit';
import { randomToken, sha256Hex } from '../lib/crypto';
import { finishRegistration, issueRecoveryCodes, ownerProfile, registrationOptions } from './auth';
import type { AuditEntry, PasskeyInfo } from '../../shared/types';

export const adminSecurityRoutes = new Hono<AppEnv>();
const ownerId = (c: Ctx) => c.get('session')!.ownerId;

// ---- current owner (recovery sessions allowed so the UI can prompt for a passkey)
adminSecurityRoutes.get('/me', requireOwner({ allowRecoverySession: true }), async (c) => {
  const s = c.get('session')!;
  return c.json(await ownerProfile(c.get('db'), s.ownerId, s.needsPasskey));
});

adminSecurityRoutes.patch('/me', requireOwner(), async (c) => {
  const input = await body(c, z.strictObject({ displayName: z.string().trim().max(80) }));
  await c.get('db').query('UPDATE owners SET display_name = $2 WHERE id = $1', [ownerId(c), input.displayName]);
  return c.json(await ownerProfile(c.get('db'), ownerId(c), false));
});

// ---- passkeys
adminSecurityRoutes.get('/passkeys', requireOwner({ allowRecoverySession: true }), async (c) => {
  const { rows } = await c.get('db').query<{ id: string; name: string; created_at: Date; last_used_at: Date | null; backed_up: boolean }>(
    'SELECT id, name, created_at, last_used_at, backed_up FROM passkeys WHERE owner_id = $1 ORDER BY created_at', [ownerId(c)]
  );
  return c.json(rows.map((r): PasskeyInfo => ({
    id: r.id, name: r.name, createdAt: r.created_at.toISOString(), lastUsedAt: r.last_used_at?.toISOString() ?? null, backedUp: r.backed_up,
  })));
});

adminSecurityRoutes.post('/passkeys/options', requireOwner({ allowRecoverySession: true }), async (c) => {
  await limit(c, 'passkey-add', ownerId(c), 10, 900);
  const { rows } = await c.get('db').query<{ id: string; email: string; display_name: string }>(
    'SELECT id, email, display_name FROM owners WHERE id = $1', [ownerId(c)]
  );
  return c.json(await registrationOptions(c, rows[0]!));
});

adminSecurityRoutes.post('/passkeys/verify', requireOwner({ allowRecoverySession: true }), async (c) => {
  await limit(c, 'passkey-add', ownerId(c), 10, 900);
  const input = await body(c, z.strictObject({ challengeId: z.uuid(), response: z.record(z.string(), z.unknown()), name: z.string().trim().max(60).default('Passkey') }));
  const session = c.get('session')!;
  const registeredFor = await finishRegistration(c, input.challengeId, input.response, input.name);
  if (registeredFor !== session.ownerId) fail(403, 'This passkey request belongs to another account.');
  if (session.needsPasskey) {
    await c.get('db').query('UPDATE sessions SET needs_passkey = false WHERE id_hash = $1', [session.idHash]);
  }
  await audit(c, 'security.passkey_added', 'success');
  return c.json({ ok: true }, 201);
});

adminSecurityRoutes.patch('/passkeys/:id', requireOwner(), async (c) => {
  const input = await body(c, z.strictObject({ name: z.string().trim().min(1).max(60) }));
  const { rowCount } = await c.get('db').query('UPDATE passkeys SET name = $3 WHERE id = $1 AND owner_id = $2', [c.req.param('id'), ownerId(c), input.name]);
  if (!rowCount) fail(404, 'Passkey not found.');
  return c.json({ ok: true });
});

adminSecurityRoutes.delete('/passkeys/:id', requireOwner(), async (c) => {
  const db = c.get('db');
  const result = await db.tx(async (t) => {
    const { rows } = await t.query<{ n: string }>('SELECT count(*) AS n FROM passkeys WHERE owner_id = $1', [ownerId(c)]);
    if (Number(rows[0]!.n) <= 1) return 'last' as const;
    const del = await t.query('DELETE FROM passkeys WHERE id = $1 AND owner_id = $2', [c.req.param('id'), ownerId(c)]);
    return del.rowCount ? ('ok' as const) : ('missing' as const);
  });
  if (result === 'last') fail(409, 'You cannot remove your only passkey. Add another one first.');
  if (result === 'missing') fail(404, 'Passkey not found.');
  await audit(c, 'security.passkey_removed', 'success');
  return c.json({ ok: true });
});

// ---- recovery codes (old set is invalidated; new codes are shown once)
adminSecurityRoutes.post('/recovery-codes', requireOwner(), async (c) => {
  await limit(c, 'recovery-regen', ownerId(c), 5, 3600);
  const codes = await issueRecoveryCodes(c, ownerId(c));
  await audit(c, 'security.recovery_codes_regenerated', 'success');
  return c.json({ recoveryCodes: codes });
});

adminSecurityRoutes.get('/recovery-codes/status', requireOwner(), async (c) => {
  const { rows } = await c.get('db').query<{ total: string; unused: string }>(
    'SELECT count(*) AS total, count(*) FILTER (WHERE used_at IS NULL) AS unused FROM recovery_codes WHERE owner_id = $1', [ownerId(c)]
  );
  return c.json({ total: Number(rows[0]!.total), unused: Number(rows[0]!.unused) });
});

// ---- sessions
adminSecurityRoutes.get('/sessions', requireOwner(), async (c) => {
  const { rows } = await c.get('db').query<{ id_hash: string; created_at: Date; last_seen_at: Date; user_agent: string | null }>(
    `SELECT id_hash, created_at, last_seen_at, user_agent FROM sessions
      WHERE owner_id = $1 AND revoked_at IS NULL AND expires_at > now() ORDER BY last_seen_at DESC`, [ownerId(c)]
  );
  const current = c.get('session')!.idHash;
  return c.json(rows.map(r => ({
    id: r.id_hash.slice(0, 16), current: r.id_hash === current, createdAt: r.created_at.toISOString(),
    lastSeenAt: r.last_seen_at.toISOString(), userAgent: r.user_agent,
  })));
});

adminSecurityRoutes.delete('/sessions/:id', requireOwner(), async (c) => {
  const prefix = c.req.param('id');
  if (!/^[0-9a-f]{16}$/.test(prefix)) fail(400, 'Invalid session id.');
  const { rowCount } = await c.get('db').query(
    `UPDATE sessions SET revoked_at = now() WHERE owner_id = $1 AND left(id_hash, 16) = $2 AND revoked_at IS NULL`, [ownerId(c), prefix]
  );
  if (!rowCount) fail(404, 'Session not found.');
  await audit(c, 'security.session_revoked', 'success');
  return c.json({ ok: true });
});

adminSecurityRoutes.post('/sessions/revoke-others', requireOwner(), async (c) => {
  const n = await revokeAllSessions(c.get('db'), ownerId(c), c.get('session')!.idHash);
  await audit(c, 'security.sessions_revoked', 'success', `${n}`);
  return c.json({ revoked: n });
});

// ---- owners (all owners have equal rights; you cannot disable yourself)
adminSecurityRoutes.get('/owners', requireOwner(), async (c) => {
  const { rows } = await c.get('db').query<{ id: string; email: string; display_name: string; disabled_at: Date | null; created_at: Date; passkeys: string }>(
    `SELECT o.id, o.email, o.display_name, o.disabled_at, o.created_at, count(p.id) AS passkeys
       FROM owners o LEFT JOIN passkeys p ON p.owner_id = o.id GROUP BY o.id ORDER BY o.created_at`
  );
  return c.json(rows.map(r => ({
    id: r.id, email: r.email, displayName: r.display_name, disabled: r.disabled_at !== null,
    createdAt: r.created_at.toISOString(), passkeys: Number(r.passkeys), you: r.id === ownerId(c),
  })));
});

adminSecurityRoutes.post('/owners/invite', requireOwner(), async (c) => {
  await limit(c, 'invite-create', ownerId(c), 10, 3600);
  const input = await body(c, z.strictObject({ email: z.string().trim().toLowerCase().email().max(254) }));
  const token = randomToken(32);
  await c.get('db').query(
    `INSERT INTO owner_invites (token_hash, email, created_by, expires_at) VALUES ($1, $2, $3, now() + interval '48 hours')`,
    [await sha256Hex(token), input.email, ownerId(c)]
  );
  await audit(c, 'security.owner_invited', 'success');
  const origin = new URL(c.get('deps').config.passkey.origin).origin;
  return c.json({ inviteUrl: `${origin}/admin/invite#${token}`, expiresInHours: 48 }, 201);
});

adminSecurityRoutes.post('/owners/:id/disable', requireOwner(), async (c) => {
  const target = c.req.param('id');
  if (target === ownerId(c)) fail(400, 'You cannot disable your own account.');
  const db = c.get('db');
  const { rowCount } = await db.query('UPDATE owners SET disabled_at = now() WHERE id = $1 AND disabled_at IS NULL', [target]);
  if (!rowCount) fail(404, 'Owner not found or already disabled.');
  await revokeAllSessions(db, target);
  await audit(c, 'security.owner_disabled', 'success', target);
  return c.json({ ok: true });
});

adminSecurityRoutes.post('/owners/:id/enable', requireOwner(), async (c) => {
  const { rowCount } = await c.get('db').query('UPDATE owners SET disabled_at = NULL WHERE id = $1 AND disabled_at IS NOT NULL', [c.req.param('id')]);
  if (!rowCount) fail(404, 'Owner not found or not disabled.');
  await audit(c, 'security.owner_enabled', 'success', c.req.param('id'));
  return c.json({ ok: true });
});

// ---- activity log
adminSecurityRoutes.get('/activity', requireOwner(), async (c) => {
  const q = z.object({ before: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().min(1).max(200).default(50) }).parse(c.req.query());
  const { rows } = await c.get('db').query<{ id: string; occurred_at: Date; actor: string | null; action: string; target: string | null; result: 'success' | 'failure' }>(
    `SELECT a.id, a.occurred_at, coalesce(nullif(o.display_name, ''), o.email) AS actor, a.action, a.target, a.result
       FROM audit_events a LEFT JOIN owners o ON o.id = a.actor_id
      WHERE ($1::bigint IS NULL OR a.id < $1) ORDER BY a.id DESC LIMIT $2`, [q.before ?? null, q.limit]
  );
  return c.json(rows.map((r): AuditEntry => ({
    id: String(r.id), occurredAt: r.occurred_at.toISOString(), actor: r.actor, action: r.action, target: r.target, result: r.result,
  })));
});

adminSecurityRoutes.post('/logout', requireOwner({ allowRecoverySession: true }), async (c) => {
  await endSession(c);
  return c.json({ ok: true });
});
