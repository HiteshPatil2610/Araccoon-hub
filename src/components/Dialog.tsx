import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useDialog } from '../lib/useDialog';

/** Accessible modal: labelled, focus-trapped, Escape closes, background inert. */
export function Dialog({ open, onClose, title, children, wide = false, busy = false }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; busy?: boolean;
}) {
  const close = () => { if (!busy) onClose(); };
  const ref = useDialog(open, close);
  useEffect(() => {
    if (open && !busy && ref.current && !ref.current.contains(document.activeElement)) {
      (ref.current.querySelector<HTMLElement>('[data-initial-focus]') || ref.current).focus();
    }
  }, [open, busy, ref]);
  if (!open) return null;
  const titleId = `dlg-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className={`relative panel !rounded-b-none sm:!rounded-2xl w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id={titleId} className="text-3xl sm:text-4xl">{title}</h2>
          <button type="button" disabled={busy} onClick={close} aria-label="Close" className="btn btn-ghost !px-3"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel, danger, busy, onConfirm, onClose }: {
  open: boolean; title: string; message: ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Dialog open={open} busy={busy} onClose={onClose} title={title}>
      <div className="text-sm text-muted-fg mb-6">{message}</div>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <button type="button" data-initial-focus className="btn" disabled={busy} onClick={onClose}>Cancel</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={onConfirm}>
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
