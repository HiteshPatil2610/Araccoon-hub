import { ApiError } from '../../../../app';
import { identifyProductUrl, type ProductIdentity } from '../../../../../shared/productImport';
import type { ProductImportProvider } from '../../contracts';
import { extractAmazonPage } from './extract';

const MAX_BYTES = 4 * 1024 * 1024;
const blocked = () => new ApiError(502, 'Amazon did not allow automatic product fetching. Try later or use an authorized product data source.');

async function fetchPage(identity: ProductIdentity, transport: typeof fetch): Promise<string> {
  // Only an exact validated marketplace/ASIN may determine a network target.
  if (!/^[A-Z0-9]{10}$/.test(identity.asin) || !['amazon.in', 'amazon.com'].includes(identity.marketplace)) throw blocked();
  let url = `https://www.${identity.marketplace}/dp/${identity.asin}`;
  const signal = AbortSignal.timeout(8_000);
  for (let hop = 0; hop < 4; hop++) {
    const res = await transport(url, { redirect: 'manual', headers: { Accept: 'text/html', 'Accept-Language': 'en-IN,en;q=0.8', 'User-Agent': 'AraccoonHub/0.1 (owner product preview)' }, signal });
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      await res.body?.cancel();
      const location = res.headers.get('location');
      if (!location) throw blocked();
      const next = new URL(location, url);
      const parsed = identifyProductUrl(next.href, [identity.marketplace]);
      if (next.protocol !== 'https:' || next.username || next.password || next.port || !parsed
        || parsed.asin !== identity.asin || parsed.marketplace !== identity.marketplace) throw blocked();
      url = next.href; continue;
    }
    if (!res.ok || !/text\/html/i.test(res.headers.get('content-type') || '')) { await res.body?.cancel(); throw blocked(); }
    if (Number(res.headers.get('content-length')) > MAX_BYTES) { await res.body?.cancel(); throw new ApiError(502, 'Amazon returned a product page that is too large to import.'); }
    if (!res.body) throw blocked();
    const reader = res.body.getReader();
    let size = 0; let text = ''; const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_BYTES) throw new ApiError(502, 'Amazon returned a product page that is too large to import.');
        text += decoder.decode(value, { stream: true });
      }
      return text + decoder.decode();
    } finally { await reader.cancel(); reader.releaseLock(); }
  }
  throw blocked();
}

export function createAmazonPageProvider(transport: typeof fetch = (...args) => fetch(...args)): ProductImportProvider {
  return {
    id: 'amazon-page',
    async preview(input, identity) {
      let html: string;
      try { html = await fetchPage(identity, transport); }
      catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(502, 'Could not fetch product details from Amazon. Try again shortly.');
      }
      const { suggestions, details } = extractAmazonPage(html, identity);
      const warnings = ['Check the exact model and variant before applying these listing details.'];
      if (!suggestions.description) warnings.push('This page has no readable description or feature bullets.');
      if (!suggestions.imageUrl) warnings.push('No usable product image was found. Choose your own or an authorized image.');
      return { provider: 'amazon-page', identity, affiliateUrl: input.url, suggestions, details,
        provenance: 'product-page', sourceUrl: identity.canonicalUrl, warnings };
    },
  };
}
