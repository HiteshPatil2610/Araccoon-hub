// Web Crypto helpers (identical behaviour in Cloudflare Workers and Node).
const enc = new TextEncoder();

export function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function toHex(buf: ArrayBuffer | Uint8Array): string {
  return [...(buf instanceof Uint8Array ? buf : new Uint8Array(buf))].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function randomToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', enc.encode(input)));
}

export async function sha1Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-1', enc.encode(input)));
}

const keyCache = new Map<string, Promise<CryptoKey>>();
function hmacKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    keyCache.set(secret, key);
  }
  return key;
}

export async function hmacHex(secret: string, message: string | Uint8Array): Promise<string> {
  const data = typeof message === 'string' ? enc.encode(message) : Uint8Array.from(message);
  return toHex(await crypto.subtle.sign('HMAC', await hmacKey(secret), data));
}

/** Constant-time comparison of two hex/ASCII strings. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Recovery codes: 10 groups of 4 from an unambiguous alphabet (~50 bits each),
// formatted XXXX-XXXX-XX… so they are easy to type from a printout.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  let out = '';
  for (let i = 0; i < 12; i++) out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}`;
}
export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
