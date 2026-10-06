import { load } from 'cheerio/slim';
import { ApiError } from '../../../../app';
import { identifyProductUrl, type ProductIdentity } from '../../../../../shared/productImport';
import type { CATEGORIES } from '../../../../../shared/types';
import { formatProductCopy } from '../../../../../shared/productCopy';

const clean = (value: unknown, limit = 2000): string => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f\u200e\u200f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit) : '';

export function amazonImage(raw: unknown): string | undefined {
  if (typeof raw !== 'string' || raw.length > 2048) return;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return;
    if (!['m.media-amazon.com', 'images-na.ssl-images-amazon.com', 'images-eu.ssl-images-amazon.com', 'images-fe.ssl-images-amazon.com'].includes(u.hostname)) return;
    if (!/\.(?:jpe?g|png|webp)(?:$|\?)/i.test(u.pathname)) return;
    return u.href;
  } catch { return; }
}

/** Extract only the requested product, never related products/reviews or executable markup. */
export function extractAmazonPage(html: string, identity: ProductIdentity) {
  const $ = load(html);
  if ($('form[action*="validateCaptcha"], #captchacharacters').length
    || /robot check|sorry, we just need to make sure|enter the characters you see below/i.test($('title').text() + ' ' + $('h4').text())) {
    throw new ApiError(502, 'Amazon blocked automatic fetching with a verification page. Try later or use an authorized product data source.');
  }
  const pageAsin = $('#ASIN').attr('value') || $('input[name="ASIN"]').first().attr('value');
  const canonical = $('link[rel="canonical"]').attr('href');
  const canonicalId = canonical ? identifyProductUrl(canonical, [identity.marketplace]) : null;
  if ((pageAsin && pageAsin.toUpperCase() !== identity.asin) || (canonicalId && (canonicalId.asin !== identity.asin || canonicalId.marketplace !== identity.marketplace))) {
    throw new ApiError(502, 'Amazon returned a different product or variant. Use the exact product link.');
  }
  const products: Record<string, unknown>[] = [];
  const walk = (value: unknown, depth = 0) => {
    if (depth > 8 || !value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.slice(0, 30).forEach(v => walk(v, depth + 1)); return; }
    const obj = value as Record<string, unknown>;
    if (obj['@type'] === 'Product' || (Array.isArray(obj['@type']) && obj['@type'].includes('Product'))) products.push(obj);
    if (obj['@graph']) walk(obj['@graph'], depth + 1);
    if (obj.mainEntity) walk(obj.mainEntity, depth + 1);
  };
  $('script[type="application/ld+json"]').each((_, node) => {
    const text = $(node).text();
    if (text.length > 300_000) return;
    try { walk(JSON.parse(text)); } catch { /* malformed optional metadata */ }
  });
  const structured = products.find(p => {
    const sku = clean(p.sku || p.productID, 100).replace(/^ASIN:/i, '');
    const id = typeof p.url === 'string' ? identifyProductUrl(p.url, [identity.marketplace]) : null;
    return sku.toUpperCase() === identity.asin || (id?.asin === identity.asin && id.marketplace === identity.marketplace);
  });
  const plain = (raw: unknown, limit = 2000) => {
    if (typeof raw !== 'string') return '';
    const fragment = load(`<div>${raw}</div>`);
    fragment('script, style, noscript').remove();
    return clean(fragment.root().text(), limit);
  };
  $('script:not([type="application/ld+json"]), style, noscript').remove();
  const rawTitle = clean($('#productTitle').text() || $('#title_feature_div h1').text() || structured?.name, 4000);
  if (!rawTitle) throw new ApiError(502, 'No product details were found on this Amazon page. The listing may be unavailable or require browser verification.');
  const features = [...new Set($('#feature-bullets li .a-list-item').map((_, node) => clean($(node).text(), 1000)).get()
    .filter(value => value && !/^(make sure this fits|see more product details)/i.test(value)))].slice(0, 12);
  const specs: { name: string; value: string }[] = [];
  const addSpec = (name: string, value: string) => {
    name = clean(name, 80).replace(/:$/, '').trim(); value = clean(value, 500);
    if (!name || !value || specs.length >= 40 || specs.some(s => s.name.toLowerCase() === name.toLowerCase())) return;
    if (/^(customer reviews|best sellers rank|asin|date first available)$/i.test(name)) return;
    specs.push({ name, value });
  };
  $('#productOverview_feature_div tr, #productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr, #productDetails_detailBullets_sections1 tr').each((_, row) => {
    const cells = $(row).find('th, td');
    addSpec(cells.first().text(), cells.eq(1).text());
  });
  $('#detailBullets_feature_div li .a-list-item').each((_, node) => {
    const item = $(node).clone();
    const name = item.find('.a-text-bold').first().text();
    item.find('.a-text-bold').remove();
    addSpec(name, item.text());
  });
  if (Array.isArray(structured?.additionalProperty)) {
    for (const property of structured.additionalProperty.slice(0, 40)) {
      if (!property || typeof property !== 'object') continue;
      const {name, value, unitText} = property as Record<string, unknown>;
      if (typeof name === 'string' && (typeof value === 'string' || typeof value === 'number')) {
        addSpec(name, `${value}${typeof unitText === 'string' ? ` ${unitText}` : ''}`);
      }
    }
  }
  const brandValue = structured?.brand;
  const brand = specs.find(s => /^(brand|manufacturer)$/i.test(s.name))?.value
    || clean(typeof brandValue === 'object' && brandValue ? (brandValue as Record<string, unknown>).name : brandValue, 200);
  const model = specs.find(s => /^(model|model name|item model number|model number)$/i.test(s.name))?.value || clean(structured?.model, 200);
  const imageNode = $('#landingImage, #imgBlkFront, #main-image').first();
  const candidates: unknown[] = [imageNode.attr('data-old-hires')];
  try {
    const dynamic = JSON.parse(imageNode.attr('data-a-dynamic-image') || '{}') as Record<string, unknown>;
    candidates.push(...Object.keys(dynamic));
  } catch { /* optional image map */ }
  candidates.push(imageNode.attr('src'));
  const structuredImages = structured?.image;
  for (const img of (Array.isArray(structuredImages) ? structuredImages.slice(0, 8) : [structuredImages])) {
    candidates.push(typeof img === 'object' && img ? (img as Record<string, unknown>).url : img);
  }
  const imageUrl = candidates.map(amazonImage).find(Boolean);
  const body = clean($('#productDescription').text()) || plain(structured?.description);
  const { title, description } = formatProductCopy(rawTitle, body, specs, features);
  const breadcrumbs = clean($('#wayfinding-breadcrumbs_feature_div').text(), 500).toLowerCase();
  let category: (typeof CATEGORIES)[number] | undefined;
  if (/office products|office supplies|stationery/.test(breadcrumbs)) category = 'Desk & Office';
  else if (/electronics|computers|accessories|mobile phones/.test(breadcrumbs)) category = 'Tech & Gadgets';
  else if (/home & kitchen|home and kitchen|furniture|garden/.test(breadcrumbs)) category = 'Home & Living';
  else if (/toys & games|toys and games|novelty/.test(breadcrumbs)) category = 'Fun & Novelty';
  return { suggestions: { title, ...(description ? { description } : {}), ...(imageUrl ? { imageUrl } : {}), ...(category ? { category } : {}) },
    details: { ...(brand ? { brand } : {}), ...(model ? { model } : {}), features, specifications: specs } };
}
