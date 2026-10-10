import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AlertTriangle, Copy, ExternalLink, Pencil, Plus, RefreshCw, Search, Star, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from './AdminLayout';
import { ProductEditor } from './ProductEditor';
import { ConfirmDialog } from '../components/Dialog';
import { ProductImage } from '../components/ProductImage';
import { useToast } from '../components/Toasts';
import type { Product, ProductStatus } from '../../shared/types';

const TABS: { key: 'all' | ProductStatus; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'published', label: 'Live' }, { key: 'draft', label: 'Drafts' }, { key: 'archived', label: 'Archived' },
];
const STATUS_CHIP: Record<ProductStatus, string> = { published: '!bg-mint !text-on-mint', draft: '!bg-sun !text-on-sun', archived: '!bg-muted' };

export function Products() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('status') as 'all' | ProductStatus) ?? 'all';
  const onlyBroken = params.get('broken') === '1';
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Product | null>(null);
  const [editorOpen, setEditorOpen] = useState(params.get('new') === '1');
  const [confirm, setConfirm] = useState<{ ids: string[]; label: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const busyRef = useRef(false);
  const duplicating = useRef(new Set<string>());

  const load = useCallback(async () => {
    setError('');
    try {
      setProducts(await api.adminProducts());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products.');
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products ?? []).filter(p =>
      (tab === 'all' || p.status === tab) && (!onlyBroken || !p.linkHealthy) &&
      (!q || `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q)));
  }, [products, tab, search, onlyBroken]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: products?.length ?? 0 };
    for (const p of products ?? []) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [products]);

  const setTab = (key: string) => {
    const next = new URLSearchParams();
    if (key !== 'all') next.set('status', key);
    setParams(next, { replace: true });
    setSelected(new Set());
  };
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allChecked = visible.length > 0 && visible.every(p => selected.has(p.id));

  const bulk = async (action: Parameters<typeof api.bulkProducts>[1], ids = [...selected]) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMutationError('');
    try {
      const { affected } = await api.bulkProducts(ids, action);
      toast('success', `${affected} product${affected === 1 ? '' : 's'} updated.`);
      setSelected(new Set());
      setConfirm(null);
      await load();
    } catch (e) {
      setMutationError(e instanceof Error ? e.message : 'The change failed. Try again.');
      toast('error', e instanceof Error ? e.message : 'Bulk action failed.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const saved = (p: Product) => {
    setProducts(list => {
      const rest = (list ?? []).filter(x => x.id !== p.id);
      return editing ? (list ?? []).map(x => (x.id === p.id ? p : x)) : [p, ...rest];
    });
    toast('success', editing ? 'Product saved.' : 'Product added.');
  };

  const duplicate = async (p: Product) => {
    if (duplicating.current.has(p.id)) return;
    duplicating.current.add(p.id);
    try {
      const copy = await api.duplicateProduct(p.id);
      setProducts(list => [copy, ...(list ?? [])]);
      toast('success', 'Duplicated as a draft.');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Could not duplicate.');
    } finally { duplicating.current.delete(p.id); }
  };

  return (
    <>
      <PageHeader title="Products" subtitle="Everything in the store. Drafts and archived items are hidden from visitors."
        actions={<>
          <button type="button" className="btn !px-3" onClick={load} aria-label="Reload"><RefreshCw className="w-4 h-4" /></button>
          <button type="button" className="btn btn-primary" onClick={() => { setEditing(null); setEditorOpen(true); }}><Plus className="w-4 h-4" /> Add product</button>
        </>} />

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Product status">
          {TABS.map(t => (
            <button key={t.key} type="button" aria-pressed={tab === t.key} onClick={() => setTab(t.key)}
              className={`btn !text-lg whitespace-nowrap ${tab === t.key ? 'btn-sun' : ''}`}>
              {t.label} <span className="opacity-70">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" aria-hidden="true" />
          <input type="search" aria-label="Search products" className="field !pl-9" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {onlyBroken && (
        <p className="panel-sm !bg-coral text-on-coral p-3 text-sm font-bold mb-4 flex items-center justify-between gap-3">
          Showing products whose Amazon link can't be opened. <button type="button" className="underline" onClick={() => setTab(tab)}>Show all</button>
        </p>
      )}

      {selected.size > 0 && (
        <div className="sticky top-16 lg:top-2 z-20 panel !bg-sky text-on-sky p-3 mb-4 flex flex-wrap items-center gap-2" role="region" aria-label="Bulk actions">
          <span className="font-black text-sm mr-2">{selected.size} selected</span>
          <button type="button" className="btn !min-h-11" disabled={busy} onClick={() => bulk('publish')}>Publish</button>
          <button type="button" className="btn !min-h-11" disabled={busy} onClick={() => bulk('draft')}>To draft</button>
          <button type="button" className="btn !min-h-11" disabled={busy} onClick={() => bulk('feature')}>Feature</button>
          <button type="button" className="btn !min-h-11" disabled={busy} onClick={() => bulk('unfeature')}>Unfeature</button>
          <button type="button" className="btn !min-h-11" disabled={busy} onClick={() => bulk('archive')}>Archive</button>
          <button type="button" className="btn btn-danger !min-h-11" disabled={busy} onClick={() => setConfirm({ ids: [...selected], label: `${selected.size} products` })}>Delete</button>
          <button type="button" className="btn btn-ghost !min-h-11 ml-auto" onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {error ? (
        <div role="alert" className="panel p-6 text-center"><p className="font-bold mb-3">{error}</p><button type="button" className="btn btn-sun" onClick={load}>Try again</button></div>
      ) : !products ? (
        <div className="space-y-3" aria-busy="true">{Array.from({ length: 5 }, (_, i) => <div key={i} className="panel h-20 " />)}</div>
      ) : visible.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="font-bold">{products.length ? 'Nothing matches these filters.' : 'No products yet.'}</p>
          {!products.length && <button type="button" className="btn btn-primary mt-4" onClick={() => setEditorOpen(true)}><Plus className="w-4 h-4" /> Add your first find</button>}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div className="hidden xl:grid grid-cols-[40px_64px_minmax(0,1fr)_100px_80px_188px] gap-3 items-center px-4 py-2 border-b border-line eyebrow bg-muted">
            <label className="flex items-center justify-center w-10 min-h-11 -my-1 cursor-pointer">
              <input type="checkbox" aria-label="Select all visible" className="w-5 h-5" checked={allChecked}
                onChange={() => setSelected(allChecked ? new Set() : new Set(visible.map(p => p.id)))} />
            </label>
            <span /> <span>Product</span> <span>Status</span> <span>Link</span> <span className="text-right">Actions</span>
          </div>
          <ul>
            {visible.map(p => (
              <li key={p.id} className="grid grid-cols-[40px_56px_1fr] xl:grid-cols-[40px_64px_minmax(0,1fr)_100px_80px_188px] gap-3 items-center px-4 py-3 border-b border-line last:border-0">
                <label className="flex items-center justify-center w-10 min-h-11 cursor-pointer">
                  <input type="checkbox" aria-label={`Select ${p.title}`} className="w-5 h-5" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                </label>
                <ProductImage src={p.imageUrl} title={p.title} compact className="w-14 h-14 md:w-16 md:h-16 rounded border border-line object-contain bg-muted" />
                <div className="min-w-0">
                  <p className="font-bold flex items-start gap-1.5 break-words">{p.featured && <Star className="w-4 h-4 fill-current text-fg shrink-0" aria-label="Featured" />}{p.title}</p>
                  <p className="text-xs text-muted-fg truncate">{p.category} · {p.store}{p.badge ? ` · ${p.badge}` : ''}</p>
                  <div className="flex xl:hidden gap-2 mt-1 flex-wrap">
                    <span className={`chip ${STATUS_CHIP[p.status]}`}>{p.status}</span>
                    {!p.linkHealthy && <span className="chip !bg-coral !text-on-coral">Link blocked</span>}
                  </div>
                </div>
                <span className={`hidden xl:inline-flex chip justify-self-start ${STATUS_CHIP[p.status]}`}>{p.status}</span>
                <span className="hidden xl:inline-flex">
                  {p.linkHealthy ? <span className="chip !bg-sky !text-on-sky !border-line">OK</span> : <span className="chip !bg-coral !text-on-coral" title="Not an approved Amazon host"><AlertTriangle className="w-3 h-3" /> Blocked</span>}
                </span>
                <div className="col-span-3 xl:col-span-1 flex gap-1 justify-end">
                  <button type="button" className="btn btn-ghost !px-2" aria-label={`Edit ${p.title}`} onClick={() => { setEditing(p); setEditorOpen(true); }}><Pencil className="w-4 h-4" /></button>
                  <button type="button" className="btn btn-ghost !px-2" aria-label={`Duplicate ${p.title}`} onClick={() => duplicate(p)}><Copy className="w-4 h-4" /></button>
                  <a className="btn btn-ghost !px-2" href={`/r/${p.id}?utm_source=owner_test`} target="_blank" rel="noopener noreferrer" aria-label={`Test link for ${p.title} (not counted)`}><ExternalLink className="w-4 h-4" /></a>
                  <button type="button" className="btn btn-ghost !px-2 text-danger" aria-label={`Delete ${p.title}`} onClick={() => setConfirm({ ids: [p.id], label: `“${p.title}”` })}><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ProductEditor open={editorOpen} product={editing} onClose={() => { setEditorOpen(false); setEditing(null); }} onSaved={saved} />
      <ConfirmDialog open={confirm !== null} title={`Delete ${confirm?.label ?? 'product'}?`} danger busy={busy} confirmLabel="Delete product"
        message={<>This removes {confirm?.label} from the store. Past click history is kept. <strong>Tip:</strong> archive instead if you might bring it back. {mutationError && <p role="alert" className="field-error mt-3">{mutationError}</p>}</>}
        onClose={() => { setConfirm(null); setMutationError(''); }} onConfirm={() => confirm && bulk('delete', confirm.ids)} />
    </>
  );
}
