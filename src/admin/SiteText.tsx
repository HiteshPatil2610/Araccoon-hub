import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { api, HttpError } from '../lib/api';
import { useReplaceSiteText } from '../lib/siteText';
import { PageHeader } from './AdminLayout';
import { useToast } from '../components/Toasts';
import { SITE_TEXT_GROUPS, SITE_TEXT_KEYS, siteTextField, type SiteText, type SiteTextKey, type SiteTextPatch, type SiteTextState } from '../../shared/siteText';

/** Owner editor for the short storefront copy (announcement, hero, footer, search snippet). */
export function SiteTextEditor() {
  const toast = useToast();
  const replaceLive = useReplaceSiteText();
  const [state, setState] = useState<SiteTextState | null>(null);
  const [form, setForm] = useState<SiteText | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const apply = (next: SiteTextState) => {
    setState(next);
    setForm(next.values);
    replaceLive(next.values);
  };

  useEffect(() => {
    api.adminSiteText().then(apply).catch(e => setLoadError(e instanceof Error ? e.message : 'Could not load the site text.'));
  }, []); // load once

  const changed = useMemo(
    () => (form && state ? SITE_TEXT_KEYS.filter(k => form[k].trim() !== state.values[k]) : []),
    [form, state],
  );

  const save = async (patch: SiteTextPatch, message: string) => {
    setSaving(true);
    setErrors({});
    try {
      apply(await api.updateSiteText(patch));
      toast('success', message);
    } catch (e) {
      if (e instanceof HttpError && Object.keys(e.fields).length) {
        setErrors(e.fields);
        requestAnimationFrame(() => errorRef.current?.focus());
      } else {
        toast('error', e instanceof Error ? e.message : 'Could not save.');
      }
    } finally {
      setSaving(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form || !changed.length) return;
    void save(Object.fromEntries(changed.map(k => [k, form[k]])), 'Site text saved. The live site updates within a minute.');
  };

  const reset = (key: SiteTextKey) => {
    const f = siteTextField(key);
    void save({ [key]: null }, f.optional ? `"${f.label}" cleared.` : `"${f.label}" reset to the default.`);
  };

  return (
    <div>
      <PageHeader title="Site text" subtitle="Change the wording visitors see on your site, without touching code. Saved changes show on the live site within a minute. Use Reset to go back to the original wording." />
      {loadError && <p role="alert" className="field-error">{loadError}</p>}
      {!form && !loadError && <p className="text-sm text-muted-fg" role="status">Loading…</p>}
      {form && state && (
        <form onSubmit={submit} className="panel p-5 space-y-6 max-w-3xl" noValidate>
          {Object.keys(errors).length > 0 && (
            <p ref={errorRef} role="alert" tabIndex={-1} className="field-error">Please review the highlighted fields. Your text is still here.</p>
          )}
          {SITE_TEXT_GROUPS.map(group => (
            <fieldset key={group} className="space-y-5">
              <legend className="eyebrow text-muted-fg mb-3">{group}</legend>
              {SITE_TEXT_KEYS.filter(key => siteTextField(key).group === group).map(key => {
                const field = siteTextField(key);
                const id = `st-${key}`;
                const value = form[key];
                const custom = state.customized.includes(key);
                const describedBy = [`${id}-help`, errors[key] ? `${id}-error` : ''].filter(Boolean).join(' ');
                const props = {
                  id, value, maxLength: field.max, disabled: saving, className: 'field',
                  placeholder: field.optional ? (field.link ? '/articles or https://…' : 'Empty: hidden') : undefined,
                  'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': describedBy,
                  onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
                };
                const status = field.optional ? (custom ? 'Shown' : 'Hidden') : custom ? 'Edited' : 'Default';
                return (
                  <div key={key}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <label htmlFor={id} className="field-label">{field.label}{field.optional && <span className="text-muted-fg font-normal"> (optional)</span>}</label>
                      <span className="text-xs text-muted-fg">{status} · {value.trim().length}/{field.max}</span>
                    </div>
                    {field.multiline ? <textarea {...props} rows={2} /> : <input {...props} type="text" inputMode={field.link ? 'url' : undefined} />}
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                      <p id={`${id}-help`} className="text-xs text-muted-fg">{field.help}</p>
                      {custom && (
                        <button type="button" className="btn !min-h-9 !text-sm" disabled={saving} onClick={() => reset(key)}>
                          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {field.optional ? 'Clear' : 'Reset to default'}
                        </button>
                      )}
                    </div>
                    {errors[key] && <p id={`${id}-error`} className="field-error">{errors[key]}</p>}
                  </div>
                );
              })}
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-line">
            <button type="submit" className="btn btn-primary" disabled={saving || !changed.length}>{saving ? 'Saving…' : 'Save changes'}</button>
            <button type="button" className="btn" disabled={saving || !changed.length} onClick={() => setForm(state.values)}>Discard</button>
            <span className="text-sm text-muted-fg" role="status">
              {changed.length ? `${changed.length} unsaved change${changed.length > 1 ? 's' : ''}` : state.updatedAt ? `Last saved ${new Date(state.updatedAt).toLocaleString()}` : 'Using the original text'}
            </span>
          </div>
        </form>
      )}
    </div>
  );
}
