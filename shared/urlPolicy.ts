// Trusted outbound-destination policy, shared by the admin form (instant
// feedback) and the API (authoritative). A base host matches itself and its
// subdomains (www.amazon.in, smile.amazon.com); short-link hosts match exactly.
// Comparison is on the parsed hostname — never substring — so lookalikes such
// as amazon.com.evil.example, evilamazon.com or evil.example/amzn.to fail.

export const SHORT_LINK_HOSTS = new Set(['amzn.to', 'amzn.in', 'amzn.eu', 'a.co']);
export const MAX_URL_LENGTH = 2048;

export function parseHostList(raw: string | undefined, fallback = 'amazon.com,amazon.in,amzn.to,amzn.in'): string[] {
  return (raw || fallback).split(',').map(h => h.trim().toLowerCase().replace(/\.$/, '')).filter(Boolean);
}

export function isApprovedHost(hostname: string, allowed: readonly string[]): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return allowed.some(base => host === base || (!SHORT_LINK_HOSTS.has(base) && host.endsWith(`.${base}`)));
}

export function isShortLink(hostname: string): boolean {
  return SHORT_LINK_HOSTS.has(hostname.toLowerCase());
}

// Returns a normalized https URL, or null when the destination is not
// trusted. Scheme-less input and http:// are upgraded to https; anything else
// (other schemes, credentials, non-default ports, unapproved hosts, malformed
// or overlong input) is rejected.
export function normalizeAffiliateUrl(raw: unknown, allowed: readonly string[]): string | null {
  if (typeof raw !== 'string') return null;
  let value = raw.trim();
  if (!value || value.length > MAX_URL_LENGTH) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol === 'http:') url.protocol = 'https:';
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
  if (!isApprovedHost(url.hostname, allowed)) return null;
  const href = url.toString();
  return href.length <= MAX_URL_LENGTH ? href : null;
}
