import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { api, HttpError } from '../lib/api';
import { useReplaceSiteText } from '../lib/siteText';
import { PageHeader } from './AdminLayout';
import { useToast } from '../components/Toasts';
import { SITE_TEXT_FIELDS, SITE_TEXT_KEYS, type SiteText, type SiteTextKey, type SiteTextPatch, type SiteTextState } from '../../shared/siteText';

/** Owner editor for the short storefront copy (hero, story, footer, search snippet). */
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

  const reset = (key: SiteTextKey) => void save({ [key]: null }, `"${SITE_TEXT_FIELDS[key].label}" reset to the default.`);

  return (
    <div>
      <PageHeader title="Site text" subtitle="Edit the short copy on the storefront. Empty slots are not allowed; reset a field to bring back its original text." />
      {loadError && <p role="alert" className="field-error">{loadError}</p>}
      {!form && !loadError && <p className="text-sm text-muted-fg" role="status">Loading…</p>}
      {form && state && (
        <form onSubmit={submit} className="panel p-5 space-y-6 max-w-3xl" noValidate>
          {Object.keys(errors).length > 0 && (
            <p ref={errorRef} role="alert" tabIndex={-1} className="field-error">Please review the highlighted fields. Your text is still here.</p>
          )}
          {SITE_TEXT_KEYS.map(key => {
            const field = SITE_TEXT_FIELDS[key];
            const id = `st-${key}`;
            const value = form[key];
            const custom = state.customized.includes(key);
            const describedBy = [`${id}-help`, errors[key] ? `${id}-error` : ''].filter(Boolean).join(' ');
            const props = {
              id, value, maxLength: field.max, disabled: saving, className: 'field',
              'aria-invalid': errors[key] ? true : undefined, 'aria-describedby': describedBy,
              onChange: (e: { target: { value: string } }) => setForm({ ...form, [key]: e.target.value }),
            };
            return (
              <div key={key}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <label htmlFor={id} className="field-label">{field.label}</label>
                  <span className="text-xs text-muted-fg">{custom ? 'Edited' : 'Default'} · {value.trim().length}/{field.max}</span>
                </div>
                {field.multiline ? <textarea {...props} rows={2} /> : <input {...props} type="text" />}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                  <p id={`${id}-help`} className="text-xs text-muted-fg">{field.help}</p>
                  {custom && (
                    <button type="button" className="btn !min-h-9 !text-sm" disabled={saving} onClick={() => reset(key)}>
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Reset to default
                    </button>
                  )}
                </div>
                {errors[key] && <p id={`${id}-error`} className="field-error">{errors[key]}</p>}
              </div>
            );
          })}
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
