import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowRight, ArrowUpDown, Dices, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { initialData, takeInitialProducts } from '../lib/initialData';
import { useSiteText } from '../lib/siteText';
import { usePageMeta } from '../lib/pageMeta';
import { featuredProducts, findOfTheDay, pickSurprise, siteDay } from '../lib/catalog';
import { useOutbound } from '../lib/outbound';
import { useLayoutMorph } from '../lib/useLayoutMorph';
import { useHeroHandoff } from '../lib/useHeroHandoff';
import { Navbar, Footer, Announcement } from '../components/SiteChrome';
import { ProductCard } from '../components/ProductCard';
import { Blurb, CharacterStagger, FilmStrip, HERO_CUES, HeroBlackout, HeroDisc, HeroEntrance, HeroMetadata, PosterTitle, Reveal, SectionLabel, Sticker, TrackingReveal, Viewfinder, usePrefersReducedMotion } from '../components/cine';
import { Cutout, PicksSection, StorySection } from '../components/StorefrontSections';
import { CATEGORIES, type PublicProduct } from '../../shared/types';
import { formatProductCopy } from '../../shared/productCopy';
import { TIERS, TIER_LABELS, isTier } from '../../shared/productFacts';
import { ProductOverlays } from '../components/ProductOverlays';
import { useToast } from '../components/Toasts';
import { DailyFind } from '../components/DailyFind';
import { findBySlug, findPath } from '../../shared/finds';
import { collectionPath, type CollectionSummary } from '../../shared/collections';
import { ProductImage } from '../components/ProductImage';
import { useSettled } from '../lib/useSettled';

type Sort = 'curated' | 'popular' | 'recent' | 'title';

const withCopy = (list: PublicProduct[] | null) => list?.map(p => ({ ...p, ...formatProductCopy(p.title, p.description) })) ?? null;

