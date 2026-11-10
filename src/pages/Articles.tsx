import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Rss } from 'lucide-react';
import { ARTICLES } from '../../shared/generated/articles';
import { ARTICLES_FEED_PATH, articlePath, formatArticleDate, type Article } from '../../shared/articles';
import type { PublicProduct } from '../../shared/types';
import { formatProductCopy } from '../../shared/productCopy';
import { api } from '../lib/api';
import { takeInitialProducts } from '../lib/initialData';
import { useOutbound, type OutboundSource } from '../lib/outbound';
import { usePageMeta } from '../lib/pageMeta';
import { Navbar, Footer, Announcement } from '../components/SiteChrome';
import { ProductCard } from '../components/ProductCard';
import { ProductOverlays } from '../components/ProductOverlays';
import { SectionLabel, Viewfinder } from '../components/cine';
import { NotFound } from './NotFound';

const FROM_ARTICLE: OutboundSource = { source: 'article', medium: 'article_card' };

function Byline({ article }: { article: Article }) {
  return (
    <p className="eyebrow text-muted-fg flex flex-wrap gap-x-3 gap-y-1">
      <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
      <span aria-hidden="true">·</span>
      <span>{article.readingMinutes} min read</span>
      {article.updated && <><span aria-hidden="true">·</span><span>Updated <time dateTime={article.updated}>{formatArticleDate(article.updated)}</time></span></>}
      {article.draft && <span className="text-red">Draft — not published</span>}
    </p>
  );
}

/** Nav, footer and the padded main column shared by the journal and collection pages. */
export function PublicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <Navbar />
      <main id="main" tabIndex={-1} className="relative flex-1 w-full max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)] pt-[calc(var(--nav-height,96px)+40px)] pb-20">
        {children}
      </main>
      <Footer />
      <Announcement />
    </div>
  );
}

export function ArticleList() {
  usePageMeta('Journal — Raccoon Hub', 'Roundups, notes from use and small-upgrade ideas from Raccoon Hub.');
  return (
    <PublicPage>
      <SectionLabel>The journal</SectionLabel>
      <h1 className="text-[clamp(56px,9vw,128px)] leading-[.86] mt-4">Notes from the raccoon</h1>
      <p className="border-b border-line pb-6 mt-4">
        {/* A plain link (not a router Link): the feed is XML served by the Worker. */}
        <a href={ARTICLES_FEED_PATH} className="inline-flex items-center gap-2 min-h-11 eyebrow text-muted-fg hover:text-fg"><Rss className="w-4 h-4" aria-hidden="true" /> Follow by RSS</a>
      </p>
      {ARTICLES.length === 0 ? (
        <div className="relative overflow-hidden panel p-12 max-w-xl mx-auto text-center my-12">
          <Viewfinder size={360} light />
          <p className="relative eyebrow text-muted-fg">Coming soon .</p>
          <h2 className="relative text-5xl mt-3">The first article is on its way.</h2>
        </div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 mt-10">
          {ARTICLES.map(a => (
            <li key={a.slug}>
              <article className="panel relative h-full flex flex-col overflow-hidden">
                {a.image && <img src={a.image} alt="" className="w-full aspect-[16/9] object-cover object-top bg-muted" loading="lazy" decoding="async" />}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <Byline article={a} />
                  <h2 className="text-[34px] leading-[.95]">
                    <Link to={articlePath(a.slug)} className="hover:text-red transition-colors after:absolute after:inset-0 after:content-['']">{a.title}</Link>
                  </h2>
                  <p className="text-sm text-muted-fg">{a.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 eyebrow" aria-hidden="true">Read <ArrowRight className="w-4 h-4" /></span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </PublicPage>
  );
}

/** The article's listed products that are currently published, in the article's order. */
function useArticleProducts(ids: string[]) {
  const [products, setProducts] = useState<PublicProduct[] | null>(() => (ids.length ? takeInitialProducts() : []));
  useEffect(() => {
    if (products || !ids.length) return;
    let live = true;
    api.products().then(list => { if (live) setProducts(list); }).catch(() => { if (live) setProducts([]); });
    return () => { live = false; };
  }, [ids, products]);
  return useMemo(() => {
    const byId = new Map((products ?? []).map(p => [p.id.toLowerCase(), p]));
    return ids.flatMap(id => {
      const p = byId.get(id);
      return p ? [{ ...p, ...formatProductCopy(p.title, p.description) }] : [];
    });
  }, [ids, products]);
}

export function ArticlePage() {
  const { slug } = useParams();
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) return <NotFound />;
  return <ArticleView key={article.slug} article={article} />;
}

function ArticleView({ article }: { article: Article }) {
  usePageMeta(`${article.title} — Raccoon Hub`, article.description);
  const products = useArticleProducts(article.products);
  const outbound = useOutbound();
  const [quick, setQuick] = useState<PublicProduct | null>(null);
  const open = (p: PublicProduct) => outbound.open(p, FROM_ARTICLE);

  return (
    <PublicPage>
      <article className="max-w-[72ch] mx-auto">
        <Link to="/articles" className="inline-flex items-center gap-2 min-h-11 eyebrow text-muted-fg hover:text-fg"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> All articles</Link>
        <header className="mt-4 border-b border-line pb-6">
          <h1 className="text-[clamp(48px,7vw,96px)] leading-[.88]">{article.title}</h1>
          <p className="mt-4 text-lg text-muted-fg">{article.description}</p>
          <div className="mt-4"><Byline article={article} /></div>
        </header>
        {article.image && (
          <img src={article.image} alt={article.imageAlt} className="w-full mt-8 rounded-[var(--radius-l)] bg-muted object-cover max-h-[520px]" decoding="async" />
        )}
        {/* Built from the repo's Markdown at build time; raw HTML is escaped and links are checked (scripts/articles.ts). */}
        <div className="article-body mt-8" dangerouslySetInnerHTML={{ __html: article.html }} />
      </article>

      {products.length > 0 && (
        <section aria-labelledby="article-finds" className="mt-16 border-t border-line pt-10">
          <SectionLabel>In this article</SectionLabel>
          <h2 id="article-finds" className="text-[clamp(40px,5vw,72px)] leading-[.9] mt-3 mb-8">The finds</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onOpen={open} onQuickView={setQuick} pending={outbound.state?.status === 'opening'} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-16 text-xs text-muted-fg max-w-[72ch] mx-auto">As an Amazon Associate, Raccoon Hub earns from qualifying purchases.</p>
      <ProductOverlays quick={quick} onCloseQuick={() => setQuick(null)} outbound={outbound} from={FROM_ARTICLE} />
    </PublicPage>
  );
}
