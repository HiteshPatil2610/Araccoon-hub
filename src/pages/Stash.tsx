import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, BookmarkPlus, Pencil, Plus, RefreshCw, Share2, Trash2 } from 'lucide-react';
import type { PublicProduct } from '../../shared/types';
import { formatProductCopy } from '../../shared/productCopy';
import { api } from '../lib/api';
import { takeInitialProducts } from '../lib/initialData';
import { useOutbound, type OutboundSource } from '../lib/outbound';
import { useNoIndex, usePageMeta } from '../lib/pageMeta';
import { LIST_MAX, NAME_MAX, cleanName, useStashLists, type StashList } from '../lib/stash';
import { matchShared, parseSharedList, sharedListPath } from '../lib/stashShare';
import { shareLink } from '../lib/share';
import { ProductCard } from '../components/ProductCard';
import { ProductOverlays } from '../components/ProductOverlays';
import { ConfirmDialog } from '../components/Dialog';
import { SectionLabel } from '../components/cine';
import { useToast } from '../components/Toasts';
import { PublicPage } from './Articles';
import { SectionLink } from '../components/SiteChrome';

const FROM_STASH: OutboundSource = { source: 'stash', medium: 'stash_card' };
const FROM_SHARED: OutboundSource = { source: 'shared_list', medium: 'shared_list_card' };

/** The published catalog (embedded in the page when there is one, else from the API), with display copy. */
function useCatalog(): [PublicProduct[] | null, boolean, () => void] {
  const [products, setProducts] = useState<PublicProduct[] | null>(() => takeInitialProducts());
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (products) return;
    let live = true;
    api.products().then(list => { if (live) setProducts(list); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, [products, attempt]);
  const withCopy = useMemo(() => products?.map(p => ({ ...p, ...formatProductCopy(p.title, p.description) })) ?? null, [products]);
  return [withCopy, failed, () => { setFailed(false); setAttempt(a => a + 1); }];
}

function finds(products: PublicProduct[] | null, list: StashList | undefined) {
  if (!products || !list) return { finds: [] as PublicProduct[], missing: 0 };
  const byId = new Map(products.map(p => [p.id, p]));
  const found = list.ids.flatMap(id => { const p = byId.get(id); return p ? [p] : []; });
  return { finds: found, missing: list.ids.length - found.length };
}

const count = (n: number) => `${n} ${n === 1 ? 'find' : 'finds'}`;

// The router keeps the previous page's scroll position, and these pages are often opened from far down the catalog.
function useStartAtTop() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
}

function CatalogFailed({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="panel p-8 max-w-md mx-auto text-center my-12">
      <h2 className="text-4xl">Projector jammed.</h2>
      <p className="text-sm text-muted-fg mt-3 mb-6">We couldn’t load the finds.</p>
      <button type="button" className="btn btn-primary" onClick={retry}><RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again</button>
    </div>
  );
}

