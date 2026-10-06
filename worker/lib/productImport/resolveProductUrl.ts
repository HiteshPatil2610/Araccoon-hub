import { ApiError } from '../../app';
import { identifyProductUrl, type ProductIdentity } from '../../../shared/productImport';
import { isApprovedHost, isShortLink, normalizeAffiliateUrl } from '../../../shared/urlPolicy';

const AMAZON_HOSTS = new Set(['amazon.in', 'www.amazon.in', 'amazon.com', 'www.amazon.com']);
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);
const MAX_HOPS = 5;

const invalidLink = (message: string) => new ApiError(400, 'Please check the product link.', { url: message });

/** Expand approved Amazon redirects only; never download the final product page. */
export async function resolveProductUrl(raw: string, allowedHosts: readonly string[], transport: typeof fetch = fetch): Promise<{ url: string; identity: ProductIdentity }> {
  const normalized = normalizeAffiliateUrl(raw, allowedHosts);
  if (!normalized) throw invalidLink('Use an approved Amazon product link or short link.');
  const direct = identifyProductUrl(normalized, allowedHosts);
  if (direct) return { url: normalized, identity: direct };
  let current = new URL(normalized);
  if (!isShortLink(current.hostname)) throw invalidLink('Use an Amazon.in or Amazon.com product link containing an ASIN, or an Amazon short link.');
  const visited = new Set<string>();
  const signal = AbortSignal.timeout(8_000);
  for (let hop = 0; hop < MAX_HOPS; hop++) {
    if (visited.has(current.href)) throw invalidLink('This short link redirects in a loop. Paste the full Amazon product URL instead.');
    visited.add(current.href);
    let response: Response;
    try {
      response = await transport(current.href, { method: 'GET', redirect: 'manual', headers: { Accept: 'text/html' }, signal });
    } catch {
      throw new ApiError(502, 'Could not expand the Amazon short link. Try again or paste its full product URL.');
    }
    // We only need the redirect header, never the page body.
    await response.body?.cancel();
    if (!REDIRECT_CODES.has(response.status)) throw invalidLink('This short link could not be expanded. Open it in your browser and paste the full product URL.');
    const location = response.headers.get('location');
    if (!location) throw invalidLink('This short link has no destination. Paste the full product URL.');
    let destination: URL;
    try { destination = new URL(location, current); } catch { throw invalidLink('This short link has an invalid destination.'); }
    if (destination.href.length > 2048 || destination.protocol !== 'https:' || destination.username || destination.password || destination.port
      || !isApprovedHost(destination.hostname, allowedHosts) || !(AMAZON_HOSTS.has(destination.hostname) || isShortLink(destination.hostname))) {
      throw invalidLink('This short link redirects outside the supported Amazon domains.');
    }
    const identity = identifyProductUrl(destination.href, allowedHosts);
    if (identity) return { url: destination.href, identity };
    current = destination;
  }
  throw invalidLink('This short link has too many redirects. Paste the full product URL instead.');
}
