import { useCallback, useMemo, useSyncExternalStore } from 'react';

// The visitor's stash: named lists of saved finds ("Your stash", "Gift ideas", "Desk setup"…), like a
// wishlist with collections. A find can sit in several lists. Everything lives only in this browser's
// localStorage: no account, nothing sent to the server, and it is not part of any report. A list can be
// shared as a link that carries its name and finds (see stashShare.ts).

export const LISTS_KEY = 'araccoon_lists';
/** The single stash used before lists existed; read once to seed the first list. */
export const LEGACY_STASH_KEY = 'araccoon_stash';
export const LIST_MAX = 20;
export const LIST_ITEMS_MAX = 100;
export const NAME_MAX = 60;
export const DEFAULT_LIST_NAME = 'Your stash';

export interface StashList { id: string; name: string; ids: string[] } // ids newest first
export interface StashState { lists: StashList[]; last: string } // `last`: the list used most recently

const FIND_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_ID = /^[a-z0-9]{1,16}$/;

/** A list name as plain text: no control characters, single spaces, at most 60 characters. */
export function cleanName(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  // Control and direction-override characters could disguise a shared list's name.
  return raw.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX).trim();
}

const findIds = (value: unknown) => Array.isArray(value)
  ? [...new Set(value.filter((v): v is string => typeof v === 'string' && FIND_ID.test(v)))].slice(0, LIST_ITEMS_MAX)
  : [];

const fresh = (ids: string[] = []): StashState => ({ lists: [{ id: 'stash', name: DEFAULT_LIST_NAME, ids }], last: 'stash' });

/**
 * Lists from stored text. Anything damaged is dropped; with no usable lists the visitor gets one
 * "Your stash" list, seeded from the older single stash when there is one.
 */
export function parseLists(raw: string | null, legacy: string | null = null): StashState {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (value && typeof value === 'object' && Array.isArray((value as StashState).lists)) {
      const seen = new Set<string>();
      const lists: StashList[] = [];
      for (const item of (value as StashState).lists as unknown[]) {
        if (!item || typeof item !== 'object') continue;
        const { id, name, ids } = item as Record<string, unknown>;
        const clean = cleanName(name);
        if (typeof id !== 'string' || !LIST_ID.test(id) || seen.has(id) || !clean) continue;
        seen.add(id);
        lists.push({ id, name: clean, ids: findIds(ids) });
        if (lists.length === LIST_MAX) break;
      }
      if (lists.length) {
        const last = (value as StashState).last;
        return { lists, last: lists.some(l => l.id === last) ? last : lists[0]!.id };
      }
    }
  } catch { /* fall through to a fresh stash */ }
  let old: string[] = [];
  try { old = legacy ? findIds(JSON.parse(legacy)) : []; } catch { /* damaged: start empty */ }
  return fresh(old);
}

/** Every find saved in any list. */
export function savedIds(state: StashState): Set<string> {
  return new Set(state.lists.flatMap(l => l.ids));
}

