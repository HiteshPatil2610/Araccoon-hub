import type { Device } from '../../shared/types';
import { hmacHex } from './crypto';

// On Cloudflare, CF-Connecting-IP is set by the edge and cannot be forged by
// the client (the Worker is only reachable through Cloudflare). Locally and in
// tests it is simply absent.
export function clientIp(req: Request): string | null {
  return req.headers.get('cf-connecting-ip');
}

export function clientCountry(req: Request): string | null {
  const c = req.headers.get('cf-ipcountry');
  return c && /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1' ? c : null;
}

export function parseDevice(userAgent: string | null): Device {
  if (!userAgent) return 'Desktop';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|windows phone/.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function normalizeReferrer(value: string | null | undefined): string {
  if (!value) return 'direct';
  try {
    return new URL(value).hostname.slice(0, 255) || 'direct';
  } catch {
    return value.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, 255) || 'direct';
  }
}

// Anonymous visitor fingerprint for "visitor-days": keyed by a server secret
// and the calendar day, so it cannot be linked across days or reversed to an
// IP address, and no long-lived identifier is stored.
export async function visitorHash(secret: string, req: Request, day: string): Promise<string> {
  const ip = clientIp(req) ?? 'local';
  const ua = req.headers.get('user-agent') ?? '';
  return (await hmacHex(secret, `visitor|${day}|${ip}|${ua}`)).slice(0, 32);
}

export function reportDate(timeZone: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at);
}
