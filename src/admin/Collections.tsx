import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { api, HttpError } from '../lib/api';
import { PageHeader } from './AdminLayout';
import { ConfirmDialog, Dialog } from '../components/Dialog';
import { ProductImage } from '../components/ProductImage';
import { useToast } from '../components/Toasts';
import { MAX_COLLECTION_PRODUCTS, collectionInputSchema, collectionPath, type Collection } from '../../shared/collections';
import type { Product } from '../../shared/types';

type Form = { title: string; description: string; status: Collection['status']; sortOrder: string; productIds: string[] };
const EMPTY: Form = { title: '', description: '', status: 'draft', sortOrder: '0', productIds: [] };
const fromCollection = (c: Collection): Form => ({ title: c.title, description: c.description, status: c.status, sortOrder: String(c.sortOrder), productIds: c.productIds });

/** Owner page for themed lists of finds, each published at /collections/<slug>. */
export function Collections() {
  const toast = useToast();
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Collection | 'new' | null>(null);
  const [confirm, setConfirm] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [list, all] = await Promise.all([api.adminCollections(), api.adminProducts()]);
      setCollections(list);
      setProducts(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load collections.');
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const liveCount = (c: Collection) => c.productIds.filter(id => byId.get(id)?.status === 'published').length;

  const saved = (c: Collection, created: boolean) => {
    setCollections(list => (created ? [...(list ?? []), c] : (list ?? []).map(x => (x.id === c.id ? c : x))).sort((a, b) => a.sortOrder - b.sortOrder));
    setEditing(null);
    toast('success', created ? 'Collection added.' : 'Collection saved. The live site updates within a minute.');
  };

  const remove = async () => {
    if (!confirm || deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.deleteCollection(confirm.id);
      setCollections(list => (list ?? []).filter(x => x.id !== confirm.id));
      setConfirm(null);
      toast('success', 'Collection deleted. Its finds are untouched.');
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Collections" subtitle="Themed lists of finds, each with its own page. A collection shows on the site once it is published and has at least one published find."
        actions={<>
          <button type="button" className="btn !px-3" onClick={load} aria-label="Reload"><RefreshCw className="w-4 h-4" /></button>
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> New collection</button>
        </>} />

      {error ? (
        <div role="alert" className="panel p-6 text-center"><p className="font-bold mb-3">{error}</p><button type="button" className="btn btn-sun" onClick={load}>Try again</button></div>
      ) : !collections ? (
        <div className="space-y-3" aria-busy="true">{Array.from({ length: 3 }, (_, i) => <div key={i} className="panel h-20" />)}</div>
      ) : collections.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="font-bold">No collections yet.</p>
          <p className="text-sm text-muted-fg mt-2">Group a few finds under a theme, such as “Desk upgrades” or “Gifts under the radar”.</p>
          <button type="button" className="btn btn-primary mt-4" onClick={() => setEditing('new')}><Plus className="w-4 h-4" /> Make your first collection</button>
        </div>
      ) : (
        <ul className="panel overflow-hidden">
          {collections.map(c => {
            const live = liveCount(c);
            const visible = c.status === 'published' && live > 0;
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-line last:border-0">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-bold break-words">{c.title}</p>
                  <p className="text-xs text-muted-fg [overflow-wrap:anywhere]">{collectionPath(c.slug)} · {c.productIds.length} {c.productIds.length === 1 ? 'find' : 'finds'}{live !== c.productIds.length ? ` (${live} published)` : ''}</p>
                </div>
                <span className={`chip ${visible ? '!bg-sky !text-on-sky !border-line' : ''}`}>{visible ? 'On the site' : c.status === 'published' ? 'Published, no live finds' : 'Draft'}</span>
                <div className="flex gap-1 ml-auto">
                  {visible && <a className="btn btn-ghost !px-2" href={collectionPath(c.slug)} target="_blank" rel="noopener" aria-label={`View ${c.title} on the site`}><ExternalLink className="w-4 h-4" /></a>}
                  <button type="button" className="btn btn-ghost !px-2" aria-label={`Edit ${c.title}`} onClick={() => setEditing(c)}><Pencil className="w-4 h-4" /></button>
                  <button type="button" className="btn btn-ghost !px-2 text-danger" aria-label={`Delete ${c.title}`} onClick={() => setConfirm(c)}><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && <CollectionEditor key={editing === 'new' ? 'new' : editing.id} collection={editing === 'new' ? null : editing} products={products} onClose={() => setEditing(null)} onSaved={saved} />}
      <ConfirmDialog open={confirm !== null} title={`Delete “${confirm?.title ?? ''}”?`} danger busy={deleting} confirmLabel="Delete collection"
        message={<>This removes the collection and its page. The finds in it stay in your store. {deleteError && <p role="alert" className="field-error mt-3">{deleteError}</p>}</>}
        onClose={() => { setConfirm(null); setDeleteError(''); }} onConfirm={remove} />
    </>
  );
}

function CollectionEditor({ collection, products, onClose, onSaved }: {
  collection: Collection | null; products: Product[]; onClose: () => void; onSaved: (c: Collection, created: boolean) => void;
}) {
  const initial = useMemo(() => (collection ? fromCollection(collection) : EMPTY), [collection]);
  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [search, setSearch] = useState('');
  const busy = useRef(false);
  const summaryRef = useRef<HTMLParagraphElement>(null);

  const byId = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const chosen = form.productIds.flatMap(id => { const p = byId.get(id); return p ? [p] : []; });
  const available = useMemo(() => {
    const q = search.trim().toLowerCase();
    const picked = new Set(form.productIds);
    return products.filter(p => !picked.has(p.id) && p.status !== 'archived' && (!q || `${p.title} ${p.category}`.toLowerCase().includes(q)));
  }, [products, form.productIds, search]);
  const full = form.productIds.length >= MAX_COLLECTION_PRODUCTS;
  const changed = JSON.stringify(form) !== JSON.stringify(initial);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  const move = (index: number, by: -1 | 1) => setForm(f => {
    const ids = [...f.productIds];
    const [id] = ids.splice(index, 1);
    ids.splice(index + by, 0, id!);
    return { ...f, productIds: ids };
  });

  const requestClose = () => { if (saving) return; if (changed) setDiscard(true); else onClose(); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy.current) return;
    const parsed = collectionInputSchema.safeParse({ title: form.title, description: form.description, status: form.status, sortOrder: Number(form.sortOrder), productIds: form.productIds });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0] ?? 'form')] ??= issue.message;
      setErrors(next);
      requestAnimationFrame(() => (document.querySelector<HTMLElement>('[data-collection-form] [aria-invalid="true"]') ?? summaryRef.current)?.focus());
      return;
    }
    busy.current = true;
    setSaving(true);
    setErrors({});
    try {
      onSaved(collection ? await api.updateCollection(collection.id, parsed.data) : await api.createCollection(parsed.data), !collection);
    } catch (err) {
      setErrors(err instanceof HttpError && Object.keys(err.fields).length ? err.fields : { form: err instanceof Error ? err.message : 'Could not save.' });
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const fieldProps = (k: string) => ({ id: `c-${k}`, 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `ce-${k}` : undefined });
  const err = (k: string) => errors[k] && <p id={`ce-${k}`} className="field-error">{errors[k]}</p>;
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <Dialog open={!discard} busy={saving} onClose={requestClose} title={collection ? 'Edit collection' : 'New collection'} wide>
        <form onSubmit={submit} noValidate className="space-y-4 min-w-0" data-collection-form>
          {hasErrors && <p ref={summaryRef} tabIndex={-1} role="alert" className="panel-sm !bg-coral text-on-coral p-3 text-sm font-bold">{errors.form ?? 'Please check the highlighted fields.'}</p>}
          <div>
            <label htmlFor="c-title" className="field-label">Title</label>
            <input {...fieldProps('title')} className="field" maxLength={80} placeholder="Desk upgrades" value={form.title} onChange={e => set('title', e.target.value)} />
            {collection
              ? <p className="mt-1 text-sm text-muted-fg break-all">Page address: {collectionPath(collection.slug)} (stays the same if you rename it, so shared links keep working).</p>
              : <p className="mt-1 text-sm text-muted-fg">The page address is made from this title when you save, and does not change afterwards.</p>}
            {err('title')}
          </div>
          <div>
            <label htmlFor="c-description" className="field-label">Description (optional)</label>
            <textarea {...fieldProps('description')} rows={2} className="field" maxLength={300} value={form.description} onChange={e => set('description', e.target.value)} />
            <p className="mt-1 text-sm text-muted-fg">One or two sentences, shown under the title and in link previews. {form.description.length}/300</p>
            {err('description')}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="c-status" className="field-label">Status</label>
              <select {...fieldProps('status')} className="field" value={form.status} onChange={e => set('status', e.target.value as Form['status'])}>
                <option value="draft">Draft (hidden)</option>
                <option value="published">Published</option>
              </select>
              {err('status')}
            </div>
            <div>
              <label htmlFor="c-sortOrder" className="field-label">Order on the site</label>
              <input {...fieldProps('sortOrder')} type="number" step={1} className="field" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} />
              {err('sortOrder')}
            </div>
          </div>

          <fieldset className="min-w-0 border-t border-line pt-4">
            <legend className="text-lg font-bold">Finds in this collection <span className="text-sm font-normal text-muted-fg">{form.productIds.length}/{MAX_COLLECTION_PRODUCTS}</span></legend>
            {err('productIds')}
            {chosen.length === 0 ? (
              <p className="text-sm text-muted-fg mt-2">None yet. Add finds from the list below; they appear on the page in this order.</p>
            ) : (
              <ol className="mt-2 panel-sm overflow-hidden">
                {chosen.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2 border-b border-line last:border-0">
                    <span className="eyebrow text-muted-fg w-6 shrink-0" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <ProductImage src={p.imageUrl} title={p.title} compact className="w-10 h-10 shrink-0 rounded border border-line object-contain bg-muted" />
                    <span className="min-w-0 flex-1 text-sm font-semibold break-words">{p.title}{p.status !== 'published' && <span className="chip ml-2">{p.status}: hidden</span>}</span>
                    <button type="button" className="btn btn-ghost !px-2" disabled={i === 0} aria-label={`Move ${p.title} up`} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" className="btn btn-ghost !px-2" disabled={i === chosen.length - 1} aria-label={`Move ${p.title} down`} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></button>
                    <button type="button" className="btn btn-ghost !px-2" aria-label={`Remove ${p.title} from this collection`} onClick={() => set('productIds', form.productIds.filter(id => id !== p.id))}><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ol>
            )}

            <label htmlFor="c-search" className="field-label mt-4">Add a find</label>
            <input id="c-search" type="search" className="field" placeholder="Search your products…" value={search} onChange={e => setSearch(e.target.value)} />
            {full ? (
              <p className="text-sm text-muted-fg mt-2">This collection is full ({MAX_COLLECTION_PRODUCTS} finds).</p>
            ) : available.length === 0 ? (
              <p className="text-sm text-muted-fg mt-2">{!products.length ? 'Add products first, then group them here.' : search.trim() ? 'No other products match.' : 'Every product is already in this collection.'}</p>
            ) : (
              <ul className="mt-2 panel-sm max-h-64 overflow-y-auto" aria-label="Products you can add">
                {available.map(p => (
                  <li key={p.id} className="flex items-center gap-3 px-3 py-2 border-b border-line last:border-0">
                    <ProductImage src={p.imageUrl} title={p.title} compact className="w-10 h-10 shrink-0 rounded border border-line object-contain bg-muted" />
                    <span className="min-w-0 flex-1 text-sm break-words">{p.title} <span className="text-muted-fg">· {p.category}{p.status !== 'published' ? ` · ${p.status}` : ''}</span></span>
                    <button type="button" className="btn !min-h-11" aria-label={`Add ${p.title}`} onClick={() => set('productIds', [...form.productIds, p.id])}><Plus className="w-4 h-4" /> Add</button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-line pt-4">
            <button type="button" className="btn" disabled={saving} onClick={requestClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : collection ? 'Save collection' : 'Add collection'}</button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog open={discard} title="Discard your changes?" danger confirmLabel="Discard changes"
        message="This collection has changes that are not saved yet."
        onClose={() => setDiscard(false)} onConfirm={onClose} />
    </>
  );
}
