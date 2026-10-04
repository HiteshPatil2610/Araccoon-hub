import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, MousePointerClick, Plus, RefreshCw, ShoppingBag, Trash2, Users } from 'lucide-react';
import { api, downloadBlob, type ConversionRow } from '../lib/api';
import { PageHeader } from './AdminLayout';
import { Stat, Trend } from './Overview';
import { Dialog, ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/Toasts';
import type { AnalyticsSummary, Product } from '../../shared/types';

const RANGES = [7, 30, 90] as const;

function Bars({ title, rows }: { title: string; rows: { key: string; clicks: number; percentage: number }[] }) {
  return (
    <section className="panel p-4">
      <h3 className="eyebrow mb-3">{title}</h3>
      {rows.length === 0 ? <p className="text-sm text-muted-fg">No data yet.</p> : (
        <ul className="space-y-2">
          {rows.map(r => (
            <li key={r.key}>
              <div className="flex justify-between text-xs font-bold"><span className="truncate">{r.key === '??' ? 'Unknown' : r.key}</span><span>{r.clicks} · {r.percentage}%</span></div>
              <div className="h-2.5 rounded-full border border-line bg-muted mt-1 overflow-hidden"><div className="h-full bg-brand" style={{ width: `${r.percentage}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Analytics() {
  const toast = useToast();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState('');
  const [conversionError, setConversionError] = useState('');
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const [deletingConversion, setDeletingConversion] = useState<ConversionRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);
  const [deleteError, setDeleteError] = useState('');
  const [exporting, setExporting] = useState(false);
  const exportLock = useRef(false);
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true); setError(''); setConversionError('');
    const [summary, conv] = await Promise.allSettled([api.analytics(days), api.conversions()]);
    if (id !== requestId.current) return;
    if (summary.status === 'fulfilled') setData(summary.value);
    else setError(summary.reason instanceof Error ? summary.reason.message : 'Analytics unavailable.');
    if (conv.status === 'fulfilled') setConversions(conv.value);
    else setConversionError(conv.reason instanceof Error ? conv.reason.message : 'Conversion records unavailable.');
    setLoading(false);
  }, [days]);
  useEffect(() => { void load(); }, [load]);

  const exportCsv = async () => {
    if (exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    try {
      const { blob, name, truncated } = await api.exportCsv(days);
      downloadBlob(blob, name);
      if (truncated) toast('error', 'Export was capped at 50,000 rows — choose a shorter range for the rest.');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setExporting(false);
      exportLock.current = false;
    }
  };

  const t = data?.totals;
  const reportDays = data?.range.days ?? days;
  return (
    <>
      <PageHeader title="Analytics" subtitle={data ? `${data.range.from} → ${data.range.to} · ${data.range.timezone} · your own test clicks are excluded` : loading ? 'Loading report…' : 'Analytics unavailable'}
        actions={<>
          <div className="inline-flex rounded-full border border-[var(--field-border)] p-1 gap-1" role="group" aria-label="Date range">
            {RANGES.map(r => (
              <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
                className={`px-4 min-h-11 rounded-full font-display text-lg pt-0.5 ${days === r ? 'bg-sun text-on-sun' : ''}`}>{r}d</button>
            ))}
          </div>
          <button type="button" className="btn !px-3" onClick={load} aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
          <button type="button" className="btn btn-mint" onClick={exportCsv} disabled={exporting || !data || loading || data.range.days !== days}><Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export rolling period (CSV)'}</button>
        </>} />

      <p className="text-sm text-muted-fg mb-4" role="status">{loading ? 'Refreshing report…' : data ? `Report generated ${new Date(data.generatedAt).toLocaleString()} · ${Intl.DateTimeFormat().resolvedOptions().timeZone}. Clicks are outbound activity, not purchases.` : 'Report unavailable.'}</p>
      {data && <p className="text-sm text-muted-fg mb-4">Export covers the rolling last {days} days in UTC, up to 50,000 retained clicks. The report groups calendar dates in {data.range.timezone}; boundaries can differ. Retention: {data.retentionDays === undefined ? 'metadata unavailable' : `${data.retentionDays} days`}.</p>}
      {error && <div role="alert" className="panel p-4 mb-4"><p className="font-bold">{data ? 'Refresh failed. The previous report remains visible. ' : 'Analytics unavailable. '}{error}</p><button type="button" className="btn btn-sun mt-2" onClick={load}>Try again</button></div>}

      <div className="grid grid-cols-1 min-[440px]:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label={`Clicks (${reportDays}d)`} icon={MousePointerClick} tone="sun" value={t ? t.clicks.toLocaleString() : '—'} hint={t && <Trend now={t.clicks} before={t.previousPeriodClicks} />} />
        <Stat label="Visitor-days" icon={Users} tone="sky" value={t ? t.visitorDays.toLocaleString() : '—'} hint="Daily anonymous identities; returning visitors count again across days" />
        <Stat label="Conversions" icon={ShoppingBag} tone="mint" value={t ? t.conversions.toLocaleString() : '—'} />
        <Stat label="Conversion rate" icon={ShoppingBag} value={t ? `${t.conversionRate}%` : '—'} hint="Conversions ÷ clicks" />
      </div>

      <section className="panel p-4 mt-6">
        <h2 className="text-[30px] mb-3">Clicks per day</h2>
        <div className={data ? 'h-64' : ''} role="img" aria-label={data ? `Daily clicks from ${data.range.from} to ${data.range.to}, total ${t?.clicks}` : loading ? 'Loading chart' : 'Chart unavailable'}>
          {data && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.byDay} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.15} />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="var(--muted-text)" fontSize={11} />
                <YAxis allowDecimals={false} stroke="var(--muted-text)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16, color: 'var(--foreground)' }} />
                <Area type="monotone" dataKey="clicks" isAnimationActive={false} stroke="var(--primary)" strokeWidth={2.5} fill="var(--primary)" fillOpacity={0.2} name="Clicks" />
                <Area type="monotone" dataKey="conversions" isAnimationActive={false} stroke="var(--foreground)" strokeWidth={1.5} strokeDasharray="4 3" fill="var(--muted-text)" fillOpacity={0.12} name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        {!data && <p className="text-sm text-muted-fg">{loading ? 'Loading daily counts…' : 'Daily counts unavailable.'}</p>}
        {data && <details className="mt-3"><summary className="cursor-pointer font-bold py-3">Daily counts as a table</summary><div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Daily counts"><table className="w-full text-sm"><caption className="text-left">Dates in {data.range.timezone}</caption><thead><tr><th scope="col">Date</th><th scope="col">Clicks</th><th scope="col">Recorded conversions</th></tr></thead><tbody>{data.byDay.map(d => <tr key={d.date}><th scope="row">{d.date}</th><td className="text-center">{d.clicks}</td><td className="text-center">{d.conversions}</td></tr>)}</tbody></table></div></details>}
      </section>

      {data && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Bars title="Device" rows={data.breakdowns.device} />
          <Bars title="Referrer" rows={data.breakdowns.referrer} />
          <Bars title="Country" rows={data.breakdowns.country} />
          <Bars title="Category" rows={data.breakdowns.category} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <section className="panel p-4 overflow-x-auto">
          <h2 className="text-[30px] mb-3">Top products</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-sm uppercase tracking-wider"><th className="py-1">Product</th><th className="text-right">Clicks</th><th className="text-right">Conv.</th><th className="text-right">Rate</th></tr></thead>
            <tbody>
              {data?.topProducts.map(p => (
                <tr key={p.productId ?? p.title} className="border-t border-line">
                  <td className="py-2 pr-2 font-bold truncate max-w-[14rem]">{p.title}{!p.productId && <span className="text-muted-fg"> (deleted)</span>}</td>
                  <td className="text-right">{p.clicks}</td><td className="text-right">{p.conversions}</td><td className="text-right">{p.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data?.topProducts.length === 0 && <p className="text-sm text-muted-fg">No clicks in this range.</p>}
          {!data && <p className="text-sm text-muted-fg">{loading ? 'Loading product activity…' : 'Product activity unavailable.'}</p>}
        </section>

        <section className="panel p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-[30px]">Conversions</h2>
            <button type="button" className="btn btn-primary self-start" onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Record conversion</button>
          </div>
          <p className="text-sm text-muted-fg mb-3">Latest 200 records across retained history. Amazon doesn't send sales automatically — record the ones you see in your Associates report.</p>
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {conversions.map(c => (
              <li key={c.id} className="flex items-center gap-3 text-sm border-t border-line pt-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{c.productTitle}</p>
                  <p className="text-xs text-muted-fg">{new Date(c.occurredAt).toLocaleDateString()} · {c.source}{c.amountCents !== null ? ` · commission ${(c.amountCents / 100).toFixed(2)}` : ''}{c.note ? ` · ${c.note}` : ''}</p>
                </div>
                {c.source === 'manual' && (
                  <button type="button" className="btn btn-ghost !px-2" aria-label={`Delete conversion for ${c.productTitle}`} onClick={() => setDeletingConversion(c)}><Trash2 className="w-4 h-4" /></button>
                )}
              </li>
            ))}
            {conversionError && <li role="alert" className="field-error">Conversion records unavailable. {conversionError}</li>}
            {!conversionError && !loading && conversions.length === 0 && <li className="text-sm text-muted-fg">None recorded yet.</li>}
          </ul>
        </section>
      </div>

      <section className="panel p-4 mt-6 overflow-x-auto" role="region" aria-label="Recent activity table" tabIndex={0}>
        <h2 className="text-[30px] mb-3">Recent activity — latest 50 recorded clicks</h2><p className="text-sm text-muted-fg mb-3">Across retained history, independent of the selected report period. Times shown in {Intl.DateTimeFormat().resolvedOptions().timeZone}.</p>
        <table className="w-full text-sm min-w-[640px]">
          <thead><tr className="text-left text-sm uppercase tracking-wider"><th className="py-1">Time</th><th>Product</th><th>Device</th><th>Country</th><th>From</th></tr></thead>
          <tbody>
            {data?.recentClicks.map(c => (
              <tr key={c.id} className="border-t border-line">
                <td className="py-1.5 whitespace-nowrap">{new Date(c.occurredAt).toLocaleString()}</td>
                <td className="font-bold truncate max-w-[16rem]">{c.productTitle}</td>
                <td>{c.device}</td><td>{c.country ?? '—'}</td><td className="truncate max-w-[10rem]">{c.utmSource ?? c.referrer}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.recentClicks.length === 0 && <p className="text-sm text-muted-fg">No recorded clicks in retained history.</p>}
        {!data && !loading && <p>Recent activity unavailable.</p>}
      </section>

      <section className="panel p-4 mt-6 border-danger">
        <h2 className="text-[30px]">Danger zone</h2>
        <p className="text-sm text-muted-fg mt-1">Clear all clicks and conversions (for example after testing). Products are not affected.</p>
        <button type="button" className="btn btn-danger mt-3" onClick={() => setResetOpen(true)}>Reset analytics…</button>
      </section>

      <ConfirmDialog open={deletingConversion !== null} title={`Delete conversion for “${deletingConversion?.productTitle ?? ''}”?`} message={<>This removes this recorded conversion permanently.{deleteError && <p role="alert" className="field-error mt-3">{deleteError}</p>}</>} confirmLabel="Delete conversion" danger busy={deleting} onClose={() => { setDeletingConversion(null); setDeleteError(''); }} onConfirm={async () => { if (!deletingConversion || deleteLock.current) return; deleteLock.current = true; setDeleting(true); setDeleteError(''); try { await api.deleteConversion(deletingConversion.id); setDeletingConversion(null); await load(); } catch(e) { setDeleteError(e instanceof Error ? e.message : 'Could not delete conversion.'); } finally { deleteLock.current = false; setDeleting(false); } }} />
      <AddConversion open={adding} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); void load(); toast('success', 'Sale recorded.'); }} />
      <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} onDone={() => { setResetOpen(false); void load(); toast('success', 'Analytics cleared.'); }} />
    </>
  );
}

function AddConversion({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const busyRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setError(''); setAmount(''); setNote(''); setDate(new Date().toISOString().slice(0, 10));
      api.adminProducts().then(list => { setProducts(list); setProductId(list[0]?.id ?? ''); }).catch(e => setError(e.message));
    }
  }, [open]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    const cents = amount ? Math.round(Number(amount) * 100) : undefined;
    if (cents !== undefined && (!Number.isFinite(cents) || cents < 0)) return setError('Enter a valid commission amount.');
    busyRef.current = true; setSaving(true);
    try {
      await api.addConversion({ productId, amountCents: cents, note: note || undefined, occurredAt: date ? new Date(`${date}T12:00:00`).toISOString() : undefined });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally { busyRef.current = false; setSaving(false); }
  };
  return (
    <Dialog open={open} busy={saving} onClose={onClose} title="Record a conversion">
      <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="c-p" className="field-label">Product</label>
          <select id="c-p" className="field" value={productId} onChange={e => setProductId(e.target.value)} required>
            {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label htmlFor="c-d" className="field-label">Date</label><input id="c-d" type="date" className="field" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label htmlFor="c-a" className="field-label">Commission (optional)</label><input id="c-a" inputMode="decimal" className="field" placeholder="e.g. 42.50" value={amount} onChange={e => setAmount(e.target.value)} /></div>
        </div>
        <div><label htmlFor="c-n" className="field-label">Note (optional)</label><input id="c-n" className="field" maxLength={200} value={note} onChange={e => setNote(e.target.value)} /></div>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={saving} className="btn" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={!productId || saving}>{saving ? 'Saving…' : 'Save conversion'}</button></div>
      </form>
    </Dialog>
  );
}

function ResetDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const lock = useRef(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setTyped(''); setError(''); } }, [open]);
  return (
    <ConfirmDialog open={open} danger busy={busy} title="Reset all analytics?" confirmLabel="Reset everything" onClose={onClose}
      onConfirm={async () => {
        if (lock.current) return;
        if (typed !== 'RESET') return setError('Type RESET to confirm.');
        lock.current = true;
        setBusy(true);
        try { await api.resetAnalytics(); onDone(); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); } finally { lock.current = false; setBusy(false); }
      }}
      message={<>
        <p>This permanently deletes every click and conversion. It cannot be undone.</p>
        <label htmlFor="reset-typed" className="field-label mt-4">Type RESET to confirm</label>
        <input id="reset-typed" className="field font-mono" value={typed} onChange={e => setTyped(e.target.value)} autoComplete="off" />
        {error && <p role="alert" className="field-error">{error}</p>}
      </>} />
  );
}
