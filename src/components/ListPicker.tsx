import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router';
import { Bookmark, Plus, X } from 'lucide-react';
import type { PublicProduct } from '../../shared/types';
import { LIST_MAX, NAME_MAX, cleanName, uniqueName, useStashLists } from '../lib/stash';

/**
 * The save button's behaviour, shared by product cards and Quick View: an unsaved find goes straight
 * into the list used last (one tap, like a wishlist heart) and the picker opens so it can go elsewhere too;
 * a saved find opens the picker.
 */
export function useSaveToList(product: PublicProduct) {
  const stash = useStashLists();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const inLists = stash.lists.filter(l => l.ids.includes(product.id));
  const press = () => {
    if (open) { setOpen(false); return; }
    const listId = stash.quickSave(product.id);
    const list = listId ? stash.lists.find(l => l.id === listId) : null;
    setStatus(list ? `Saved to “${list.name}”` : '');
    setOpen(true);
  };
  return { saved: inLists.length > 0, inLists, open, close: () => setOpen(false), press, trigger, status };
}

/** Quick View's save pill and its picker, which opens on a row of its own under the pill. */
export function QuickViewSave({ product }: { product: PublicProduct }) {
  const save = useSaveToList(product);
  const pickerId = useId();
  const label = !save.saved ? 'Save to a list' : save.inLists.length === 1 ? `In “${save.inLists[0]!.name}”` : `In ${save.inLists.length} lists`;
  return (
    <>
      <button ref={save.trigger} type="button" className={`btn ${save.saved ? 'btn-mint' : ''}`} aria-expanded={save.open} aria-controls={save.open ? pickerId : undefined}
        title="Lists are kept in this browser only" onClick={save.press}>
        <Bookmark className="w-4 h-4" aria-hidden="true" fill={save.saved ? 'currentColor' : 'none'} /> <span className="truncate max-w-[16ch]">{label}</span>
      </button>
      {save.open && (
        <div id={pickerId} className="quick-view__picker">
          <ListPicker product={product} onClose={save.close} trigger={save.trigger} status={save.status} />
        </div>
      )}
    </>
  );
}

/**
 * "Save to a list": tick the lists a find belongs in, or start a new one. A small panel, not a
 * dialog, so it also works inside Quick View. Escape, Done and a click outside close it.
 */
export function ListPicker({ product, onClose, trigger, status, className = '' }: {
  product: PublicProduct; onClose: () => void;
  /** The button that opened it: clicks on it are not "outside", and focus goes back to it. */
  trigger: RefObject<HTMLElement | null>;
  /** A first line such as "Saved to Your stash". */
  status?: string; className?: string;
}) {
  const stash = useStashLists();
  const [name, setName] = useState('');
  const [note, setNote] = useState(status ?? '');
  const panel = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const inputId = useId();
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('input[type="checkbox"]')?.focus({ preventScroll: true });
    panel.current?.scrollIntoView({ block: 'nearest' });
  }, []);
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panel.current?.contains(target) || trigger.current?.contains(target)) return;
      close.current();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [trigger]);

  const done = () => { onClose(); trigger.current?.focus(); };
  const add = () => {
    const clean = cleanName(name);
    if (!clean) return;
    const final = uniqueName({ lists: stash.lists, last: stash.last }, clean);
    if (stash.create(clean, [product.id])) {
      setName('');
      setNote(`Saved to “${final}”`);
    }
  };

  return (
    <div ref={panel} className={`list-picker ${className}`} role="group" aria-labelledby={headingId}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(); } }}
      onClick={e => e.stopPropagation()}>
      <div className="list-picker__head">
        <p id={headingId} className="eyebrow">Save to a list</p>
        <button type="button" className="list-picker__close" onClick={done} aria-label="Close"><X className="w-4 h-4" aria-hidden="true" /></button>
      </div>
      {note && <p className="list-picker__status" role="status">{note}</p>}
      <ul className="list-picker__lists">
        {stash.lists.map(l => (
          <li key={l.id}>
            <label className="list-picker__row">
              <input type="checkbox" checked={l.ids.includes(product.id)} onChange={() => { stash.toggle(l.id, product.id); setNote(''); }} />
              <span className="list-picker__name">{l.name}</span>
              <span className="list-picker__count" aria-label={`${l.ids.length} saved`}>{l.ids.length}</span>
            </label>
          </li>
        ))}
      </ul>
      {stash.lists.length < LIST_MAX ? (
        <form className="list-picker__new" onSubmit={e => { e.preventDefault(); add(); }}>
          <label htmlFor={inputId} className="sr-only">New list name</label>
          <input id={inputId} className="field" value={name} maxLength={NAME_MAX} placeholder="New list, e.g. Gift ideas" autoComplete="off" onChange={e => setName(e.target.value)} />
          <button type="submit" className="btn" disabled={!cleanName(name)}><Plus className="w-4 h-4" aria-hidden="true" /> Add</button>
        </form>
      ) : (
        <p className="text-xs text-muted-fg">That’s 20 lists, the most this browser keeps. Delete one on the Your stash page to start another.</p>
      )}
      <div className="list-picker__foot">
        <Link to="/stash" className="list-picker__link" onClick={onClose}>See your lists</Link>
        <button type="button" className="btn list-picker__done" onClick={done}>Done</button>
      </div>
    </div>
  );
}
