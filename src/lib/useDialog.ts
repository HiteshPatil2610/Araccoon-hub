import { useEffect, useRef } from 'react';

// Shared behavior for the existing dialog shells, including background isolation.
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog: HTMLDivElement = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const isolated: HTMLElement[] = [];
    let branch: HTMLElement = dialog;
    while (branch.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (sibling !== branch && sibling instanceof HTMLElement && !sibling.inert) {
          sibling.inert = true;
          isolated.push(sibling);
        }
      }
      branch = branch.parentElement;
    }
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]'))
      .filter(el => !el.hasAttribute('disabled') && el.tabIndex >= 0 && el.getClientRects().length > 0);
    (dialog.querySelector<HTMLElement>('[data-initial-focus]') || focusable()[0] || dialog).focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    const containFocus = (event: FocusEvent) => {
      if (!dialog.contains(event.target as Node)) (focusable()[0] || dialog).focus();
    };
    document.addEventListener('focusin', containFocus);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('focusin', containFocus);
      isolated.forEach(el => { el.inert = false; });
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
      else document.querySelector<HTMLElement>('main button, main a[href]')?.focus();
    };
  }, [open]);
  return ref;
}
