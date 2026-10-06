import type { ProductImportProvider } from '../contracts';

const cleanText = (text: string) => text.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

/** Formats owner-supplied content. Source references are never fetched. */
export function createOwnerContentProvider(): ProductImportProvider {
  return {
    id: 'owner-content',
    async preview(input, identity) {
      const title = cleanText(input.title);
      const suppliedDescription = cleanText(input.description);
      const features = input.features.map(cleanText).filter(Boolean);
      // Facts remain owner supplied; there is no generated benefit/quality claim.
      const description = suppliedDescription || features.join('; ');
      const warnings = ['Details are supplied by you; Amazon has not verified this content.'];
      if (!title) warnings.push('Add the product title for the exact model and variant.');
      if (!description) warnings.push('Write a short description or supply verified features.');
      warnings.push('Choose your own photo or an image you have permission to use in the editor.');
      return {
        provider: 'owner-content', identity, affiliateUrl: input.url,
        suggestions: { ...(title ? { title } : {}), ...(description ? { description } : {}), ...(input.category ? { category: input.category } : {}) },
        provenance: 'owner-supplied', sourceUrl: input.sourceUrl, warnings,
      };
    },
  };
}
