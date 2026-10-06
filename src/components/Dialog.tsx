import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';
import { useDialog } from '../lib/useDialog';
import { usePrefersReducedMotion } from './cine';

/** Accessible modal: labelled, focus-trapped, Escape closes, background inert. */
type DialogProps = {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; busy?: boolean; animated?: boolean;
};

export function Dialog({ open, animated = false, ...props }: DialogProps) {
  // Presence retains the complete card while it exits, even when the caller clears its selection.
  const content = open ? <DialogContent key="dialog" {...props} animated={animated} /> : null;
  return animated ? <AnimatePresence>{content}</AnimatePresence> : content;
}

function DialogContent({ onClose, title, children, wide = false, busy = false, animated }: Omit<DialogProps, 'open'>) {
  const present = useIsPresent();
  const reducedMotion = usePrefersReducedMotion();
  const moving = animated && !reducedMotion;
  const close = () => { if (!busy && present) onClose(); };
  // Keep the focus trap, background isolation and scroll lock until the exit completes.
  const ref = useDialog(true, close);
  useEffect(() => {
    if (present && !busy && ref.current && !ref.current.contains(document.activeElement)) {
      (ref.current.querySelector<HTMLElement>('[data-initial-focus]') || ref.current).focus();
    }
  }, [present, busy, ref]);
  const titleId = `dlg-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      initial={false} animate={{ opacity: 1 }} exit={{ opacity: 1 }}
      onClickCapture={e => { if (!present) { e.preventDefault(); e.stopPropagation(); } }}
      onKeyDownCapture={e => { if (!present && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); } }}>
      <motion.div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true"
        initial={animated ? { opacity: 0 } : false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: moving ? 0.22 : 0 }} />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        initial={animated ? { opacity: 0, y: moving ? 32 : 0, scale: moving ? 0.97 : 1 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: moving ? 18 : 0, scale: moving ? 0.985 : 1 }}
        transition={{ duration: moving ? (present ? 0.32 : 0.18) : 0, ease: [0.22, 1, 0.36, 1] }}
        className={`relative panel !rounded-b-none sm:!rounded-2xl w-full min-w-0 max-w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-x-hidden overflow-y-auto p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id={titleId} className="text-3xl sm:text-4xl">{title}</h2>
          <button type="button" disabled={busy} onClick={close} aria-label="Close" className="btn btn-ghost shrink-0 !px-3"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
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