/** A name not used by another list ("Gift ideas" → "Gift ideas 2"). */
export function uniqueName(state: StashState, name: string, exceptId?: string): string {
  const base = cleanName(name) || 'New list';
  const taken = new Set(state.lists.filter(l => l.id !== exceptId).map(l => l.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let n = 2; ; n++) {
    const suffix = ` ${n}`;
    const candidate = `${base.slice(0, NAME_MAX - suffix.length).trim()}${suffix}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

const withList = (state: StashState, id: string, change: (l: StashList) => StashList): StashState =>
  ({ ...state, lists: state.lists.map(l => (l.id === id ? change(l) : l)) });

/** Puts the find in the list (newest first) or takes it out. A full list drops its oldest find. */
export function toggleInList(state: StashState, listId: string, findId: string): StashState {
  if (!FIND_ID.test(findId) || !state.lists.some(l => l.id === listId)) return state;
  const next = withList(state, listId, l => ({ ...l, ids: l.ids.includes(findId) ? l.ids.filter(x => x !== findId) : [findId, ...l.ids].slice(0, LIST_ITEMS_MAX) }));
  return { ...next, last: listId };
}

/** A new list (optionally holding finds already); refused when there are already 20 lists. */
export function createList(state: StashState, name: string, id: string, ids: readonly string[] = []): StashState | null {
  if (state.lists.length >= LIST_MAX || !LIST_ID.test(id) || state.lists.some(l => l.id === id)) return null;
  return { lists: [...state.lists, { id, name: uniqueName(state, name), ids: findIds([...ids]) }], last: id };
}

export function renameList(state: StashState, id: string, name: string): StashState {
  if (!cleanName(name)) return state;
  return withList(state, id, l => ({ ...l, name: uniqueName(state, name, id) }));
}

/** Removes a list; removing the last one leaves an empty "Your stash", so saving always has somewhere to go. */
export function deleteList(state: StashState, id: string): StashState {
  const lists = state.lists.filter(l => l.id !== id);
  if (!lists.length) return fresh();
  return { lists, last: lists.some(l => l.id === state.last) ? state.last : lists[0]!.id };
}

/**
 * Undo for deleteList: puts the list back where it was. When it was the only list, the empty "Your stash" that
 * replaced it gives way again (unless something was saved there since). Null when it cannot come back
 * (already there, or 20 lists by now); the name is made unique if another list took it meanwhile.
 */
export function restoreList(state: StashState, list: StashList, index: number, wasOnlyList: boolean): StashState | null {
  const only = state.lists[0];
  const placeholder = wasOnlyList && state.lists.length === 1 && only!.id === 'stash' && only!.ids.length === 0 && only!.name === DEFAULT_LIST_NAME;
  const lists = placeholder ? [] : state.lists;
  if (lists.some(l => l.id === list.id) || lists.length >= LIST_MAX) return null;
  const back = { ...list, name: uniqueName({ lists, last: '' }, list.name) };
  const at = Math.min(Math.max(index, 0), lists.length);
  return { lists: [...lists.slice(0, at), back, ...lists.slice(at)], last: placeholder ? list.id : state.last };
}

export const newListId = () => (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(16).slice(2)).replace(/-/g, '').slice(0, 10);

// ---- Shared, in-memory copy kept in step with localStorage and other tabs ----------------------

// Keys of features removed on 12 November 2026 ("New since last visit", "Pick up where you left off").
const RETIRED_KEYS = ['araccoon_last_visit', 'araccoon_recent'];

let current: StashState | null = null;
const listeners = new Set<() => void>();

function read(): StashState {
  if (current) return current;
  try {
    current = parseLists(localStorage.getItem(LISTS_KEY), localStorage.getItem(LEGACY_STASH_KEY));
    for (const key of RETIRED_KEYS) localStorage.removeItem(key);
  } catch {
    current = fresh(); // storage blocked: lists still work for this visit
  }
  return current;
}

function write(next: StashState) {
  current = next;
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(next));
    localStorage.removeItem(LEGACY_STASH_KEY); // now carried by the first list
  } catch {
    /* storage unavailable (private mode): keep it in memory for this visit */
  }
  listeners.forEach(notify => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== LISTS_KEY) return;
    current = parseLists(e.newValue);
    notify();
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(notify); window.removeEventListener('storage', onStorage); };
}

const SERVER = fresh();

/** The visitor's lists and every way to change them; every component using it stays in sync. */
export function useStashLists() {
  const state = useSyncExternalStore(subscribe, read, () => SERVER);
  const saved = useMemo(() => savedIds(state), [state]);
  const toggle = useCallback((listId: string, findId: string) => write(toggleInList(read(), listId, findId)), []);
  /** Saves to the list used last, unless the find is already in a list. Returns that list's id. */
  const quickSave = useCallback((findId: string) => {
    const now = read();
    if (savedIds(now).has(findId)) return null;
    write(toggleInList(now, now.last, findId));
    return now.last;
  }, []);
  /** A new list, holding the given finds; null when the 20-list limit is reached. */
  const create = useCallback((name: string, ids: readonly string[] = []) => {
    const id = newListId();
    const next = createList(read(), name, id, ids);
    if (!next) return null;
    write(next);
    return id;
  }, []);
  const rename = useCallback((id: string, name: string) => write(renameList(read(), id, name)), []);
  const remove = useCallback((id: string) => write(deleteList(read(), id)), []);
  /** Undoes remove(); false when the list could not come back. */
  const restore = useCallback((list: StashList, index: number, wasOnlyList: boolean) => {
    const next = restoreList(read(), list, index, wasOnlyList);
    if (next) write(next);
    return next !== null;
  }, []);
  return { lists: state.lists, last: state.last, saved, toggle, quickSave, create, rename, remove, restore };
}
