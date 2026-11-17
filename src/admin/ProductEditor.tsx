import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Copy, ImagePlus, Link2, Plus, RefreshCw, X } from 'lucide-react';
import { Dialog, ConfirmDialog } from '../components/Dialog';
import { ProductImage } from '../components/ProductImage';
import { api, HttpError } from '../lib/api';
import { productInputSchema, type ProductInput } from '../../shared/schemas';
import { normalizeAffiliateUrl, parseHostList } from '../../shared/urlPolicy';
import { CATEGORIES, type Product } from '../../shared/types';
import { ProductImportPanel, emptyImportDraft } from './ProductImportPanel';
import { applyImportFields, type OwnerContentSource } from '../../shared/productImport';
import { descriptionSummary, type ProductSpec } from '../../shared/productCopy';
import { MAX_SPECS, SPEC_NAME_MAX, SPEC_TEMPLATES, SPEC_VALUE_MAX, TIERS, TIER_LABELS, mergeSpecs, specTemplate, type Tier } from '../../shared/productFacts';

const HOSTS = parseHostList(undefined); // UI hint only; the server enforces its configured list
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

type Form = {
  title: string; description: string; category: string; rating: string; reviewCount: string;
  imageUrl: string; imagePublicId: string | null; affiliateUrl: string; badge: string; pickNote: string; featured: boolean;
  affiliateTag: string; subId: string;
  brand: string; productType: string; tier: Tier | ''; specs: ProductSpec[];
  status: Product['status']; sortOrder: string;
};

const empty: Form = {
  title: '', description: '', category: CATEGORIES[0], rating: '0', reviewCount: '0', imageUrl: '', imagePublicId: null,
  affiliateUrl: '', badge: '', pickNote: '', featured: false, status: 'published', sortOrder: '0',
  affiliateTag: '', subId: '',
  brand: '', productType: '', tier: '', specs: [],
};

function fromProduct(p: Product): Form {
  return {
    title: p.title, description: p.description, category: p.category, rating: String(p.rating), reviewCount: String(p.reviewCount),
    imageUrl: p.imageUrl, imagePublicId: p.imagePublicId, affiliateUrl: p.affiliateUrl, badge: p.badge ?? '', pickNote: p.pickNote ?? '', featured: p.featured,
    status: p.status, sortOrder: String(p.sortOrder),
    affiliateTag: p.affiliateTag ?? '', subId: p.subId ?? '',
    brand: p.brand ?? '', productType: p.productType ?? '', tier: p.tier ?? '', specs: p.specs.map(s => ({ ...s })),
  };
}

function toInput(f: Form) {
  return {
    title: f.title, description: f.description, category: f.category, rating: Number(f.rating), reviewCount: Number(f.reviewCount),
    imageUrl: f.imageUrl, imagePublicId: f.imagePublicId, affiliateUrl: f.affiliateUrl, badge: f.badge.trim() || null, pickNote: f.pickNote.trim() || null,
    featured: f.featured, status: f.status, sortOrder: Number(f.sortOrder),
    affiliateTag: f.affiliateTag.trim() || null, subId: f.subId.trim() || null,
    brand: f.brand.trim() || null, productType: f.productType.trim() || null, tier: f.tier || null,
    // A row left without a value (e.g. an unused template row) is simply not saved.
    specs: f.specs.map(s => ({ name: s.name.trim(), value: s.value.trim() })).filter(s => s.value),
  };
}

