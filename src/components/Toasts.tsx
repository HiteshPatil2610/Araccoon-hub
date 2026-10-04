import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

type Toast = { id: number; kind: 'success' | 'error'; text: string };
const Ctx = createContext<(kind: Toast['kind'], text: string) => void>(() => {});

export function useToast() {
  return useContext(Ctx);
}

/** Small status messages, announced to screen readers via a live region. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-3), { id, kind, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), kind === 'error' ? 7000 : 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="fixed bottom-4 right-4 left-4 sm:left-auto z-[60] flex flex-col gap-2 sm:w-96">
        {toasts.map(t => (
          <div key={t.id} role={t.kind === 'error' ? 'alert' : 'status'}
            className={`panel !rounded-[var(--radius-m)] flex items-center gap-3 py-2 pl-4 pr-2 text-sm font-semibold shadow-[var(--shadow-card)] ${t.kind === 'error' ? '!bg-coral text-on-coral !border-[var(--cd-red-300)]' : '!bg-sun text-on-sun !border-transparent'}`}>
            {t.kind === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Dismiss" className="min-h-11 min-w-11 p-2" onClick={() => setToasts(x => x.filter(y => y.id !== t.id))}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
