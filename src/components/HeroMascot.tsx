import type { CSSProperties } from 'react';
import { HERO_CUES, useHeroEntrance } from './cine';

const HERO_ART = '/art/video-concept/raccoon-hero-crossed-arms.webp';

/** Night reveal: only the eyes are lit at first; the mascot then appears in place as a silhouette
    against the growing disc and fills with colour while the eye layer fades. */
function HeroArt({ src }: { src: string }) {
  const ready = useHeroEntrance();
  const img = () => <img src={src} alt="" decoding="async" loading="eager" fetchPriority="high" draggable={false} />;
  return <div className={`cd-hero__art ${ready !== false ? 'cd-hero__art--shown' : ''}`} style={{
    '--mascot-delay': `${HERO_CUES.mascot}ms`, '--colour-delay': `${HERO_CUES.colour}ms`, '--colour-fill': `${HERO_CUES.colourFill}ms`,
    '--eyes-out-delay': `${HERO_CUES.eyesOut}ms`, '--blink-delay': `${HERO_CUES.blink}ms`,
  } as CSSProperties}>
    <div className="cd-hero__figure">
      {img()}
      {/* Outside the entrance clock the mascot is shown at once, so there is nothing for the eyes to precede. */}
      {ready !== null && <div className="cd-hero__eyes" aria-hidden="true">{img()}</div>}
    </div>
  </div>;
}

/** Hero mascot cut-out. */
export function HeroMascot({ className }: { className: string }) {
  return (
    <div className={`cd-cutout ${className}`} data-morph="type">
      <HeroArt src={HERO_ART} />
    </div>
  );
}
