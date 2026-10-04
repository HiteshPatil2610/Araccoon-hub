import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, MousePointerClick, Package, Plus, ShoppingBag, Users } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from './AdminLayout';
import { useAuth } from './auth';
import type { AnalyticsSummary, Product } from '../../shared/types';

export function Stat({ label, value, icon: Icon, hint, tone = 'card' }: { label: string; value: string; icon: typeof Users; hint?: React.ReactNode; tone?: 'card' | 'sun' | 'mint' | 'sky' }) {
  const bg = { card: '', sun: '!bg-sun text-on-sun', mint: '!bg-mint text-on-mint', sky: '!bg-sky text-on-sky' }[tone];
  return (
    <div className={`panel p-4 ${bg}`}>
      <div className="flex items-center justify-between eyebrow">{label}<Icon className="w-4 h-4" aria-hidden="true" /></div>
      <p className="font-display text-5xl leading-none mt-2">{value}</p>
      {hint && <div className="text-xs font-bold mt-1 opacity-80">{hint}</div>}
    </div>
  );
}

export function Trend({ now, before }: { now: number; before: number }) {
  if (before === 0) return <span>{now > 0 ? 'New activity this period' : 'No activity yet'}</span>;
  const change = Math.round(((now - before) / before) * 100);
  const Up = change >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className="inline-flex items-center gap-1"><Up className="w-3.5 h-3.5" aria-hidden="true" />{Math.abs(change)}% vs previous period</span>;
}

export function Overview() {
  const { owner } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.analytics(7).then(setSummary).catch(e => setError(e.message));
    api.adminProducts().then(setProducts).catch(e => setError(e.message));
  }, []);

  const broken = products?.filter(p => !p.linkHealthy && p.status !== 'archived') ?? [];
  const drafts = products?.filter(p => p.status === 'draft').length ?? 0;
  const t = summary?.totals;

  return (
    <>
      <PageHeader title={`Hello${owner?.displayName ? `, ${owner.displayName}` : ''}!`} subtitle="Here's how the store did over the last 7 days."
        actions={<Link to="/admin/products?new=1" className="btn btn-primary"><Plus className="w-4 h-4" /> Add product</Link>} />
      {error && <p role="alert" className="field-error mb-4">{error}</p>}

      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Clicks (7d)" icon={MousePointerClick} tone="sun" value={t ? t.clicks.toLocaleString() : '—'} hint={t && <Trend now={t.clicks} before={t.previousPeriodClicks} />} />
        <Stat label="Clicks today" icon={MousePointerClick} value={t ? t.clicksToday.toLocaleString() : '—'} />
        <Stat label="Visitor-days" icon={Users} tone="sky" value={t ? t.visitorDays.toLocaleString() : '—'} hint="Daily anonymous identities, not distinct people" />
        <Stat label="Conversions" icon={ShoppingBag} tone="mint" value={t ? t.conversions.toLocaleString() : '—'} hint={t ? `${t.conversionRate}% of clicks` : undefined} />
      </div>

      {broken.length > 0 && (
        <div role="alert" className="panel !bg-coral text-on-coral p-4 mt-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{broken.length} product link{broken.length > 1 ? 's' : ''} can't be opened</p>
            <p className="text-sm">These destinations aren't on an approved Amazon store, so visitors get "link not available". <Link className="underline font-bold" to="/admin/products?status=published&broken=1">Fix them</Link></p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section className="panel p-5">
          <h2 className="text-[30px] mb-3">Top finds this week</h2>
          {!summary ? <p className="text-sm text-muted-fg">{error ? 'Report unavailable.' : 'Loading…'}</p> : summary.topProducts.length === 0 ? (
            <p className="text-sm text-muted-fg">No clicks yet. Share your store link to get things moving!</p>
          ) : (
            <ol className="space-y-2">
              {summary.topProducts.slice(0, 5).map((p, i) => (
                <li key={p.productId ?? p.title} className="flex items-center gap-3">
                  <span className="w-6 text-center font-black">{i + 1}</span>
                  {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg border border-line object-cover" /> : <span className="w-10 h-10 rounded-lg border border-line bg-muted" />}
                  <span className="flex-1 min-w-0 truncate font-bold text-sm">{p.title}</span>
                  <span className="chip">{p.clicks} clicks</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="panel p-5">
          <h2 className="text-[30px] mb-3">Catalog</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="font-display text-4xl leading-none">{products?.filter(p => p.status === 'published').length ?? '—'}</p><p className="text-xs font-bold text-muted-fg">Live</p></div>
            <div><p className="font-display text-4xl leading-none">{products ? drafts : '—'}</p><p className="text-xs font-bold text-muted-fg">Drafts</p></div>
            <div><p className="font-display text-4xl leading-none">{products?.filter(p => p.featured).length ?? '—'}</p><p className="text-xs font-bold text-muted-fg">Featured</p></div>
          </div>
          <Link to="/admin/products" className="btn w-full mt-4"><Package className="w-4 h-4" /> Manage products</Link>
        </section>
      </div>
    </>
  );
}
