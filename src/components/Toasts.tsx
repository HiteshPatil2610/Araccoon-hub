import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

/** An optional button in the toast, e.g. Undo; the toast closes when it is used. */
export type ToastAction = { label: string; run: () => void };
type Toast = { id: number; kind: 'success' | 'error'; text: string; action?: ToastAction };
const Ctx = createContext<(kind: Toast['kind'], text: string, action?: ToastAction) => void>(() => {});

export function useToast() {
  return useContext(Ctx);
}

/** Small status messages, announced to screen readers via a live region. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string, action?: ToastAction) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, kind, text, action }]);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96">
        <AnimatePresence initial={false}>
          {toasts.map(t => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

/** One toast. Its timer pauses while it is hovered or holds focus, so it never disappears mid-read (WCAG 2.2.1). */
function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  // Longer when there is something to do, like Undo.
  const left = useRef(t.action ? 8000 : t.kind === 'error' ? 7000 : 4000);
  const [held, setHeld] = useState({ hover: false, focus: false });
  const paused = held.hover || held.focus;
  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = setTimeout(() => onDismiss(t.id), left.current);
    return () => { clearTimeout(timer); left.current = Math.max(1500, left.current - (Date.now() - started)); };
  }, [paused, onDismiss, t.id]);
  return (
    <motion.div layout role={t.kind === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.16, ease: [0.7, 0, 0.84, 0] } }}
      onPointerEnter={() => setHeld(h => ({ ...h, hover: true }))} onPointerLeave={() => setHeld(h => ({ ...h, hover: false }))}
      onFocus={() => setHeld(h => ({ ...h, focus: true }))} onBlur={() => setHeld(h => ({ ...h, focus: false }))}
      className={`panel !rounded-[var(--radius-m)] flex items-center gap-3 py-2 pl-4 pr-2 text-sm font-semibold shadow-[var(--shadow-card)] ${t.kind === 'error' ? '!bg-coral text-on-coral !border-[var(--cd-red-300)]' : '!bg-sun text-on-sun !border-transparent'}`}>
      {t.kind === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />}
      <span className="flex-1">{t.text}</span>
      {t.action && (
        <button type="button" className="min-h-11 shrink-0 px-2 pt-1 font-display text-xl leading-none uppercase underline underline-offset-4 decoration-1 hover:decoration-2" onClick={() => { t.action!.run(); onDismiss(t.id); }}>{t.action.label}</button>
      )}
      <button type="button" aria-label="Dismiss" className="min-h-11 min-w-11 p-2" onClick={() => onDismiss(t.id)}>
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}
