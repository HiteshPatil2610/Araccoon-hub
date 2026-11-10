import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import type { PublicCollection } from '../../shared/collections';
import type { PublicProduct } from '../../shared/types';
import { formatProductCopy } from '../../shared/productCopy';
import { api, HttpError } from '../lib/api';
import { initialData } from '../lib/initialData';
import { useOutbound, type OutboundSource } from '../lib/outbound';
import { usePageMeta } from '../lib/pageMeta';
import { ProductCard } from '../components/ProductCard';
import { ProductOverlays } from '../components/ProductOverlays';
import { SectionLabel } from '../components/cine';
import { PublicPage } from './Articles';
import { NotFound } from './NotFound';

const FROM_COLLECTION: OutboundSource = { source: 'collection', medium: 'collection_card' };

type Loaded = PublicCollection | 'missing' | 'failed' | null;

/** The collection the Worker embedded for this address, else the API's copy. */
function useCollection(slug: string): [Loaded, () => void] {
  const [collection, setCollection] = useState<Loaded>(() => {
    const embedded = initialData().collection;
    return embedded?.slug === slug ? embedded : null;
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (collection && collection !== 'failed') return;
    let live = true;
    api.collection(slug)
      .then(c => { if (live) setCollection(c); })
      .catch(e => { if (live) setCollection(e instanceof HttpError && e.status === 404 ? 'missing' : 'failed'); });
    return () => { live = false; };
  }, [slug, attempt]); // the first load, and again on Retry
  return [collection, () => { setCollection(null); setAttempt(a => a + 1); }];
}

export function CollectionPage() {
  const { slug = '' } = useParams();
  return <CollectionView key={slug} slug={slug} />;
}

function CollectionView({ slug }: { slug: string }) {
  const [collection, retry] = useCollection(slug);
  const loaded = collection && typeof collection === 'object' ? collection : null;
  usePageMeta(loaded ? `${loaded.title} — Raccoon Hub` : 'Collection — Raccoon Hub', loaded?.description || undefined);
  const products = useMemo(() => (loaded?.products ?? []).map(p => ({ ...p, ...formatProductCopy(p.title, p.description) })), [loaded]);
  const outbound = useOutbound();
  const [quick, setQuick] = useState<PublicProduct | null>(null);
  const open = (p: PublicProduct) => outbound.open(p, FROM_COLLECTION);

  if (collection === 'missing') return <NotFound />;
  return (
    <PublicPage>
      <Link to="/" className="inline-flex items-center gap-2 min-h-11 eyebrow text-muted-fg hover:text-fg"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> All finds</Link>
      {collection === 'failed' ? (
        <div role="alert" className="panel p-8 max-w-md mx-auto text-center my-12">
          <h1 className="text-4xl">Projector jammed.</h1>
          <p className="text-sm text-muted-fg mt-3 mb-6">We couldn’t load this collection.</p>
          <button type="button" className="btn btn-primary" onClick={retry}>Try again</button>
        </div>
      ) : !loaded ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-10" aria-busy="true" aria-label="Loading collection">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="panel h-96 !bg-muted" />)}
        </div>
      ) : (
        <>
          <header className="mt-4 border-b border-line pb-6">
            <SectionLabel>Collection</SectionLabel>
            <h1 className="text-[clamp(56px,9vw,128px)] leading-[.86] mt-4 break-words">{loaded.title}</h1>
            {loaded.description && <p className="mt-4 text-lg text-muted-fg max-w-[60ch]">{loaded.description}</p>}
            <p className="mt-4 font-display text-2xl leading-none">[{String(products.length).padStart(2, '0')} {products.length === 1 ? 'find' : 'finds'}]</p>
          </header>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mt-10">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onOpen={open} onQuickView={setQuick} pending={outbound.state?.status === 'opening'} />
            ))}
          </div>
          <p className="mt-16 text-xs text-muted-fg">As an Amazon Associate, Raccoon Hub earns from qualifying purchases.</p>
        </>
      )}
      <ProductOverlays quick={quick} onCloseQuick={() => setQuick(null)} outbound={outbound} from={FROM_COLLECTION} />
    </PublicPage>
  );
}