/** /stash: the visitor's lists. Pick one to see its finds; rename, share or delete it; start new lists. */
export function StashPage() {
  usePageMeta('Your stash — Raccoon Hub', 'Your saved lists of finds, kept in this browser.');
  useNoIndex();
  useStartAtTop();
  const stash = useStashLists();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [products, failed, retry] = useCatalog();
  const outbound = useOutbound();
  const [quick, setQuick] = useState<PublicProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [rename, setRename] = useState('');
  const [deleting, setDeleting] = useState(false);

  const selected = stash.lists.find(l => l.id === params.get('list')) ?? stash.lists[0]!;
  const select = (id: string) => { setRenaming(false); setParams(id === stash.lists[0]?.id ? {} : { list: id }, { replace: true }); };
  const shown = useMemo(() => finds(products, selected), [products, selected]);

  const create = () => {
    const name = cleanName(newName);
    if (!name) return;
    const id = stash.create(name);
    if (!id) { toast('error', 'That’s 20 lists, the most this browser keeps.'); return; }
    setNewName(''); setCreating(false); select(id);
  };
  const share = () => shareLink(`${window.location.origin}${sharedListPath(selected.name, shown.finds.map(f => f.id))}`, selected.name, toast,
    'Link copied. Anyone with it can see this list; it stays a copy, so your later changes are not shared.');

  return (
    <PublicPage>
      <Link to="/" className="inline-flex items-center gap-2 min-h-11 eyebrow text-muted-fg hover:text-fg"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> All finds</Link>
      <header className="mt-4 border-b border-line pb-6">
        <SectionLabel>Your stash</SectionLabel>
        <h1 className="text-[clamp(56px,9vw,128px)] leading-[.86] mt-4">Your lists</h1>
        <p className="mt-4 text-lg text-muted-fg max-w-[60ch]">Group the finds you like into lists, like “Gift ideas” or “Desk setup”, and share any list as a link. Lists are kept only in this browser: no account, nothing stored on our side.</p>
      </header>

      <div className="stash-lists" role="group" aria-label="Your lists">
        {stash.lists.map(l => (
          <button key={l.id} type="button" aria-pressed={l.id === selected.id} onClick={() => select(l.id)} className={`btn !text-lg ${l.id === selected.id ? 'btn-mint' : ''}`}>
            <span className="truncate max-w-[22ch]">{l.name}</span> <span className="opacity-70">{l.ids.length}</span>
          </button>
        ))}
        {creating ? (
          <form className="stash-lists__new" onSubmit={e => { e.preventDefault(); create(); }}>
            <label htmlFor="new-list-name" className="sr-only">New list name</label>
            <input id="new-list-name" className="field !rounded-full" autoFocus value={newName} maxLength={NAME_MAX} placeholder="Name, e.g. Gift ideas" autoComplete="off"
              onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') { setCreating(false); setNewName(''); } }} />
            <button type="submit" className="btn btn-ink" disabled={!cleanName(newName)}>Create</button>
            <button type="button" className="btn btn-ghost !text-lg !px-2" onClick={() => { setCreating(false); setNewName(''); }}>Cancel</button>
          </form>
        ) : stash.lists.length < LIST_MAX && (
          <button type="button" className="btn btn-ghost !text-lg" onClick={() => setCreating(true)}><Plus className="w-4 h-4" aria-hidden="true" /> New list</button>
        )}
      </div>

      <section aria-labelledby="list-title" className="mt-10">
        <div className="stash-list__head">
          {renaming ? (
            <form className="stash-lists__new" onSubmit={e => { e.preventDefault(); if (cleanName(rename)) { stash.rename(selected.id, rename); setRenaming(false); } }}>
              <label htmlFor="rename-list" className="sr-only">List name</label>
              <input id="rename-list" className="field !rounded-full" autoFocus value={rename} maxLength={NAME_MAX} autoComplete="off"
                onChange={e => setRename(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setRenaming(false); }} />
              <button type="submit" className="btn btn-ink" disabled={!cleanName(rename)}>Save name</button>
              <button type="button" className="btn btn-ghost !text-lg !px-2" onClick={() => setRenaming(false)}>Cancel</button>
            </form>
          ) : (
            <h2 id="list-title" className="text-[clamp(40px,5vw,64px)] leading-[.9] min-w-0 break-words">{selected.name} <span className="font-display text-2xl text-muted-fg align-middle">[{count(shown.finds.length)}]</span></h2>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={!shown.finds.length} onClick={() => void share()}><Share2 className="w-4 h-4" aria-hidden="true" /> Share list</button>
            {!renaming && <button type="button" className="btn" onClick={() => { setRename(selected.name); setRenaming(true); }}><Pencil className="w-4 h-4" aria-hidden="true" /> Rename</button>}
            <button type="button" className="btn" onClick={() => setDeleting(true)}><Trash2 className="w-4 h-4" aria-hidden="true" /> Delete</button>
          </div>
        </div>

        {failed ? <CatalogFailed retry={retry} /> : !products ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-8" aria-busy="true" aria-label="Loading finds">
            {Array.from({ length: Math.min(4, Math.max(1, selected.ids.length)) }, (_, i) => <div key={i} className="panel h-64 sm:h-96 !bg-muted" />)}
          </div>
        ) : shown.finds.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-8">
            {shown.finds.map((p, i) => <ProductCard key={p.id} product={p} index={i} onQuickView={setQuick} />)}
          </div>
        ) : (
          <div className="panel p-10 max-w-xl mx-auto text-center mt-10">
            <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} loading="lazy" decoding="async" draggable={false} className="mx-auto h-32 w-auto mb-4 select-none" />
            <p className="eyebrow text-muted-fg">Empty list .</p>
            <h3 className="text-4xl mt-3">Nothing saved here yet.</h3>
            <p className="text-sm text-muted-fg mt-3">Tap the bookmark on any find and tick “{selected.name}”.</p>
            <SectionLink section="finds" className="btn btn-primary mt-6">Browse the finds</SectionLink>
          </div>
        )}
        {shown.missing > 0 && <p className="mt-6 text-sm text-muted-fg">{count(shown.missing)} in this list {shown.missing === 1 ? 'is' : 'are'} no longer available and {shown.missing === 1 ? 'is' : 'are'} not shown.</p>}
      </section>

      <p className="mt-16 text-xs text-muted-fg">As an Amazon Associate, Raccoon Hub earns from qualifying purchases.</p>
      <ProductOverlays quick={quick} onCloseQuick={() => setQuick(null)} outbound={outbound} from={FROM_STASH} browse={shown.finds} onShow={setQuick} />
      <ConfirmDialog open={deleting} title={`Delete “${selected.name}”?`} confirmLabel="Delete list" danger
        message={<>The list and its name are removed from this browser. Its finds stay in any other list you saved them to.</>}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          const list = selected, at = stash.lists.findIndex(l => l.id === list.id), only = stash.lists.length === 1;
          stash.remove(list.id); setDeleting(false); setParams({}, { replace: true });
          toast('success', `Deleted “${list.name}”.`, { label: 'Undo', run: () => {
            if (!stash.restore(list, at, only)) { toast('error', 'That list could not be brought back.'); return; }
            if (window.location.pathname === '/stash') setParams(at === 0 ? {} : { list: list.id }, { replace: true });
          } });
        }} />
    </PublicPage>
  );
}

