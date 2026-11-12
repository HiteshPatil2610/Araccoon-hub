import { Link } from 'react-router';
import { ScrambleText, SectionLabel, Viewfinder } from '../components/cine';
import { useNoIndex, usePageMeta } from '../lib/pageMeta';

export function NotFound() {
  usePageMeta('Page not found — Raccoon Hub');
  useNoIndex();
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-6 bg-ink text-white text-center">
      <Viewfinder size="min(640px, 90vw)" />
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 w-[min(380px,70vw)] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-red" />
      <div className="relative">
        <img src="/art/video-concept/raccoon-picks-box-720.webp" alt="" width={604} height={720} decoding="async" draggable={false} className="mx-auto h-40 w-auto mb-4 select-none" />
        <SectionLabel>Reel missing</SectionLabel>
        <p className="font-display text-[clamp(140px,30vw,320px)] leading-[.8] mt-4" aria-hidden="true"><ScrambleText text="404" charset="0123456789" /></p>
        <h1 className="text-[clamp(40px,6vw,64px)] mt-2">Nothing here</h1>
        <p className="text-sm text-[var(--cd-gray-300)] mt-2">The raccoon looked everywhere and came back with an empty box.</p>
        <Link to="/" className="btn btn-primary mt-6">Back to the finds</Link>
      </div>
    </main>
  );
}
