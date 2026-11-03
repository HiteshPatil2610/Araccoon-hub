import { INITIAL_DATA_ID, type InitialData } from '../../shared/initialData';
import type { PublicProduct } from '../../shared/types';

let cached: InitialData | null = null;
let productsTaken = false;

/** The data the Worker embedded in this page, or {} (static fallback, dev without the Worker). */
export function initialData(): InitialData {
  if (cached) return cached;
  cached = {};
  try {
    const text = document.getElementById(INITIAL_DATA_ID)?.textContent;
    if (text) cached = JSON.parse(text) as InitialData;
  } catch {
    // Ignore a damaged payload; pages fall back to the API.
  }
  return cached;
}

/**
 * The embedded catalog, handed out once: it describes the page as first
 * loaded, so later visits within the app fetch fresh data instead.
 */
export function takeInitialProducts(): PublicProduct[] | null {
  if (productsTaken) return null;
  productsTaken = true;
  return initialData().products ?? null;
}
