// Owner password hashing with Web Crypto (same behaviour in Cloudflare Workers and Node).
// PBKDF2-SHA256 with a random per-password salt. The password is first keyed with a
// server-side pepper (HMAC), so a leaked database alone cannot be brute-forced.
// Workers cap PBKDF2 at 100 000 iterations; the count is stored so it can be raised later.
import { hmacHex, safeEqual, toBase64Url } from './crypto';

const ALGORITHM = 'pbkdf2-sha256';
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 128;

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
}

async function derive(password: string, pepper: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyed = await hmacHex(pepper, `password|${password.normalize('NFKC')}`);
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(keyed), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: Uint8Array.from(salt), iterations }, material, HASH_BITS);
  return toBase64Url(new Uint8Array(bits));
}

/** Returns `pbkdf2-sha256$<iterations>$<salt>$<hash>`. */
export async function hashPassword(password: string, pepper: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  return `${ALGORITHM}$${ITERATIONS}$${toBase64Url(salt)}$${await derive(password, pepper, salt, ITERATIONS)}`;
}

// Used when no owner matches, so a wrong email costs the same time as a wrong password.
const DUMMY_SALT = new Uint8Array(SALT_BYTES);

/** Constant-work check; a missing or malformed stored hash still runs one derivation and fails. */
export async function verifyPassword(password: string, stored: string | null, pepper: string): Promise<boolean> {
  const parts = stored?.split('$') ?? [];
  const valid = parts.length === 4 && parts[0] === ALGORITHM && /^\d+$/.test(parts[1]!) && Number(parts[1]) > 0 && Number(parts[1]) <= ITERATIONS;
  if (!valid) {
    await derive(password, pepper, DUMMY_SALT, ITERATIONS);
    return false;
  }
  const actual = await derive(password, pepper, fromBase64Url(parts[2]!), Number(parts[1]));
  return safeEqual(actual, parts[3]!);
}
