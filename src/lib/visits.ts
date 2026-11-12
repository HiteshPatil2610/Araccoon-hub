import { useCallback, useSyncExternalStore } from 'react';

// Return-visit extras. Like the stash, everything lives only in this browser:
// nothing is sent to the server and nothing is part of any report.

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---- New since your last visit -------------------------------------------------------------

export const LAST_VISIT_KEY = 'araccoon_last_visit';
const SINCE_KEY = 'araccoon_visit_since'; // sessionStorage: the previous visit, fixed for this visit

/** A stored timestamp, or null when missing or damaged. */
export function parseVisit(raw: string | null): string | null {
  if (!raw || raw.length > 40) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** Finds added after the previous visit; none on a first visit, when everything would count as new. */
export function newSince<T extends { createdAt: string }>(finds: readonly T[], since: string | null): T[] {
  if (!since) return [];
  const t = Date.parse(since);
  return finds.filter(p => Date.parse(p.createdAt) > t);
}

let since: string | null | undefined;

/**
 * When this browser last visited, before the current visit. A visit is a browser session: the
 * answer stays the same across reloads and pages until the tab is closed, so "new" marks do not
 * vanish on refresh. Blocked storage simply means nothing is marked new.
 */
export function previousVisit(now = new Date()): string | null {
  if (since !== undefined) return since;
  try {
    const kept = sessionStorage.getItem(SINCE_KEY);
    if (kept !== null) return (since = parseVisit(kept));
    since = parseVisit(localStorage.getItem(LAST_VISIT_KEY));
    sessionStorage.setItem(SINCE_KEY, since ?? 'none');
    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
  } catch {
    since = null;
  }
  return since;
}

// ---- Pick up where you left off ------------------------------------------------------------

export const RECENT_KEY = 'araccoon_recent';
export const RECENT_MAX = 12;

/** Recently opened find ids from stored text; anything damaged reads as none. */
export function parseRecent(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((v): v is string => typeof v === 'string' && ID.test(v)))].slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

/** Moves the find to the front (newest first) and keeps the list bounded. */
export function addRecent(ids: readonly string[], id: string): string[] {
  if (!ID.test(id)) return [...ids];
  return [id, ...ids.filter(x => x !== id)].slice(0, RECENT_MAX);
}

let recent: string[] | null = null;
const listeners = new Set<() => void>();

function readRecent(): string[] {
  if (recent) return recent;
  try {
    recent = parseRecent(localStorage.getItem(RECENT_KEY));
  } catch {
    recent = [];
  }
  return recent;
}

function writeRecent(next: string[]) {
  recent = next;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep it in memory for this visit */
  }
  listeners.forEach(notify => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== RECENT_KEY) return;
    recent = parseRecent(e.newValue);
    notify();
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(notify); window.removeEventListener('storage', onStorage); };
}

const EMPTY: string[] = [];

/** Recently opened find ids (newest first), with `record` and `clear`. */
export function useRecent() {
  const ids = useSyncExternalStore(subscribe, readRecent, () => EMPTY);
  const record = useCallback((id: string) => { if (readRecent()[0] !== id) writeRecent(addRecent(readRecent(), id)); }, []);
  const clear = useCallback(() => writeRecent([]), []);
  return { ids, record, clear };
}
