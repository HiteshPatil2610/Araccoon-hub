import type { PublicProduct } from './types';
import type { SiteText } from './siteText';
import type { CollectionSummary, PublicCollection } from './collections';

// Data the Worker embeds in public pages so the first render needs no API
// round-trip. It travels in <script type="application/json" id="rh-initial">,
// which the browser never executes (the CSP still forbids inline scripts).
export const INITIAL_DATA_ID = 'rh-initial';

export interface InitialData {
  siteText?: SiteText;
  /** Published catalog, only on pages that show it. */
  products?: PublicProduct[];
  /** Published collections, on the storefront. */
  collections?: CollectionSummary[];
  /** The collection a /collections/<slug> page shows. */
  collection?: PublicCollection;
}

// U+2028/U+2029 are valid in JSON but end a line in older JavaScript parsers.
const UNSAFE = new RegExp('[<>&' + String.fromCharCode(0x2028, 0x2029) + ']', 'g');
const hex = (c: string) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0'); // a JSON unicode escape

/** JSON that is safe inside a <script> element: no "</script>", "<!--" or line-separator surprises. */
export function serializeInitialData(data: InitialData): string {
  return JSON.stringify(data).replace(UNSAFE, hex);
}
