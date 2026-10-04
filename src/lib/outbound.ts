import { useCallback, useRef, useState } from 'react';
import { api } from './api';
import type { PublicProduct } from '../../shared/types';

export type OutboundState = { product: PublicProduct; url: string | null; status: 'opening' | 'opened' | 'blocked' } | null;

/**
 * Opens a product on Amazon in a new tab and records the click once.
 * The tab is opened synchronously inside the click (so popup blockers allow
 * it), then pointed at the destination after the beacon returns. If the beacon
 * fails, the tab goes through /r/:id with the same clickKey (server dedupes).
 * If the popup was blocked, the toast offers an explicit link instead.
 */
export function useOutbound() {
  const [state, setState] = useState<OutboundState>(null);
  const busy = useRef(false);

  const open = useCallback(async (product: PublicProduct) => {
    if (busy.current) return;
    busy.current = true;
    const clickKey = crypto.randomUUID();
    setState({ product, url: null, status: 'opening' });
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    let url = api.redirectUrl(product.id, clickKey);
    try {
      const res = await api.track({ productId: product.id, clickKey, utmSource: 'storefront', utmMedium: 'product_card', referrer: document.referrer || undefined });
      url = res.destinationUrl;
    } catch {
      /* fall back to the server redirect (also records the click) */
    }
    if (tab && !tab.closed) {
      tab.location.href = url;
      setState({ product, url, status: 'opened' });
    } else {
      setState({ product, url, status: 'blocked' });
    }
    busy.current = false;
  }, []);

  return { state, open, dismiss: () => setState(null) };
}
