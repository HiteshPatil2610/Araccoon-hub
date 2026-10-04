import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowUpRight, ArrowUpDown, CheckCircle2, ExternalLink, RefreshCw, X } from 'lucide-react';
import { api } from '../lib/api';
import { featuredProducts } from '../lib/catalog';
import { useOutbound } from '../lib/outbound';
import { useLayoutMorph } from '../lib/useLayoutMorph';
import { Navbar, Footer } from '../components/SiteChrome';
import { ProductImage } from '../components/ProductImage';
import { ProductCard, storeLabel, type BentoVariant } from '../components/ProductCard';
import { Dialog } from '../components/Dialog';
import { Blurb, FilmStrip, Reveal, ScrambleText, SectionLabel, Sticker, TrackingReveal, Viewfinder } from '../components/cine';
import { ClosingSection, Cutout, PicksSection, StorySection } from '../components/StorefrontSections';
import { CATEGORIES, type PublicProduct } from '../../shared/types';

const PATTERN: BentoVariant[] = ['hero', 'standard', 'tall', 'standard', 'wide', 'standard', 'standard', 'wide', 'tall', 'standard'];
type Sort = 'curated' | 'popular' | 'recent' | 'title';

export function Storefront() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? 'All';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState<Sort>('curated');
  const [layout, setLayout] = useState<'bento' | 'classic'>('bento');
  const [products, setProducts] = useState<PublicProduct[] | null>(null);
  const [error, setError] = useState('');
  const [quick, setQuick] = useState<PublicProduct | null>(null);
  const [stripRed, setStripRed] = useState(false);
  const outbound = useOutbound();
  useLayoutMorph(); // glide between layouts when the window changes size

  // Browsing does not depend on analytics availability.
  const load = useCallback(async () => {
    setError('');
    try {
      setProducts(await api.products());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products.');
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // On first scroll the hero film strip turns red and tilts further.
  useEffect(() => {
    const onScroll = () => setStripRed(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c === 'All') next.delete('category'); else next.set('category', c);
    setParams(next, { replace: true });
  };

  const toCatalog = () => {
    const h = document.getElementById('catalog-heading');
    h?.focus({ preventScroll: true });
    h?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  };

  const visible = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    const list = products.filter(p =>
      (category === 'All' || p.category.toLowerCase() === category.toLowerCase()) &&
      (!q || `${p.title} ${p.description} ${p.category}`.toLowerCase().includes(q)));
    if (sort === 'popular') return [...list].sort((a, b) => b.reviewCount - a.reviewCount);
    if (sort === 'recent') return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list; // curated order from the owner (featured, sort order, newest)
  }, [products, category, search, sort]);

  // Picks and Story share one carousel: the owner's featured finds, else the first few in curated order.
  const picks = useMemo(() => {
    const featured = featuredProducts(products ?? []);
    return featured.length ? featured : (products ?? []).slice(0, 3);
  }, [products]);
  const [pickIndex, setPickIndex] = useState(0);
  useEffect(() => { if (pickIndex >= picks.length) setPickIndex(0); }, [picks.length, pickIndex]);

  const variant = (p: PublicProduct, i: number): BentoVariant =>
    layout === 'classic' ? 'standard' : p.featured ? 'hero' : PATTERN[i % PATTERN.length]!;

  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />

      <main className="relative flex-1" id="main" tabIndex={-1}>
        {/* Dark block: hero + picks curtain. Its rounded bottom and pink seam overlap the story section.
            Entrance delays follow the design system's hero cue sheet. */}
        <div className="cd-dark">
          <div className="cd-dark__inner">
            <section id="top" className="cd-hero" data-nav-tone="dark" data-morph-root aria-labelledby="hero-title">
              <Viewfinder size="min(700px, 90vw)" top="58%" />
              <Reveal effect="fade" delay={200} className="cd-hero__meta">
                <div className="cd-hero__tags" role="group" aria-label="Jump to a category" data-morph="move">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" className="cd-tag" aria-pressed={category === c}
                      onClick={() => { setCategory(category === c ? 'All' : c); toCatalog(); }}>{c}</button>
                  ))}
                </div>
                <span className="font-display text-[15px] leading-none pt-1" data-morph="move">
                  Catalog [{error ? 'offline' : products ? <ScrambleText text={`${products.length} finds`} delay={300} /> : 'loading'}]
                </span>
              </Reveal>

              <div className="cd-hero__stage">
                <Reveal effect="pop" delay={150} duration={1000} className="cd-hero__disc" morph />
                <Reveal effect="drop" distance={40} delay={250} className="cd-hero__numeral" morph="type"><span aria-hidden="true">Hub</span></Reveal>
                <TrackingReveal from="0.5em" className="cd-hero__flank cd-hero__flank--l" morph="type"><span aria-hidden="true">Small finds.</span></TrackingReveal>
                <TrackingReveal from="0.5em" delay={160} className="cd-hero__flank cd-hero__flank--r" morph="type"><span aria-hidden="true">Big everyday upgrades.</span></TrackingReveal>
                <TrackingReveal from="0.32em" fromOpacity={0.25} delay={100} duration={1500} className="cd-hero__title" morph="type">
                  <h1 id="hero-title">Raccoon<span className="sr-only"> Hub: small finds, big everyday upgrades.</span></h1>
                </TrackingReveal>
                <Reveal effect="fade" delay={700} className="cd-hero__year" morph="move"><span aria-hidden="true">[{new Date().getFullYear()}]</span></Reveal>
                <Reveal effect="wipe-x" delay={400} duration={1100} className="cd-hero__strip" morph="move">
                  <FilmStrip red={stripRed} tilt={stripRed ? -2.4 : -1} />
                </Reveal>
                <Cutout name="hero" className="cd-hero__raccoon" />
              </div>

              <div className="cd-hero__foot">
                <Reveal effect="rise" distance={30} delay={800} className="flex flex-col gap-4 max-w-[320px]" morph="move">
                  <SectionLabel trail={false}>The Raccoon story</SectionLabel>
                  <Blurb part="A">Desk essentials, clever gadgets and unexpected home finds, hand-picked. Find your next favourite, then view it on Amazon.</Blurb>
                </Reveal>
                <div className="flex items-center gap-6 sm:gap-9">
                  <Reveal effect="rise" distance={30} delay={900} morph="move">
                    <button type="button" className="btn !px-6" onClick={toCatalog}>Browse the finds <ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                  </Reveal>
                  <Reveal effect="spin" delay={1000} duration={1000} className="hidden sm:block" morph><Sticker text="New" spin /></Reveal>
                </div>
              </div>
            </section>

            <PicksSection total={products ? products.length : null} picks={picks} index={pickIndex} onIndex={setPickIndex} onQuick={setQuick} />
          </div>
        </div>

        <StorySection picks={picks} index={pickIndex} onIndex={setPickIndex} onQuick={setQuick} onOpen={outbound.open} pending={outbound.state?.status === 'opening'} />

        <section id="finds" data-nav-tone="light" data-morph-root className="relative max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)] pt-16 sm:pt-24 pb-20 scroll-mt-20">
          <Reveal effect="rise" distance={24} once morph="move"><SectionLabel>The current stash</SectionLabel></Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6 mt-5">
            <TrackingReveal from="0.3em" once morph="type">
              <h2 id="catalog-heading" tabIndex={-1} className="text-[clamp(48px,7vw,104px)] leading-[.86] scroll-mt-28 max-w-[14ch]">Find something for your everyday!</h2>
            </TrackingReveal>
            <span className="font-display text-2xl sm:text-3xl leading-none shrink-0" aria-live="polite" data-morph="move">
              [{error ? 'Catalog unavailable' : products ? `${String(visible.length).padStart(2, '0')} finds` : 'Loading…'}]
            </span>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl" data-morph="move">
              <label htmlFor="catalog-search" className="field-label">Search products</label>
              <div className="flex gap-2">
                <input id="catalog-search" type="search" className="field !rounded-full !px-5" value={search} maxLength={100} placeholder="Search title, description, or category…" onChange={e => setSearch(e.target.value)} />
                {search && <button type="button" className="btn" onClick={() => setSearch('')}>Clear search</button>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2" data-morph="move">
              <label className="flex items-center gap-2 pl-4 pr-3 min-h-11 rounded-full border border-[var(--field-border)]">
                <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Sort</span>
                <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="bg-transparent eyebrow !tracking-[.16em] focus:outline-none min-h-11">
                  <option value="curated">Curated</option>
                  <option value="popular">Most reviewed (owner supplied)</option>
                  <option value="recent">Recently added</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
              <div role="group" aria-label="Catalog layout" className="flex gap-2">{(['bento', 'classic'] as const).map(l => <button key={l} type="button" className={`btn ${layout === l ? 'btn-sun' : ''}`} aria-pressed={layout === l} onClick={() => setLayout(l)}>{l === 'bento' ? 'Bento' : 'Classic'}</button>)}</div>
            </div>
          </div>

          <div className="py-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
            {['All', ...CATEGORIES].map(c => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} data-morph="move"
                className={`btn !text-lg ${category === c ? 'btn-mint' : ''}`}>
                {c === 'All' ? 'All finds' : c}
              </button>
            ))}
          </div>
          {(search || category !== 'All') && (
            <div className="flex flex-wrap items-center gap-3 pb-5 text-sm">
              <p className="text-muted-fg">Filters: {category}{search && ` · “${search}”`}</p>
              <button type="button" className="btn btn-ghost !text-lg !px-2" onClick={() => { setSearch(''); setCategory('All'); }}>Clear filters</button>
            </div>
          )}

          {error ? (
            <div role="alert" className="panel p-8 max-w-md mx-auto text-center my-8">
              <h3 className="text-4xl">Projector jammed.</h3>
              <p className="text-sm text-muted-fg mt-3 mb-6">We couldn’t load the finds. {error}</p>
              <button type="button" className="btn btn-primary" onClick={load}><RefreshCw className="w-4 h-4" /> Try again</button>
            </div>
          ) : !products ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="panel h-96 !bg-muted" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="relative overflow-hidden panel p-12 max-w-xl mx-auto text-center my-8">
              <Viewfinder size={360} light />
              <p className="relative eyebrow text-muted-fg">{products.length ? 'No matches .' : 'Coming soon .'}</p>
              <h3 className="relative text-5xl mt-3">{products.length ? 'No finds match these filters.' : 'New finds are on the way.'}</h3>
              {products.length > 0 && <p className="relative text-sm text-muted-fg mt-4">Try a different search or clear the filters above.</p>}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {visible.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} variant={variant(p, i)} onOpen={outbound.open} onQuickView={setQuick} pending={outbound.state?.status === 'opening'} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        <ClosingSection total={products ? products.length : null} />
      </main>

      <Footer />

      <Dialog open={quick !== null} onClose={() => setQuick(null)} title={quick?.title ?? ''} wide>
        {quick && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="cd-still aspect-square"><ProductImage src={quick.imageUrl} title={quick.title} className="w-full h-full object-contain p-[8%]" /></div>
            <div className="flex flex-col">
              <SectionLabel className="text-muted-fg">{quick.category}</SectionLabel>
              <p className="mt-4 mb-6 text-sm leading-relaxed">{quick.description}</p>
              <button type="button" disabled={outbound.state?.status === 'opening'} className="btn btn-primary btn-bar mt-auto" onClick={() => { void outbound.open(quick); setQuick(null); }}>
                View on {storeLabel(quick.store)} <ArrowUpRight className="w-4 h-4" />
              </button>
              <p className="mt-2 text-xs text-muted-fg">Opens Amazon in a new tab. Prices are set by Amazon.</p>
            </div>
          </div>
        )}
      </Dialog>

      <AnimatePresence>
        {outbound.state && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            role="status" className="fixed bottom-6 left-4 right-4 sm:left-auto sm:w-96 z-50 rounded-[var(--radius-l)] bg-ink-700 text-white shadow-[var(--shadow-card)] px-4 pb-4 pt-6">
            {/* BookingCard notch medallion */}
            <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-red border-[3px] border-ink-700 flex items-center justify-center" aria-hidden="true"><CheckCircle2 className="w-4 h-4" /></span>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="eyebrow text-[var(--cd-gray-300)]">
                  {outbound.state.status === 'opening' ? 'Opening Amazon…' : outbound.state.status === 'opened' ? 'Opened in a new tab' : 'Your browser blocked the new tab'}
                </p>
                <p className="font-display text-2xl leading-none mt-2 truncate">{outbound.state.product.title}</p>
                {outbound.state.status === 'blocked' && outbound.state.url && (
                  <a href={outbound.state.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-bar mt-3">
                    Open on Amazon <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
              <button type="button" disabled={outbound.state.status === 'opening'} onClick={outbound.dismiss} aria-label="Dismiss" className="icon-btn !border-white/40"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
