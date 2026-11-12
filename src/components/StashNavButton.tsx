import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Bookmark } from 'lucide-react';
import { onFindSaved, useStashLists } from '../lib/stash';

const savedLabel = (n: number) => (n === 0 ? 'no saved finds yet' : n === 1 ? '1 saved find' : `${n} saved finds`);

/**
 * The nav's way to Your lists: a bookmark in the theme toggle's outline circle with the number of saved
 * finds. Whenever a find is saved in this tab (card disc, Quick View, the picker), the button fills
 * crimson while the bookmark turns over and lands filled, two rings ripple out and the number rolls up,
 * so visitors see where their finds went. The motion is CSS only (`.stash-nav*`), replayed by remounting
 * keyed parts; under reduced motion only the number changes.
 */
export function StashNavButton() {
  const { saved } = useStashLists();
  const count = saved.size;
  const { pathname } = useLocation();
  const [saves, setSaves] = useState(0);

  useEffect(() => onFindSaved(() => setSaves(n => n + 1)), []);

  return (
    <Link to="/stash" className="icon-btn stash-nav" aria-label={`Your stash, ${savedLabel(count)}`} aria-current={pathname === '/stash' ? 'page' : undefined}>
      {saves > 0 && <span key={saves} className="stash-nav__fx" aria-hidden="true"><span /><span /><span /></span>}
      <span key={`icon-${saves}`} className={`stash-nav__icon ${saves > 0 ? 'stash-nav__icon--saved' : ''}`} aria-hidden="true">
        <Bookmark className="stash-nav__outline" strokeWidth={1.5} />
        <Bookmark className="stash-nav__filled" strokeWidth={1.5} fill="currentColor" />
      </span>
      {count > 0 && (
        <span className="stash-nav__count" aria-hidden="true">
          <span key={saves} className={saves > 0 ? 'stash-nav__roll' : undefined}>{count > 99 ? '99+' : count}</span>
        </span>
      )}
    </Link>
  );
}
