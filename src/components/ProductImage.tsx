import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';

/** Shared stable fallback; never replaces a catalog image with unrelated photography. */
export function ProductImage({ src, title, className = '', compact = false }: { src: string; title: string; className?: string; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return failed || !src ? <div className={`flex items-center justify-center p-2 bg-muted text-muted-fg text-center break-words ${className}`} role="img" aria-label={`Image unavailable: ${title}`}>{compact ? <ImageOff className="w-6 h-6 shrink-0" aria-hidden="true" /> : 'Image unavailable'}</div> : <img src={src} alt="" referrerPolicy="no-referrer" className={className} onError={() => setFailed(true)} />;
}