export function Storefront() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? 'All';
  const tierParam = params.get('tier');
  const tier = isTier(tierParam) ? tierParam : null;
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState<Sort>('curated');
  // The visitor's saved lists (this browser only). Ids of finds that are no longer published simply match nothing.
  const text = useSiteText();
  // The Worker embeds the catalog in the page, so the first render needs no fetch.
  const [products, setProducts] = useState<PublicProduct[] | null>(() => withCopy(takeInitialProducts()));
  const [error, setError] = useState('');
  // Collections are an extra: if they cannot be loaded the catalog simply shows without them.
  const [collections, setCollections] = useState<CollectionSummary[] | null>(() => initialData().collections ?? null);
  useEffect(() => {
    if (collections) return;
    let live = true;
    api.collections().then(list => { if (live) setCollections(list); }).catch(() => { if (live) setCollections([]); });
    return () => { live = false; };
  }, [collections]);
  // Quick view lives in the address (/find/<slug>), so an open find can be shared, reloaded and closed with Back.
  const findSlugParam = useMatch('/find/:slug')?.params.slug;
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const quick = useMemo(() => (findSlugParam && products ? findBySlug(products, findSlugParam) : null), [findSlugParam, products]);
  usePageMeta(quick ? `${quick.title} — Raccoon Hub` : text.seoTitle, quick ? quick.pickNote || text.seoDescription : text.seoDescription);
  const setQuick = useCallback((p: PublicProduct) => {
    navigate({ pathname: findPath(p), search: location.search }, { state: { inApp: true }, preventScrollReset: true });
  }, [navigate, location.search]);
  const closeQuick = useCallback(() => {
    // Opened from this page: Back returns to where the visitor was. Arrived by link: the storefront replaces it.
    if ((location.state as { inApp?: boolean } | null)?.inApp) navigate(-1);
    else navigate({ pathname: '/', search: location.search }, { replace: true, preventScrollReset: true });
  }, [navigate, location.state, location.search]);
  const missingFind = useRef<string | null>(null); // say it once per address, even if the effect re-runs
  useEffect(() => {
    if (!findSlugParam || !products || quick) return;
    if (missingFind.current !== findSlugParam) toast('error', 'That find is no longer available.');
    missingFind.current = findSlugParam;
    navigate({ pathname: '/', search: location.search }, { replace: true, preventScrollReset: true });
  }, [findSlugParam, products, quick, toast, navigate, location.search]);
  // The search is kept in the address (?q=) once typing pauses, so reloading, sharing or coming back keeps it.
  // Not while Quick View is open: its address carries navigation state that replacing the search would drop.
  const settledSearch = useSettled(search.trim(), 500);
  useEffect(() => {
    if (findSlugParam || (params.get('q') ?? '') === settledSearch) return;
    const next = new URLSearchParams(params);
    if (settledSearch) next.set('q', settledSearch); else next.delete('q');
    setParams(next, { replace: true, preventScrollReset: true });
  }, [settledSearch, findSlugParam, params, setParams]);
  const handoffRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  useHeroHandoff(handoffRef, reducedMotion);
  const outbound = useOutbound();
  useLayoutMorph(); // glide between layouts when the window changes size

  // Browsing does not depend on analytics availability.
  const load = useCallback(async () => {
    setError('');
    try {
      setProducts(withCopy(await api.products()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load products.');
    }
  }, []);
  const embedded = useRef(products !== null);
  useEffect(() => { if (!embedded.current) void load(); }, [load]);

  const setCategory = (c: string) => {
    const next = new URLSearchParams(params);
    if (c === 'All') next.delete('category'); else next.set('category', c);
    setParams(next, { replace: true });
  };
  const setTier = (t: string | null) => {
    const next = new URLSearchParams(params);
    if (t) next.set('tier', t); else next.delete('tier');
    setParams(next, { replace: true, preventScrollReset: true });
  };
  // One update for both, so the second does not overwrite the first with stale parameters.
  const clearFilters = () => {
    setSearch('');
    const next = new URLSearchParams(params);
    next.delete('category');
    next.delete('tier');
    setParams(next, { replace: true, preventScrollReset: true });
  };

  // On phones the category pills are one sideways-scrolling row: keep the chosen one in view (e.g. picked in the hero or footer).
  const categoryRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = categoryRow.current;
    const pill = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !pill || row.scrollWidth <= row.clientWidth) return;
    const left = pill.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft, right = left + pill.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth - 40) row.scrollTo({ left: Math.max(0, left - 16), behavior: 'instant' });
  }, [category]);

  const toCatalog = () => {
    const h = document.getElementById('catalog-heading');
    h?.focus({ preventScroll: true });
    h?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  };

  const day = useMemo(() => siteDay(), []);
  const daily = useMemo(() => findOfTheDay(products ?? [], day), [products, day]);
  const visible = useMemo(() => {
    if (!products) return [];
    const q = search.trim().toLowerCase();
    const list = products.filter(p =>
      (category === 'All' || p.category.toLowerCase() === category.toLowerCase()) &&
      (!tier || p.tier === tier) &&
      (!q || `${p.title} ${p.description} ${p.category} ${p.brand ?? ''} ${p.productType ?? ''}`.toLowerCase().includes(q)));
    if (sort === 'popular') return [...list].sort((a, b) => b.reviewCount - a.reviewCount);
    if (sort === 'recent') return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list; // curated order from the owner (featured, sort order, newest)
  }, [products, category, tier, search, sort]);
  // The tier pills only appear once the owner has given at least one find a tier.
  const hasTiers = useMemo(() => (products ?? []).some(p => p.tier), [products]);
  // Screen readers hear the result count once typing pauses, not after every key.
  const announcedCount = useSettled(error ? 'Catalog unavailable' : products ? `${visible.length} ${visible.length === 1 ? 'find' : 'finds'}` : '', 600);

  // "Surprise me": a random find from what the filters show (or the whole catalog when they show nothing).
  const surprised = useRef(new Set<string>());
  const inSurprise = Boolean((location.state as { surprise?: boolean } | null)?.surprise);
  const surprise = useCallback(() => {
    const pick = pickSurprise(visible.length ? visible : products ?? [], surprised.current, quick?.id ?? null);
    if (!pick) return;
    // "Another one" swaps the open find in place, so Back still returns to the catalog in one step.
    navigate({ pathname: findPath(pick), search: location.search }, { state: { inApp: true, surprise: true }, replace: quick !== null, preventScrollReset: true });
  }, [visible, products, quick, navigate, location.search]);
  const canSurprise = (products?.length ?? 0) > (quick ? 1 : 0);
  // Previous / next follow what the catalog shows; a find opened from outside it (a link, a surprise) steps through the whole catalog.
  const browse = useMemo(() => (quick && visible.some(p => p.id === quick.id) ? visible : products ?? []), [quick, visible, products]);
  // Swaps the open find in place, keeping how it was opened, so Back and close still leave Quick View in one step.
  const showFind = useCallback((p: PublicProduct) => {
    const inApp = Boolean((location.state as { inApp?: boolean } | null)?.inApp);
    navigate({ pathname: findPath(p), search: location.search }, { state: { inApp }, replace: true, preventScrollReset: true });
  }, [navigate, location.state, location.search]);

  // Picks and Story share one carousel: the owner's featured finds, else the first few in curated order.
  const picks = useMemo(() => {
    const featured = featuredProducts(products ?? []);
    return featured.length ? featured : (products ?? []).slice(0, 3);
  }, [products]);
  const [pickIndex, setPickIndex] = useState(0);
  useEffect(() => { if (pickIndex >= picks.length) setPickIndex(0); }, [picks.length, pickIndex]);

  return (
    <HeroEntrance>
    <div className="cd-storefront relative min-h-screen flex flex-col">
      <Navbar />

      <main className="relative flex-1" id="main" tabIndex={-1}>
        {/* Dark block: hero + picks curtain. Its rounded bottom and pink seam overlap the story section.
            Entrance delays follow the design system's hero cue sheet. */}
        <div className="cd-dark">
          <div className="cd-dark__inner cd-handoff" ref={handoffRef}>
            <section id="top" className="cd-hero" data-nav-tone="dark" data-morph-root aria-labelledby="hero-title">
              <HeroBlackout />
              <HeroMetadata>
                <div className="cd-hero__tags" role="group" aria-label="Jump to a category" data-morph="move">
                  {CATEGORIES.map(c => (
                    <button key={c} type="button" className="cd-tag" aria-label={c} aria-pressed={category === c}
                      onClick={() => { setCategory(category === c ? 'All' : c); toCatalog(); }}>{c}</button>
                  ))}
                </div>
                <span className="font-display text-[15px] leading-none pt-1" data-morph="move">
                  Catalog [{error ? 'offline' : products ? `${products.length} finds` : 'loading'}]
                </span>
              </HeroMetadata>

              <div className="cd-hero__composition">
                <div className="cd-hero__stage">
                  <HeroDisc />
                  <div className="cd-hero__numeral" data-morph="type" aria-hidden="true"><CharacterStagger text="Hub" delay={HERO_CUES.hub} stagger={100} followWave /></div>
                  <div className="cd-hero__flank cd-hero__flank--l" data-morph="move"><CharacterStagger text={text.heroLineA} delay={HERO_CUES.captions} stagger={48} /><CharacterStagger text={text.heroLineB} delay={HERO_CUES.captions + 80} stagger={48} /></div>
                  <div className="cd-hero__flank cd-hero__flank--r" data-morph="move"><CharacterStagger text={text.heroLineC} delay={HERO_CUES.captions + 160} stagger={48} /><CharacterStagger text={text.heroLineD} delay={HERO_CUES.captions + 240} stagger={48} /></div>
                  <div className="cd-hero__title" data-morph="type">
                    <PosterTitle id="hero-title" text="Raccoon" label="Raccoon Hub: small finds, big everyday upgrades." />
                  </div>
                  <Reveal hero effect="fade" delay={HERO_CUES.year} duration={900} once className="cd-hero__year" morph="move"><span aria-hidden="true">[{new Date().getFullYear()}]</span></Reveal>
                  <div className="cd-hero__strip">
                    <FilmStrip tilt={-1} entrance />
                  </div>
                </div>

                <div className="cd-hero__foot">
                  <Reveal hero effect="rise" distance={18} delay={HERO_CUES.story} duration={900} once className="flex flex-col gap-4 max-w-[320px]" morph="move">
                    <SectionLabel trail={false}>The Raccoon story</SectionLabel>
                    <Blurb part="A">{text.heroBlurb}</Blurb>
                  </Reveal>
                  <div className="flex items-center gap-6 sm:gap-9">
                    <Reveal hero effect="grow-rise" distance={12} delay={HERO_CUES.cta} duration={800} once className="cd-hero__action" style={{ transformOrigin: 'center bottom' }} morph="move">
                      <button type="button" className="btn !px-6" onClick={toCatalog}>Browse the finds <ArrowDown className="w-4 h-4" aria-hidden="true" /></button>
                    </Reveal>
                    <Reveal hero effect="grow-rise" distance={12} delay={HERO_CUES.badge} duration={800} once className="hidden sm:block" style={{ transformOrigin: 'center bottom' }} morph><Sticker text="New" /></Reveal>
                  </div>
                </div>
                <Cutout name="hero" className="cd-hero__raccoon" />
              </div>
            </section>

            <PicksSection total={products ? products.length : null} picks={picks} index={pickIndex} onIndex={setPickIndex} onQuick={setQuick} />
          </div>
        </div>

        <StorySection picks={picks} index={pickIndex} onIndex={setPickIndex} onQuick={setQuick} onOpen={outbound.open} pending={outbound.state?.status === 'opening'} />

        <section id="finds" data-nav-tone="light" data-morph-root className="cd-catalog relative max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)] pt-16 sm:pt-24 pb-20 scroll-mt-20">
          <Reveal effect="rise" distance={24} once morph="move"><SectionLabel>The current stash</SectionLabel></Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line pb-6 mt-5">
            <TrackingReveal from="0.3em" once morph="type">
              <h2 id="catalog-heading" tabIndex={-1} className="text-[clamp(48px,7vw,104px)] leading-[.86] scroll-mt-4 max-w-[14ch]">Find something for your everyday!</h2>
            </TrackingReveal>
            <span className="sr-only" aria-live="polite">{announcedCount}</span>
            <span className="font-display text-2xl sm:text-3xl leading-none shrink-0" aria-hidden="true" data-morph="move">
              [{error ? 'Catalog unavailable' : products ? `${String(visible.length).padStart(2, '0')} finds` : 'Loading…'}]
            </span>
          </div>

          {daily && (
            <div className="catalog-extras" data-morph="move">
              <DailyFind find={daily} day={day} onOpen={setQuick} />
            </div>
          )}

          {collections && collections.length > 0 && (
            <nav aria-labelledby="collections-heading" className="mt-8" data-morph="move">
              <h3 id="collections-heading" className="eyebrow text-muted-fg">Collections</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map(col => (
                  <li key={col.id}>
                    <Link to={collectionPath(col.slug)} className="collection-card panel paper">
                      {col.coverImageUrl && <ProductImage src={col.coverImageUrl} title={col.title} compact className="w-16 h-16 shrink-0 rounded-[var(--radius-m)] bg-white object-contain p-1" />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-2xl leading-none break-words">{col.title}</span>
                        <span className="block text-sm text-muted-fg mt-1">{col.productCount} {col.productCount === 1 ? 'find' : 'finds'}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0 max-w-2xl" data-morph="move">
              <label htmlFor="catalog-search" className="field-label">Search products</label>
              <div className="flex flex-wrap gap-2">
                <input id="catalog-search" type="search" className="field field-search min-w-0 flex-1 basis-48 !rounded-full !px-5" value={search} maxLength={100} placeholder="Search title, description, or category…"
                  enterKeyHint="search" onChange={e => setSearch(e.target.value)}
                  // On touch screens Enter closes the keyboard so the results show; keyboard users keep their place.
                  onKeyDown={e => { if (e.key === 'Enter' && matchMedia('(pointer: coarse)').matches) e.currentTarget.blur(); }} />
                {search && <button type="button" className="btn" onClick={() => setSearch('')}>Clear search</button>}
              </div>
            </div>
            <div className="min-w-0 flex flex-wrap items-center gap-2" data-morph="move">
              <label className="sort-pill flex flex-1 basis-40 sm:flex-none sm:basis-auto max-w-full items-center gap-2 pl-4 pr-3 min-h-11 rounded-full border border-[var(--field-border)]">
                <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Sort</span>
                <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="min-w-0 w-full sm:w-auto max-w-full bg-transparent eyebrow !tracking-[.16em] focus:outline-none min-h-11">
                  <option value="curated">Curated</option>
                  <option value="popular">Most reviewed (owner supplied)</option>
                  <option value="recent">Recently added</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
              <button type="button" className="btn" disabled={!products?.length} onClick={surprise}><Dices className="w-4 h-4" aria-hidden="true" /> Surprise me</button>
            </div>
          </div>

          <div ref={categoryRow} className="category-row py-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by category">
            {['All', ...CATEGORIES].map(c => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} data-morph="move"
                className={`btn !text-lg ${category === c ? 'btn-mint' : ''}`}>
                {c === 'All' ? 'All finds' : c}
              </button>
            ))}
          </div>
          {(hasTiers || tier) && (
            <div className="category-row tier-row pb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tier">
              <button type="button" aria-pressed={!tier} onClick={() => setTier(null)} className={`btn ${tier ? '' : 'btn-mint'}`}>Any tier</button>
              {TIERS.map(t => (
                <button key={t} type="button" aria-pressed={tier === t} onClick={() => setTier(tier === t ? null : t)} className={`btn ${tier === t ? 'btn-mint' : ''}`}>{TIER_LABELS[t]}</button>
              ))}
            </div>
          )}
          {(search || category !== 'All' || tier) && (
            <div className="flex flex-wrap items-center gap-3 pb-5 text-sm">
              <p className="text-muted-fg">Filters: {category}{tier && ` · ${TIER_LABELS[tier]}`}{search && ` · “${search}”`}</p>
              <button type="button" className="btn btn-ghost !text-lg !px-2" onClick={clearFilters}>Clear filters</button>
            </div>
          )}

          {error ? (
            <div role="alert" className="panel p-8 max-w-md mx-auto text-center my-8">
              <h3 className="text-4xl">Projector jammed.</h3>
              <p className="text-sm text-muted-fg mt-3 mb-6">We couldn’t load the finds. {error}</p>
              <button type="button" className="btn btn-primary" onClick={load}><RefreshCw className="w-4 h-4" /> Try again</button>
            </div>
          ) : !products ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-3 sm:gap-5" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 8 }, (_, i) => <div key={i} className="panel h-64 sm:h-96 !bg-muted" />)}
            </div>
          ) : visible.length === 0 ? (
            <div className="relative overflow-hidden panel p-12 max-w-xl mx-auto text-center my-8">
              <Viewfinder size={360} light />
              {products.length > 0 && <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} loading="lazy" decoding="async" draggable={false} className="relative mx-auto h-36 w-auto mb-4 select-none" />}
              <p className="relative eyebrow text-muted-fg">{products.length ? 'No matches .' : 'Coming soon .'}</p>
              <h3 className="relative text-5xl mt-3">{products.length ? 'The raccoon came back with an empty box.' : text.emptyCatalog}</h3>
              {products.length > 0 && <>
                <p className="relative text-sm text-muted-fg mt-4">No finds match these filters. Try a different search, clear the filters above, or let the raccoon choose.</p>
                <button type="button" className="relative btn btn-primary mt-6" onClick={surprise}><Dices className="w-4 h-4" aria-hidden="true" /> Surprise me</button>
              </>}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-3 sm:gap-5">
              <AnimatePresence mode="popLayout">
                {visible.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} onQuickView={setQuick} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

      </main>

      <Footer />
      <Announcement />

      <ProductOverlays quick={quick} onCloseQuick={closeQuick} outbound={outbound} surprise={inSurprise} onSurprise={canSurprise ? surprise : undefined} browse={browse} pool={products ?? []} onShow={showFind} />
    </div>
    </HeroEntrance>
  );
}