/** /stash/shared?name=…&finds=…: a list someone shared. Shows its finds and offers to keep a copy. */
export function SharedListPage() {
  const { search } = useLocation();
  const shared = useMemo(() => parseSharedList(search), [search]);
  usePageMeta(`${shared.name} — a list on Raccoon Hub`, 'A list of finds someone shared from Raccoon Hub.');
  useNoIndex();
  useStartAtTop();
  const stash = useStashLists();
  const toast = useToast();
  const navigate = useNavigate();
  const [products, failed, retry] = useCatalog();
  const outbound = useOutbound();
  const [quick, setQuick] = useState<PublicProduct | null>(null);
  const shown = useMemo(() => (products ? matchShared(products, shared.keys) : { finds: [], missing: 0 }), [products, shared.keys]);

  const keep = () => {
    const id = stash.create(shared.name, shown.finds.map(f => f.id));
    if (!id) { toast('error', 'That’s 20 lists, the most this browser keeps. Delete one first.'); return; }
    toast('success', 'Saved a copy to your lists.');
    navigate(`/stash?list=${id}`);
  };

  return (
    <PublicPage>
      <Link to="/" className="inline-flex items-center gap-2 min-h-11 eyebrow text-muted-fg hover:text-fg"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> All finds</Link>
      <header className="mt-4 border-b border-line pb-6">
        <SectionLabel>A shared list</SectionLabel>
        <h1 className="text-[clamp(48px,8vw,112px)] leading-[.86] mt-4 break-words">{shared.name}</h1>
        <p className="mt-4 text-lg text-muted-fg max-w-[60ch]">Someone picked these finds and shared the list with you. Open any find to see more, or keep a copy in your own lists.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary" disabled={!shown.finds.length} onClick={keep}><BookmarkPlus className="w-4 h-4" aria-hidden="true" /> Save a copy to your lists</button>
          {products && <span className="font-display text-2xl leading-none">[{count(shown.finds.length)}]</span>}
        </div>
      </header>

      {failed ? <CatalogFailed retry={retry} /> : !products ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-10" aria-busy="true" aria-label="Loading finds">
          {Array.from({ length: Math.min(4, Math.max(1, shared.keys.length)) }, (_, i) => <div key={i} className="panel h-64 sm:h-96 !bg-muted" />)}
        </div>
      ) : shown.finds.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-10">
          {shown.finds.map((p, i) => <ProductCard key={p.id} product={p} index={i} onQuickView={setQuick} />)}
        </div>
      ) : (
        <div className="panel p-10 max-w-xl mx-auto text-center mt-10">
          <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} loading="lazy" decoding="async" draggable={false} className="mx-auto h-32 w-auto mb-4 select-none" />
          <h2 className="text-4xl">Nothing to show here.</h2>
          <p className="text-sm text-muted-fg mt-3">This list is empty, or its finds are no longer available.</p>
          <SectionLink section="finds" className="btn btn-primary mt-6">Browse the finds</SectionLink>
        </div>
      )}
      {shown.missing > 0 && shown.finds.length > 0 && <p className="mt-6 text-sm text-muted-fg">{count(shown.missing)} from this list {shown.missing === 1 ? 'is' : 'are'} no longer available.</p>}

      <p className="mt-16 text-xs text-muted-fg">As an Amazon Associate, Raccoon Hub earns from qualifying purchases.</p>
      <ProductOverlays quick={quick} onCloseQuick={() => setQuick(null)} outbound={outbound} from={FROM_SHARED} browse={shown.finds} onShow={setQuick} />
    </PublicPage>
  );
}
