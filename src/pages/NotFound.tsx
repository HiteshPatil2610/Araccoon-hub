import { Link } from 'react-router';
import { ScrambleText, SectionLabel, Viewfinder } from '../components/cine';

export function NotFound() {
  return (
    <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-6 bg-ink text-white text-center">
      <Viewfinder size="min(640px, 90vw)" />
      <div aria-hidden="true" className="absolute left-1/2 top-1/2 w-[min(380px,70vw)] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-red" />
      <div className="relative">
        <SectionLabel>Reel missing</SectionLabel>
        <p className="font-display text-[clamp(140px,30vw,320px)] leading-[.8] mt-4" aria-hidden="true"><ScrambleText text="404" charset="0123456789" /></p>
        <h1 className="text-[clamp(40px,6vw,64px)] mt-2">Nothing here</h1>
        <p className="text-sm text-[var(--cd-gray-300)] mt-2">The raccoon looked everywhere.</p>
        <Link to="/" className="btn btn-primary mt-6">Back to the finds</Link>
      </div>
    </main>
  );
}
