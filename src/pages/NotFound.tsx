import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { ScrambleText, SectionLabel, Viewfinder } from '../components/cine';
import { useNoIndex, usePageMeta } from '../lib/pageMeta';

const otherWay = 'inline-flex min-h-11 items-center eyebrow text-[var(--cd-gray-300)] underline underline-offset-4 decoration-1 hover:text-white';

export function NotFound() {
  usePageMeta('Page not found — Raccoon Hub');
  useNoIndex();
  // The red disc is centred on the "404" and the heading starts just below the disc, so no line of text sits across its edge.
  const sizes = { '--disc': 'min(380px, 70vw)', '--numeral': 'clamp(140px, 30vw, 320px)' } as CSSProperties;
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-6 bg-ink text-white text-center" style={sizes}>
      <Viewfinder size="min(640px, 90vw)" />
      <div className="relative">
        <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} decoding="async" draggable={false} className="relative z-[1] mx-auto h-40 w-auto mb-4 select-none" />
        <SectionLabel className="relative z-[1]">Reel missing</SectionLabel>
        <div className="relative mt-4">
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 w-[var(--disc)] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-red" />
          <p className="relative font-display text-[length:var(--numeral)] leading-[.8]" aria-hidden="true"><ScrambleText text="404" charset="0123456789" /></p>
        </div>
        <h1 className="text-[clamp(40px,6vw,64px)] mt-[calc((var(--disc)_-_var(--numeral)_*_.8)_/_2_+_16px)]">Nothing here</h1>
        <p className="text-sm text-[var(--cd-gray-300)] mt-2">The raccoon looked everywhere and came back with an empty box.</p>
        <Link to="/" className="btn btn-primary mt-6">Back to the finds</Link>
        <p className="mt-4 flex flex-wrap justify-center gap-x-6">
          <Link to="/articles" className={otherWay}>Read the journal</Link>
          <Link to="/stash" className={otherWay}>Your stash</Link>
        </p>
      </div>
    </main>
  );
}