async function uploadToCloudinary(file: File, onProgress: (pct: number) => void): Promise<{ url: string; publicId: string }> {
  const sig = await api.signImageUpload();
  const form = new FormData();
  form.set('file', file);
  form.set('api_key', sig.apiKey);
  form.set('timestamp', String(sig.timestamp));
  form.set('signature', sig.signature);
  form.set('folder', sig.folder);
  form.set('upload_preset', sig.uploadPreset);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`);
    xhr.timeout = 60_000;
    xhr.ontimeout = () => reject(new Error('Upload timed out. Your product details are still here; choose the image again to retry.'));
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.secure_url && data.public_id) resolve({ url: data.secure_url, publicId: data.public_id });
        else reject(new Error(data.error?.message ?? 'The image upload was rejected.'));
      } catch {
        reject(new Error('Unexpected response from the image service.'));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed — check your connection and try again.'));
    xhr.send(form);
  });
}

export function ProductEditor({ product, open, onClose, onSaved }: {
  product: Product | null; open: boolean; onClose: () => void; onSaved: (p: Product) => void;
}) {
  const [form, setForm] = useState<Form>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [upload, setUpload] = useState<{ pct: number; preview: string } | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [manualImage, setManualImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const savingRef = useRef(false);
  const uploadRef = useRef(false);
  const previewRef = useRef<string | null>(null);
  const [stored, setStored] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [importDraft, setImportDraft] = useState(emptyImportDraft);
  const [assistance, setAssistance] = useState<Omit<OwnerContentSource, 'contentAuthorized'> | null>(null);
  const [contentAuthorized, setContentAuthorized] = useState(false);
  // Specification rows from the last fetched Amazon page, offered as spec rows (never added unasked).
  const [fetchedSpecs, setFetchedSpecs] = useState<ProductSpec[]>([]);
  const dirty = Object.values(importDraft).some(Boolean) || assistance !== null || JSON.stringify(form) !== JSON.stringify(product ? fromProduct(product) : empty);
  const requestClose = () => { if (savingRef.current || uploadRef.current) return; if (dirty) setDiscard(true); else onClose(); };
  const showErrors = (next: Record<string, string>) => {
    if (next.imageUrl || next.imagePublicId) setManualImage(true);
    setErrors(next);
    requestAnimationFrame(() => (formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') || formRef.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus());
  };
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  useEffect(() => {
    if (open) {
      setForm(product ? fromProduct(product) : empty);
      setErrors({});
      setUpload(null);
      setUploadError('');
      setManualImage(false);
      setStored(false);
      setDiscard(false);
      setImportDraft(emptyImportDraft);
      setAssistance(null);
      setContentAuthorized(false);
      setFetchedSpecs([]);
    }
  }, [open, product]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    if (k === 'title' || k === 'description' || k === 'affiliateUrl') setContentAuthorized(false);
    setForm(f => ({ ...f, [k]: v }));
  };
  const setSpec = (i: number, part: Partial<ProductSpec>) => setForm(f => ({ ...f, specs: f.specs.map((s, j) => (j === i ? { ...s, ...part } : s)) }));
  const addSpecs = (rows: readonly ProductSpec[]) => setForm(f => ({ ...f, specs: mergeSpecs(f.specs, rows) }));
  const usualRows = specTemplate(form.productType).map(name => ({ name, value: '' }));
  const missingUsual = mergeSpecs(form.specs, usualRows).length - form.specs.length;
  const missingFetched = mergeSpecs(form.specs, fetchedSpecs).length - form.specs.length;
  const linkOk = form.affiliateUrl ? normalizeAffiliateUrl(form.affiliateUrl, HOSTS) !== null : null;

  const pickFile = async (file: File | undefined) => {
    if (!file || uploadRef.current || savingRef.current) return;
    setContentAuthorized(false);
    setStored(false);
    setUploadError('');
    if (!TYPES.includes(file.type)) return setUploadError('Use a JPG, PNG, WEBP or GIF image.');
    if (file.size > MAX_BYTES) return setUploadError('Images must be 8 MB or smaller.');
    const preview = URL.createObjectURL(file);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = preview;
    uploadRef.current = true;
    setUpload({ pct: 0, preview });
    try {
      const res = await uploadToCloudinary(file, pct => setUpload({ pct, preview }));
      setForm(f => ({ ...f, imageUrl: res.url, imagePublicId: res.publicId }));
      setUpload(null);
      setStored(true);
    } catch (e) {
      setUploadError(e instanceof HttpError && e.status === 503 ? 'Image uploads are not configured yet — paste an image URL instead.' : e instanceof Error ? e.message : 'Upload failed.');
      if (e instanceof HttpError && e.status === 503) setManualImage(true);
      setUpload(u => (u ? { ...u, pct: -1 } : u)); // keep the preview so the owner can retry
    } finally {
      uploadRef.current = false;
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current || uploadRef.current) return;
    if (assistance && !contentAuthorized) {
      showErrors({ contentAuthorized: 'Confirm that you may use this product content and image.' });
      return;
    }
    const parsed = productInputSchema.safeParse(toInput(form));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] ??= issue.message;
      showErrors(next);
      return;
    }
    if (!linkOk) {
      showErrors({ affiliateUrl: `Use an https Amazon link (${HOSTS.join(', ')}).` });
      return;
    }
    setSaving(true);
    savingRef.current = true;
    setErrors({});
    try {
      const input: ProductInput = parsed.data;
      onSaved(product ? await api.updateProduct(product.id, input) : assistance
        ? await api.createAssistedDraft(input, { ...assistance, contentAuthorized: true }) : await api.createProduct(input));
      onClose();
    } catch (err) {
      if (err instanceof HttpError) {
        // The server keys an error inside a spec row by its path ("specs.0.value"); the form shows it under the field.
        const fields: Record<string, string> = {};
        for (const [key, message] of Object.entries(err.fields)) fields[key.split('.')[0]!] ??= message;
        showErrors({ ...fields, _: Object.keys(fields).length ? '' : err.message });
      }
      else setErrors({ _: 'Could not save. Your changes are still here — try again.' });
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const fieldProps = (k: keyof Form) => ({
    id: `f-${k}`, 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `e-${k}` : undefined,
  });
  const err = (k: string) => errors[k] && <p id={`e-${k}`} className="field-error">{errors[k]}</p>;

  return (
    <><Dialog open={open && !discard} busy={saving || (upload !== null && upload.pct >= 0)} onClose={requestClose} title={product ? 'Edit product' : 'Add a product'} wide>
      <form ref={formRef} onSubmit={submit} noValidate className="grid min-w-0 md:grid-cols-[220px_minmax(0,1fr)] gap-6" aria-busy={saving}>
        <div className="min-w-0">
          <h3 className="text-lg font-bold mb-3">Product image</h3>
          <div className="relative aspect-square rounded-[var(--radius-m)] border border-dashed border-line bg-muted overflow-hidden flex items-center justify-center">
            {upload?.preview || form.imageUrl ? (
              <ProductImage src={upload?.preview ?? form.imageUrl} title={form.title || 'Product preview'} className="w-full h-full object-contain" />
            ) : <ImagePlus className="w-10 h-10 text-muted-fg" aria-hidden="true" />}
            {upload && upload.pct >= 0 && (
              <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-sm font-bold p-2" role="progressbar" aria-label="Image upload" aria-valuenow={upload.pct} aria-valuemin={0} aria-valuemax={100}>
                Uploading… {upload.pct}%
              </div>
            )}
          </div>
          <p className="text-sm text-muted-fg mt-3">JPG, PNG, WEBP or GIF. Maximum 8 MB. Use your own photo or an image you have permission to use.</p>
          <p role="status" className="text-sm mt-2">{stored ? 'Image uploaded. Save the product to apply it.' : upload ? 'Preview — not applied to the product yet.' : ''}</p>
          <input ref={fileRef} disabled={saving || (upload !== null && upload.pct >= 0)} aria-label="Choose product image" type="file" accept={TYPES.join(',')} className="field mt-3" id="f-file" onChange={e => pickFile(e.target.files?.[0])} />
          <div className="flex gap-2 mt-2">
            {upload?.pct === -1 && <button type="button" className="btn !px-3" aria-label="Retry upload" onClick={() => fileRef.current?.click()}><RefreshCw className="w-4 h-4" /></button>}
          </div>
          <button type="button" className="text-xs underline font-bold mt-2" onClick={() => setManualImage(m => !m)}>
            {manualImage ? 'Hide image URL' : 'Or paste an image URL'}
          </button>
          {manualImage && (
            <input {...fieldProps('imageUrl')} aria-label="Image URL" className="field mt-2" placeholder="https://…" value={form.imageUrl}
              onChange={e => { setContentAuthorized(false); setStored(false); setUpload(null); setUploadError(''); setForm(f => ({ ...f, imageUrl: e.target.value.trim(), imagePublicId: null })); }} />
          )}
          {uploadError && <p role="alert" className="field-error">{uploadError}</p>}
          {err('imageUrl')}{err('imagePublicId')}
          <div className="panel p-3 mt-4 space-y-2" aria-label="Live product card preview">
            <p className="eyebrow">Card preview</p>
            <p className="text-sm text-muted-fg">{form.category}</p>
            <h4 className="text-lg font-bold line-clamp-2">{form.title || 'Product title'}</h4>
            <p className="text-sm text-muted-fg line-clamp-2">{descriptionSummary(form.description) || 'Your description will appear here.'}</p>
            <span className="btn btn-primary btn-bar">View on Amazon</span>
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          {open && !product && <ProductImportPanel current={form} disabled={saving || (upload !== null && upload.pct >= 0)} draft={importDraft} setDraft={setImportDraft}
            onApply={(preview, selected) => {
              // The brand is a plain fact: fill it when the owner has not typed one.
              setForm(f => ({ ...applyImportFields(f, preview, selected), brand: f.brand || (preview.details?.brand ?? '').trim().slice(0, 60) }));
              setFetchedSpecs(preview.details?.specifications ?? []);
              setAssistance({ provider: preview.provider === 'amazon-page' ? 'amazon-page' : 'owner-content', sourceUrl: preview.sourceUrl });
              setContentAuthorized(false);
              setErrors({});
            }} />}
          <h3 className="text-lg font-bold">Product details</h3>
          {Object.values(errors).filter(Boolean).length > 0 && <p role="alert" tabIndex={-1} className="field-error">Please review the errors below. Your entered values are still here.</p>}
          <div>
            <label htmlFor="f-title" className="field-label">Title</label>
            <input {...fieldProps('title')} className="field" value={form.title} maxLength={200} onChange={e => set('title', e.target.value)} />
            {err('title')}
          </div>
          <div>
            <label htmlFor="f-description" className="field-label">Why it's a good find</label>
            <textarea {...fieldProps('description')} rows={3} className="field" maxLength={2000} value={form.description} onChange={e => set('description', e.target.value)} />
            <p className="mt-1 text-sm text-muted-fg">Use one spec per line, such as “Refresh rate: 200Hz”. Spec labels appear bold in Quick View.</p>
            {err('description')}
          </div>
          <div>
            <label htmlFor="f-pickNote" className="field-label">Why you picked it (optional)</label>
            <textarea {...fieldProps('pickNote')} rows={2} className="field" maxLength={280} placeholder="I keep one on my desk because…" value={form.pickNote} onChange={e => set('pickNote', e.target.value)} />
            <p className="mt-1 text-sm text-muted-fg">A sentence or two in your own words. Shown to visitors at the top of Quick View. {form.pickNote.length}/280</p>
            {err('pickNote')}
          </div>
            <div className="col-span-2">
              <label htmlFor="f-category" className="field-label">Category</label>
              <select {...fieldProps('category')} className="field" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              {err('category')}
            </div>
          <h3 className="text-lg font-bold border-t border-line pt-4">Compare details</h3>
          <p className="text-sm text-muted-fg">Optional. These let visitors filter finds by tier and will line finds of the same type up side by side. The tier is your own judgement, not a price.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="f-brand" className="field-label">Brand</label>
              <input {...fieldProps('brand')} className="field" maxLength={60} placeholder="Logitech" value={form.brand} onChange={e => set('brand', e.target.value)} />
              {err('brand')}
            </div>
            <div>
              <label htmlFor="f-productType" className="field-label">Product type</label>
              <input {...fieldProps('productType')} className="field" maxLength={40} list="product-types" placeholder="Mouse" value={form.productType} onChange={e => set('productType', e.target.value)} />
              <datalist id="product-types">{Object.keys(SPEC_TEMPLATES).map(t => <option key={t} value={t} />)}</datalist>
              {err('productType')}
            </div>
            <div>
              <label htmlFor="f-tier" className="field-label">Tier</label>
              <select {...fieldProps('tier')} className="field" value={form.tier} onChange={e => set('tier', e.target.value as Form['tier'])}>
                <option value="">Not set</option>
                {TIERS.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
              </select>
              {err('tier')}
            </div>
          </div>
          <fieldset className="min-w-0" aria-describedby={errors.specs ? 'e-specs' : 'specs-hint'}>
            <legend className="field-label">Specs to compare</legend>
            <p id="specs-hint" className="text-sm text-muted-fg">One fact per row, with the same names across finds of one type (for example “Weight” and “99 g”). Rows without a value are not saved.</p>
            {form.specs.length > 0 && (
              <ul className="mt-3 space-y-2">
                {form.specs.map((s, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] gap-2">
                    <input className="field" aria-label={`Spec ${i + 1} name`} maxLength={SPEC_NAME_MAX} placeholder="Name" value={s.name} aria-invalid={errors.specs ? true : undefined} onChange={e => setSpec(i, { name: e.target.value })} />
                    <input className="field" aria-label={`Spec ${i + 1} value`} maxLength={SPEC_VALUE_MAX} placeholder="Value" value={s.value} onChange={e => setSpec(i, { value: e.target.value })} />
                    <button type="button" className="btn !px-3" aria-label={`Remove spec ${i + 1}${s.name ? `: ${s.name}` : ''}`} onClick={() => setForm(f => ({ ...f, specs: f.specs.filter((_, j) => j !== i) }))}><X className="w-4 h-4" aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" className="btn !min-h-9 !text-sm" disabled={form.specs.length >= MAX_SPECS} onClick={() => setForm(f => ({ ...f, specs: [...f.specs, { name: '', value: '' }] }))}><Plus className="w-4 h-4" aria-hidden="true" /> Add a row</button>
              {missingUsual > 0 && <button type="button" className="btn !min-h-9 !text-sm" onClick={() => addSpecs(usualRows)}>Add the usual rows for {form.productType.trim()}</button>}
              {missingFetched > 0 && <button type="button" className="btn !min-h-9 !text-sm" onClick={() => addSpecs(fetchedSpecs)}>Add {missingFetched} fetched {missingFetched === 1 ? 'spec' : 'specs'}</button>}
            </div>
            <p className="text-sm text-muted-fg mt-2">{form.specs.length} of {MAX_SPECS} rows</p>
            {err('specs')}
          </fieldset>
          <h3 className="text-lg font-bold border-t border-line pt-4">Amazon destination</h3>
          <div>
            <label htmlFor="f-affiliateUrl" className="field-label">Amazon link</label>
            <div className="relative">
              <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" aria-hidden="true" />
              <input {...fieldProps('affiliateUrl')} className="field !pl-9" inputMode="url" placeholder="https://www.amazon.in/dp/… or https://amzn.in/…"
                value={form.affiliateUrl} onChange={e => set('affiliateUrl', e.target.value)} />
            </div>
            {linkOk === false && !errors.affiliateUrl && <p className="field-error">That doesn't look like an Amazon.com / Amazon.in link.</p>}
            {err('affiliateUrl')}
            <p className="text-sm text-muted-fg mt-1">Your configured Associates tag replaces any existing tag automatically. Short links are expanded before saving. Use the optional tag field below for another tracking ID from your own account.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label htmlFor="f-affiliateTag" className="field-label">Your Associates tag override (optional)</label><input {...fieldProps('affiliateTag')} className="field" maxLength={64} value={form.affiliateTag} onChange={e => set('affiliateTag', e.target.value)} />{err('affiliateTag')}</div>
            <div><label htmlFor="f-subId" className="field-label">Tracking sub-ID (optional)</label><input {...fieldProps('subId')} className="field" maxLength={64} value={form.subId} onChange={e => set('subId', e.target.value)} />{err('subId')}</div>
          </div>
          <p className="text-sm text-muted-fg">Leave the tag empty to use the configured store tag. Overrides apply to full Amazon URLs; short links retain their own tracking. Optional values accept letters, numbers, dots, dashes and underscores.</p>
          <h3 className="text-lg font-bold border-t border-line pt-4">Display details</h3>
          <p className="text-sm text-muted-fg">Ratings and review counts are owner supplied, not live Amazon data. They are retained for management and sorting, and not displayed as public ratings.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="f-rating" className="field-label">Rating</label>
              <input {...fieldProps('rating')} type="number" min={0} max={5} step={0.1} className="field" value={form.rating} onChange={e => set('rating', e.target.value)} />
              {err('rating')}
            </div>
            <div>
              <label htmlFor="f-reviewCount" className="field-label">Reviews</label>
              <input {...fieldProps('reviewCount')} type="number" min={0} step={1} className="field" value={form.reviewCount} onChange={e => set('reviewCount', e.target.value)} />
              {err('reviewCount')}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="f-badge" className="field-label">Badge (optional)</label>
              <input {...fieldProps('badge')} className="field" maxLength={40} placeholder="Use a factual label" value={form.badge} onChange={e => set('badge', e.target.value)} />
              {err('badge')}
            </div>
            <div>
              <label htmlFor="f-status" className="field-label">Status</label>
              <select {...fieldProps('status')} className="field" value={form.status} onChange={e => set('status', e.target.value as Form['status'])}>
                <option value="published" disabled={assistance !== null}>Published</option>
                <option value="draft">Draft (hidden)</option>
                <option value="archived">Archived</option>
              </select>
              {err('status')}
            </div>
            <div>
              <label htmlFor="f-sortOrder" className="field-label">Sort order</label>
              <input {...fieldProps('sortOrder')} type="number" step={1} className="field" value={form.sortOrder} onChange={e => set('sortOrder', e.target.value)} />
              {err('sortOrder')}
            </div>
          </div>
          <label className="flex items-center gap-3 min-h-11 font-bold text-sm cursor-pointer">
            <input type="checkbox" className="w-5 h-5 accent-[var(--primary)]" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
            Feature in the curiosity board and catalog
          </label>
          {product && <ProductIdForArticles id={product.id} />}
          {errors._ && <p role="alert" className="field-error">{errors._}</p>}
          {assistance && <div className="space-y-2">
            <p className="text-sm text-muted-fg">This assisted product will be saved as a draft. Open the saved draft to review and publish it.</p>
            <label className="flex items-start gap-2 text-sm" htmlFor="f-contentAuthorized">
              <input id="f-contentAuthorized" type="checkbox" checked={contentAuthorized} aria-invalid={errors.contentAuthorized ? true : undefined}
                aria-describedby={errors.contentAuthorized ? 'e-contentAuthorized' : undefined} onChange={e => setContentAuthorized(e.target.checked)} />
              I wrote this content or have permission to reuse it, and may use the selected image on this affiliate website.
            </label>{err('contentAuthorized')}
          </div>}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button type="button" className="btn" disabled={saving || uploadRef.current} onClick={requestClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || (upload !== null && upload.pct >= 0)}>
              {saving ? 'Saving…' : assistance ? 'Save draft' : 'Save product'}
            </button>
          </div>
        </div>
      </form>
    </Dialog><ConfirmDialog open={discard} title="Discard unsaved changes?" message="Your changes have not been saved to the product." confirmLabel="Discard changes" danger onClose={() => setDiscard(false)} onConfirm={() => { setDiscard(false); onClose(); }} /></>
  );
}

/** The id writers list under `products:` in an article's front matter. */
function ProductIdForArticles({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the id stays selectable below.
    }
  };
  return (
    <div className="border-t border-line pt-4">
      <p className="field-label">Product id (for articles)</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-sm break-all select-all">{id}</code>
        <button type="button" className="btn !min-h-9 !text-sm" onClick={copy}>
          {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy id'}
        </button>
      </div>
      <p className="text-sm text-muted-fg mt-1">List it under <code>products:</code> in an article to show this find as a card. See content/articles/README.md.</p>
    </div>
  );
}
