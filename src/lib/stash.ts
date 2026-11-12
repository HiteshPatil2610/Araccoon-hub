import { useCallback, useSyncExternalStore } from 'react';

// The visitor's saved finds ("stash"). It lives only in this browser's localStorage:
// no account, nothing sent to the server, and it is not part of any report.

export const STASH_KEY = 'araccoon_stash';
export const STASH_MAX = 100;
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Saved ids from stored text; anything damaged or unexpected reads as an empty stash. */
export function parseStash(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((v): v is string => typeof v === 'string' && ID.test(v)))].slice(0, STASH_MAX);
  } catch {
    return [];
  }
}

/** Adds the find (newest first) or removes it. A full stash drops its oldest entry to make room. */
export function toggleStash(ids: readonly string[], id: string): string[] {
  if (ids.includes(id)) return ids.filter(x => x !== id);
  return [id, ...ids].slice(0, STASH_MAX);
}

let current: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (current) return current;
  try {
    current = parseStash(localStorage.getItem(STASH_KEY));
  } catch {
    current = []; // storage blocked: the stash still works for this visit
  }
  return current;
}

function write(next: string[]) {
  current = next;
  try {
    localStorage.setItem(STASH_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode): keep it in memory for this visit */
  }
  listeners.forEach(notify => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  // Another tab of the site changed the stash.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STASH_KEY) return;
    current = parseStash(e.newValue);
    notify();
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(notify); window.removeEventListener('storage', onStorage); };
}

const EMPTY: string[] = [];

/** The saved find ids (newest first) and a toggle; every component using it stays in sync. */
export function useStash() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => write(toggleStash(read(), id)), []);
  return { ids, toggle };
}
