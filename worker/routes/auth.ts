import { Hono } from 'hono';
import { z } from 'zod';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { body, fail, ipKey, limit, type AppEnv, type Ctx } from '../app';
import { createSession, endSession, readSession, revokeAllSessions } from '../auth/sessions';
import { audit } from '../lib/audit';
import { generateRecoveryCode, hmacHex, normalizeRecoveryCode, safeEqual, sha256Hex } from '../lib/crypto';
import { clientIp } from '../lib/request';
import type { Db } from '../db/db';
import type { OwnerProfile } from '../../shared/types';

const CHALLENGE_MINUTES = 5;
const RECOVERY_CODE_COUNT = 10;
const email = z.string().trim().toLowerCase().email().max(254);
const responseJson = z.record(z.string(), z.unknown());

// ---------------------------------------------------------------- helpers

async function storeChallenge(db: Db, challenge: string, purpose: 'register' | 'authenticate', ownerId: string | null): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO auth_challenges (challenge, purpose, owner_id, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(mins => $4)) RETURNING id`,
    [challenge, purpose, ownerId, CHALLENGE_MINUTES]
  );
  return rows[0]!.id;
}

/** Single use: the UPDATE succeeds for exactly one caller. */
async function consumeChallenge(db: Db, id: string, purpose: 'register' | 'authenticate') {
  const { rows } = await db.query<{ challenge: string; owner_id: string | null }>(
    `UPDATE auth_challenges SET used_at = now()
      WHERE id = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > now()
      RETURNING challenge, owner_id`,
    [id, purpose]
  );
  if (!rows[0]) fail(400, 'This sign-in attempt expired. Please try again.');
  return rows[0];
}

async function humanCheck(c: Ctx, token: unknown) {
  const ok = await c.get('deps').human.verify(token, clientIp(c.req.raw));
  if (!ok) fail(400, 'Please complete the security check and try again.');
}

export async function registrationOptions(c: Ctx, owner: { id: string; email: string; display_name: string }) {
  const { config } = c.get('deps');
  const db = c.get('db');
  const { rows: existing } = await db.query<{ id: string; transports: string[] }>(
    'SELECT id, transports FROM passkeys WHERE owner_id = $1', [owner.id]
  );
  const options = await generateRegistrationOptions({
    rpName: config.passkey.rpName,
    rpID: config.passkey.rpId,
    userName: owner.email,
    userDisplayName: owner.display_name || owner.email,
    userID: Uint8Array.from(new TextEncoder().encode(owner.id)),
    attestationType: 'none',
    excludeCredentials: existing.map(p => ({ id: p.id, transports: p.transports })),
    authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
  });
  const challengeId = await storeChallenge(db, options.challenge, 'register', owner.id);
  return { challengeId, options };
}

/** Verifies a registration and stores the passkey. Returns the owner id. */
export async function finishRegistration(c: Ctx, challengeId: string, response: unknown, name: string): Promise<string> {
  const { config } = c.get('deps');
  const db = c.get('db');
  const challenge = await consumeChallenge(db, challengeId, 'register');
  if (!challenge.owner_id) fail(400, 'Invalid registration.');
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: response as RegistrationResponseJSON,
      expectedChallenge: challenge.challenge,
      expectedOrigin: config.passkey.origin,
      expectedRPID: config.passkey.rpId,
      requireUserVerification: true,
    });
  } catch {
    fail(400, 'The passkey could not be verified.');
  }
  if (!verification.verified) fail(400, 'The passkey could not be verified.');
  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  await db.query(
    `INSERT INTO passkeys (id, owner_id, public_key, counter, transports, device_type, backed_up, name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [credential.id, challenge.owner_id, Buffer.from(credential.publicKey), credential.counter,
      credential.transports ?? [], credentialDeviceType, credentialBackedUp, name || 'Passkey']
  );
  return challenge.owner_id;
}

/** Replaces all recovery codes for an owner; the plaintext is returned once. */
export async function issueRecoveryCodes(c: Ctx, ownerId: string): Promise<string[]> {
  const { config } = c.get('deps');
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);
  const hashes = await Promise.all(codes.map(code => hmacHex(config.recoveryPepper, `recovery|${normalizeRecoveryCode(code)}`)));
  await c.get('db').tx(async (t) => {
    await t.query('DELETE FROM recovery_codes WHERE owner_id = $1', [ownerId]);
    for (const hash of hashes) {
      await t.query('INSERT INTO recovery_codes (owner_id, code_hash) VALUES ($1, $2)', [ownerId, hash]);
    }
  });
  return codes;
}

export async function ownerProfile(db: Db, ownerId: string, needsPasskey: boolean): Promise<OwnerProfile> {
  const { rows } = await db.query<{ id: string; email: string; display_name: string }>(
    'SELECT id, email, display_name FROM owners WHERE id = $1', [ownerId]
  );
  const o = rows[0]!;
  return { id: o.id, email: o.email, displayName: o.display_name, needsPasskey };
}

