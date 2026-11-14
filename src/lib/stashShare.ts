import { cleanName, LIST_ITEMS_MAX } from './stash';

// A shared list travels entirely in its link: the name and the first 8 characters of each find's id
// (the same short id the /find/ addresses use). Nothing is stored on the server, so the link is the list.

export const SHARED_PATH = '/stash/shared';
const KEY = /^[0-9a-f]{8}$/;

/** The address that shows this list to someone else. */
export function sharedListPath(name: string, findIds: readonly string[]): string {
  const keys = [...new Set(findIds.map(id => id.slice(0, 8).toLowerCase()))].filter(k => KEY.test(k)).slice(0, LIST_ITEMS_MAX);
  const params = new URLSearchParams({ name: cleanName(name) || 'Shared list', finds: keys.join('.') });
  return `${SHARED_PATH}?${params.toString()}`;
}

/** The name and find keys from a shared link's query string; anything malformed is dropped. */
export function parseSharedList(search: string): { name: string; keys: string[] } {
  const params = new URLSearchParams(search);
  const keys = [...new Set((params.get('finds') ?? '').toLowerCase().split('.').filter(k => KEY.test(k)))].slice(0, LIST_ITEMS_MAX);
  return { name: cleanName(params.get('name')) || 'Shared list', keys };
}

/** The published finds a shared link names, in the sender's order, and how many are no longer available. */
export function matchShared<T extends { id: string }>(products: readonly T[], keys: readonly string[]): { finds: T[]; missing: number } {
  const byKey = new Map(products.map(p => [p.id.slice(0, 8).toLowerCase(), p]));
  const finds = keys.flatMap(k => { const p = byKey.get(k); return p ? [p] : []; });
  return { finds, missing: keys.length - finds.length };
}
