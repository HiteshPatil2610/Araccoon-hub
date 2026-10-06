import type { Config } from '../config';
import { isShortLink, normalizeAffiliateUrl } from '../../shared/urlPolicy';
import { resolveProductUrl } from './productImport/resolveProductUrl';

type LinkConfig = Pick<Config, 'allowedHosts' | 'associateTags'>;

/** The configured owner tag takes precedence over any tag embedded in a pasted URL. */
export function applyAssociateTag(raw: string, config: LinkConfig, override?: string | null, subId?: string | null): string {
  const url = new URL(raw);
  const host = url.hostname.replace(/^www\./, '');
  const base = Object.keys(config.associateTags).find(h => h !== '*' && (host === h || host.endsWith(`.${h}`)));
  const tag = override || (base ? config.associateTags[base] : config.associateTags['*']);
  if (tag && !isShortLink(url.hostname)) {
    url.searchParams.set('tag', tag); // set also removes duplicate tag parameters
    url.searchParams.delete('ascsubtag');
    url.searchParams.delete('linkId');
  }
  if (subId) url.searchParams.set('ascsubtag', subId);
  return url.toString();
}

/** Resolve short links before replacing tracking IDs; leave product/variant parameters intact. */
export async function prepareAffiliateLink(raw: string, config: LinkConfig, override?: string | null, subId?: string | null): Promise<string | null> {
  const normalized = normalizeAffiliateUrl(raw, config.allowedHosts);
  if (!normalized) return null;
  const full = isShortLink(new URL(normalized).hostname)
    ? (await resolveProductUrl(normalized, config.allowedHosts)).url
    : normalized;
  return applyAssociateTag(full, config, override, subId);
}