async function passkeyCount(db: Db): Promise<number> {
  const { rows } = await db.query<{ n: string }>('SELECT count(*) AS n FROM passkeys');
  return Number(rows[0]!.n);
}

// ----------------------------------------------------------------- routes

export const authRoutes = new Hono<AppEnv>();

// What the sign-in page needs to render.
authRoutes.get('/state', async (c) => {
  const { config } = c.get('deps');
  const session = await readSession(c);
  const setupOpen = Boolean(config.ownerEmail && config.ownerSetupToken) && (await passkeyCount(c.get('db'))) === 0;
  return c.json({
    owner: session ? await ownerProfile(c.get('db'), session.ownerId, session.needsPasskey) : null,
    setupOpen,
    turnstileSiteKey: config.turnstile.siteKey,
    devLogin: config.devLoginToken !== null,
  });
});

// ---- first-owner setup (only while no passkey exists anywhere)
const setupStart = z.strictObject({ email, setupToken: z.string().max(200), turnstileToken: z.string().max(4096).optional() });

authRoutes.post('/setup/options', async (c) => {
  await limit(c, 'setup', ipKey(c), 5, 900);
  const input = await body(c, setupStart);
  await humanCheck(c, input.turnstileToken);
  const { config } = c.get('deps');
  const db = c.get('db');
  if (!config.ownerEmail || !config.ownerSetupToken || (await passkeyCount(db)) > 0) fail(403, 'Setup is closed.');
  if (input.email !== config.ownerEmail || !safeEqual(input.setupToken, config.ownerSetupToken)) {
    await audit(c, 'auth.setup', 'failure');
    fail(403, 'Email or setup token is incorrect.');
  }
  const { rows } = await db.query<{ id: string; email: string; display_name: string }>(
    `INSERT INTO owners (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email, display_name`, [input.email]
  );
  return c.json(await registrationOptions(c, rows[0]!));
});

const finishBody = z.strictObject({ challengeId: z.uuid(), response: responseJson, name: z.string().trim().max(60).default('Passkey') });

authRoutes.post('/setup/verify', async (c) => {
  await limit(c, 'setup', ipKey(c), 5, 900);
  const input = await body(c, finishBody);
  if ((await passkeyCount(c.get('db'))) > 0) fail(403, 'Setup is closed.');
  const ownerId = await finishRegistration(c, input.challengeId, input.response, input.name);
  const recoveryCodes = await issueRecoveryCodes(c, ownerId);
  await createSession(c, ownerId);
  await audit(c, 'auth.setup', 'success', null, ownerId);
  return c.json({ owner: await ownerProfile(c.get('db'), ownerId, false), recoveryCodes });
});

// ---- invited owners
const inviteStart = z.strictObject({ token: z.string().min(20).max(200), turnstileToken: z.string().max(4096).optional() });

