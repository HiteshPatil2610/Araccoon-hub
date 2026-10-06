import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { api, HttpError } from '../lib/api';
import { ProductImage } from '../components/ProductImage';
import { ProductDescription } from '../components/ProductDescription';
import { productImportRequestSchema, type ProductImportPreview } from '../../shared/productImport';

export type ImportSelection = { title: boolean; description: boolean; category: boolean; affiliateUrl: boolean; imageUrl: boolean };
export type ImportDraft = { url: string; title: string; description: string; features: string; category: string; sourceUrl: string };
export const emptyImportDraft: ImportDraft = { url: '', title: '', description: '', features: '', category: '', sourceUrl: '' };

export function ProductImportPanel({ current, disabled, onApply, draft, setDraft }: {
  current: { title: string; description: string; category: string; affiliateUrl: string; imageUrl: string };
  disabled: boolean;
  onApply: (preview: ProductImportPreview, selected: ImportSelection) => void;
  draft: ImportDraft;
  setDraft: Dispatch<SetStateAction<ImportDraft>>;
}) {
  const { url } = draft;
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [selection, setSelection] = useState<ImportSelection>({ title: false, description: false, category: false, affiliateUrl: false, imageUrl: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => { pending.current?.abort(); }, []);

  const invalidate = () => {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setPreview(null);
    setError('');
  };
  const prepare = async () => {
    invalidate();
    const parsed = productImportRequestSchema.safeParse({ url });
    if (!parsed.success) {
      setError(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(' '));
      return;
    }
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    // Retain the shared client's bounded deadline while allowing cancellation.
    const timer = setTimeout(() => controller.abort(), 25_000);
    try {
      const next = await api.previewProductImport(parsed.data, controller.signal);
      if (pending.current !== controller || controller.signal.aborted) return;
      setPreview(next);
      // The editor may change while the request is pending. Every application
      // requires a fresh explicit selection, never a captured empty-field value.
      setSelection({ title: false, description: false, category: false, affiliateUrl: false, imageUrl: false });
    } catch (e) {
      if (pending.current !== controller) return;
      setError(e instanceof HttpError ? Object.values(e.fields).filter(Boolean).join(' ') || e.message : 'Could not prepare the preview. Try again.');
    } finally {
      clearTimeout(timer);
      if (pending.current === controller) { pending.current = null; setBusy(false); }
    }
  };
  const input = (key: keyof ImportDraft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    invalidate(); const value = e.target.value; setDraft(previous => ({ ...previous, [key]: value }));
  };
  const selectedAny = Object.values(selection).some(Boolean);

  return <section className="panel min-w-0 max-w-full p-4 space-y-3 [overflow-wrap:anywhere]" aria-labelledby="import-title" aria-busy={busy}>
    <h3 id="import-title" className="text-lg font-bold">Fetch product details</h3>
    <p className="text-sm text-muted-fg">Paste an Amazon product link or short link to fetch its title, description, features, specifications, and image. Review the result, then apply it to your product.</p>
    <fieldset disabled={disabled} className="min-w-0 w-full space-y-3">
      <div><label htmlFor="import-url" className="field-label">Amazon product URL or short link</label>
        <input id="import-url" className="field" inputMode="url" maxLength={2048} value={url} onChange={input('url')} placeholder="https://www.amazon.in/dp/…" /></div>
      <button type="button" className="btn btn-primary max-w-full !whitespace-normal !py-2" disabled={busy || !url.trim()} onClick={() => void prepare()}>{busy ? 'Fetching details…' : 'Fetch product details'}</button>
    </fieldset>
    {error && <p role="alert" className="field-error">{error}</p>}
    <div role="status" aria-live="polite" className="min-w-0">
      {preview && <div className="min-w-0 space-y-3">
        <p className="text-sm font-bold">Identified: {preview.identity.marketplace} · {preview.identity.asin}</p>
        {preview.suggestions.imageUrl && <ProductImage src={preview.suggestions.imageUrl} title={preview.suggestions.title || 'Fetched product'} className="h-32 w-32 rounded-lg object-contain bg-white" />}
        {preview.duplicate ? <p className="field-error">Already in your catalog: {preview.duplicate.title}. Close this editor and open that product to make changes.</p> : null}
        {preview.warnings.map(w => <p className="text-sm text-muted-fg" key={w}>{w}</p>)}
        {preview.details && <details className="min-w-0 text-sm">
          <summary className="cursor-pointer font-bold">Product features and specifications</summary>
          {preview.details.brand && <p className="mt-2">Brand: {preview.details.brand}</p>}
          {preview.details.model && <p>Model: {preview.details.model}</p>}
          <ul className="list-disc pl-5 space-y-1 mt-2">{preview.details.features.map((feature, i) => <li key={i}>{feature}</li>)}</ul>
          {preview.details.specifications.length > 0 && <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">{preview.details.specifications.map(spec => <div key={spec.name} className="min-w-0"><dt className="font-bold">{spec.name}</dt><dd>{spec.value}</dd></div>)}</dl>}
        </details>}
        <fieldset disabled={disabled || Boolean(preview.duplicate)} className="min-w-0 w-full space-y-2">
          <legend className="field-label max-w-full">Choose fields to apply</legend>
          {(['title', 'description', 'category', 'affiliateUrl', 'imageUrl'] as const).map(key => {
            const value = key === 'affiliateUrl' ? preview.affiliateUrl : preview.suggestions[key];
            if (!value) return null;
            return <label key={key} className="flex min-w-0 items-start gap-2 rounded-lg border border-line p-3 text-sm">
              <input type="checkbox" className="mt-1 shrink-0" checked={selection[key]} onChange={e => setSelection(s => ({ ...s, [key]: e.target.checked }))} />
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{key === 'affiliateUrl' ? 'Your Amazon affiliate link' : key === 'imageUrl' ? 'Product image' : key === 'title' ? 'Title' : key === 'description' ? 'Description' : 'Category'}</span>
                {key === 'description' ? <ProductDescription text={value} className="mt-1 max-h-64 overflow-y-auto pr-2" /> : <span className="mt-1 block whitespace-pre-line">{value}</span>}
                {current[key] && current[key] !== value ? <span className="mt-2 block text-muted-fg">Current: {current[key]}. Select to replace it.</span> : null}
              </span>
            </label>;
          })}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary max-w-full !whitespace-normal !py-2" onClick={() => onApply(preview, { title: Boolean(preview.suggestions.title), description: Boolean(preview.suggestions.description), category: Boolean(preview.suggestions.category), imageUrl: Boolean(preview.suggestions.imageUrl), affiliateUrl: true })}>Apply all fetched details</button>
            <button type="button" className="btn max-w-full !whitespace-normal !py-2" disabled={!selectedAny} onClick={() => onApply(preview, selection)}>Apply selected fields</button>
          </div>
        </fieldset>
      </div>}
    </div>
  </section>;
}