authRoutes.post('/invite/options', async (c) => {
  await limit(c, 'invite', ipKey(c), 10, 900);
  const input = await body(c, inviteStart);
  await humanCheck(c, input.turnstileToken);
  const db = c.get('db');
  const { rows: invites } = await db.query<{ email: string }>(
    `SELECT email FROM owner_invites WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [await sha256Hex(input.token)]
  );
  if (!invites[0]) fail(400, 'This invitation is invalid or has expired.');
  const { rows } = await db.query<{ id: string; email: string; display_name: string; disabled_at: string | null }>(
    `INSERT INTO owners (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email, display_name, disabled_at`, [invites[0].email]
  );
  if (rows[0]!.disabled_at) fail(403, 'This account is disabled.');
  return c.json(await registrationOptions(c, rows[0]!));
});

authRoutes.post('/invite/verify', async (c) => {
  await limit(c, 'invite', ipKey(c), 10, 900);
  const input = await body(c, finishBody.extend({ token: z.string().min(20).max(200) }));
  const db = c.get('db');
  const { rowCount } = await db.query(
    `UPDATE owner_invites SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
    [await sha256Hex(input.token)]
  );
  if (rowCount === 0) fail(400, 'This invitation is invalid or has expired.');
  const ownerId = await finishRegistration(c, input.challengeId, input.response, input.name);
  const recoveryCodes = await issueRecoveryCodes(c, ownerId);
  await createSession(c, ownerId);
  await audit(c, 'auth.invite_accepted', 'success', null, ownerId);
  return c.json({ owner: await ownerProfile(db, ownerId, false), recoveryCodes });
});

// ---- passkey sign-in (usernameless: the passkey identifies the owner)
authRoutes.post('/login/options', async (c) => {
  await limit(c, 'login', ipKey(c), 20, 300);
  const input = await body(c, z.strictObject({ turnstileToken: z.string().max(4096).optional() }));
  await humanCheck(c, input.turnstileToken);
  const options = await generateAuthenticationOptions({
    rpID: c.get('deps').config.passkey.rpId,
    userVerification: 'required',
  });
  const challengeId = await storeChallenge(c.get('db'), options.challenge, 'authenticate', null);
  return c.json({ challengeId, options });
});

authRoutes.post('/login/verify', async (c) => {
  await limit(c, 'login', ipKey(c), 20, 300);
  const input = await body(c, z.strictObject({ challengeId: z.uuid(), response: responseJson }));
  const { config } = c.get('deps');
  const db = c.get('db');
  const challenge = await consumeChallenge(db, input.challengeId, 'authenticate');
  const credentialId = typeof input.response.id === 'string' ? input.response.id : '';
  const { rows } = await db.query<{ id: string; owner_id: string; public_key: Buffer; counter: string; transports: string[]; disabled_at: string | null }>(
    `SELECT p.id, p.owner_id, p.public_key, p.counter, p.transports, o.disabled_at
       FROM passkeys p JOIN owners o ON o.id = p.owner_id WHERE p.id = $1`,
    [credentialId.slice(0, 1024)]
  );
  const key = rows[0];
  if (!key || key.disabled_at) {
    await audit(c, 'auth.login', 'failure');
    fail(401, 'This passkey is not recognised.');
  }
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: input.response as unknown as AuthenticationResponseJSON,
      expectedChallenge: challenge.challenge,
      expectedOrigin: config.passkey.origin,
      expectedRPID: config.passkey.rpId,
      requireUserVerification: true,
      credential: { id: key.id, publicKey: new Uint8Array(key.public_key), counter: Number(key.counter), transports: key.transports },
    });
  } catch {
    verification = { verified: false } as const;
  }
  if (!verification.verified) {
    await audit(c, 'auth.login', 'failure', null, key.owner_id);
    fail(401, 'The passkey could not be verified.');
  }
  await db.query('UPDATE passkeys SET counter = $2, last_used_at = now() WHERE id = $1',
    [key.id, verification.authenticationInfo.newCounter]);
  await createSession(c, key.owner_id);
  await audit(c, 'auth.login', 'success', null, key.owner_id);
  return c.json({ owner: await ownerProfile(db, key.owner_id, false) });
});

// ---- recovery code sign-in (lost device). The session can only add a new passkey.
authRoutes.post('/recover', async (c) => {
  const input = await body(c, z.strictObject({ email, code: z.string().max(40), turnstileToken: z.string().max(4096).optional() }));
  await limit(c, 'recover-ip', ipKey(c), 5, 900);
  await limit(c, 'recover-acct', input.email, 5, 3600);
  await humanCheck(c, input.turnstileToken);
  const { config } = c.get('deps');
  const db = c.get('db');
  const hash = await hmacHex(config.recoveryPepper, `recovery|${normalizeRecoveryCode(input.code)}`);
  const { rows } = await db.query<{ owner_id: string }>(
    `UPDATE recovery_codes rc SET used_at = now()
       FROM owners o
      WHERE rc.code_hash = $1 AND rc.used_at IS NULL AND o.id = rc.owner_id
        AND o.email = $2 AND o.disabled_at IS NULL
     RETURNING rc.owner_id`,
    [hash, input.email]
  );
  if (!rows[0]) {
    await audit(c, 'auth.recovery', 'failure');
    fail(401, 'That email and recovery code do not match an unused code.');
  }
  const ownerId = rows[0].owner_id;
  await revokeAllSessions(db, ownerId);
  await createSession(c, ownerId, { needsPasskey: true });
  await audit(c, 'auth.recovery', 'success', null, ownerId);
  return c.json({ owner: await ownerProfile(db, ownerId, true) });
});

authRoutes.post('/logout', async (c) => {
  await endSession(c);
  return c.json({ ok: true });
});

// ---- development-only sign-in for local admin review. Never registered unless
// ENVIRONMENT=development AND DEV_LOGIN_TOKEN is set (config enforces both).
authRoutes.post('/dev-login', async (c) => {
  const { config } = c.get('deps');
  if (config.environment !== 'development' || !config.devLoginToken || !config.ownerEmail) fail(404, 'Not found.');
  const input = await body(c, z.strictObject({ token: z.string().max(200) }));
  if (!safeEqual(input.token, config.devLoginToken)) fail(401, 'Invalid development token.');
  const { rows } = await c.get('db').query<{ id: string }>(
    `INSERT INTO owners (email, display_name) VALUES ($1, 'Local owner') ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
    [config.ownerEmail]
  );
  await createSession(c, rows[0]!.id);
  await audit(c, 'auth.dev_login', 'success', null, rows[0]!.id);
  return c.json({ owner: await ownerProfile(c.get('db'), rows[0]!.id, false) });
});

