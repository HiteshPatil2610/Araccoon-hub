import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useDialog } from '../lib/useDialog';
import { HERO_CUES, Reveal, SectionLabel, TrackingReveal, useHeroEntrance, usePrefersReducedMotion } from './cine';
import { CATEGORIES } from '../../shared/types';
import { useSiteText } from '../lib/siteText';
import { StashNavButton } from './StashNavButton';
import { playStashFlaps, useStashFlaps } from '../lib/useStashFlaps';
import { stashDirection } from '../lib/stashFlaps';

const LINKS = [
  { id: 'top', label: 'Featured' },
  { id: 'picks', label: 'Picks' },
  { id: 'story', label: 'Story' },
  { id: 'finds', label: 'Browse' },
] as const;

const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth');

/**
 * Scrolls to a storefront section. From another page it moves to the storefront inside the app (no full reload,
 * so the hero intro does not replay) and jumps once the section exists; a second jump corrects for content that
 * loaded above it, unless the visitor has started scrolling.
 */
export function useSectionLink() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onStorefront = pathname === '/' || pathname.startsWith('/find/');
  const go = useCallback((id: string) => {
    if (onStorefront) { document.getElementById(id)?.scrollIntoView({ behavior: smooth() }); return; }
    let tries = 0;
    let moved = false;
    const stop = () => { moved = true; };
    const guards = ['wheel', 'touchstart', 'keydown'] as const;
    for (const type of guards) window.addEventListener(type, stop, { passive: true });
    const done = () => { for (const type of guards) window.removeEventListener(type, stop); };
    const jump = () => document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
    const seek = () => {
      if (document.getElementById(id)) { jump(); setTimeout(() => { if (!moved) jump(); done(); }, 700); }
      else if (++tries < 120) requestAnimationFrame(seek);
      else done();
    };
    const move = () => { navigate(`/#${id}`); requestAnimationFrame(seek); };
    // Leaving Your lists plays the box flaps, as every other way out of it does; the jump happens behind them.
    const direction = stashDirection(window.location.pathname, '/');
    if (direction) playStashFlaps(direction, '/', move); else move();
  }, [onStorefront, navigate]);
  return { onStorefront, go };
}

/** A link to a storefront section (`/#finds`) that lands on it from any page. */
export function SectionLink({ section: id, className, children }: { section: string; className?: string; children: ReactNode }) {
  const section = useSectionLink();
  return <a href={`/#${id}`} className={className} onClick={e => { if (!section.onStorefront) { e.preventDefault(); section.go(id); } }}>{children}</a>;
}

/**
 * Fixed nav. Sections marked data-nav-tone="dark" (the black hero and picks curtain) get a dark
 * nav with white type; everything else follows the page theme. The link for the section under the nav is current.
 */
export function Navbar() {
  const introReady = useHeroEntrance();
  const reducedMotion = usePrefersReducedMotion();
  const [introDone, setIntroDone] = useState(false);
  const introEnabled = introReady !== null && !introDone;
  const { dark, toggle } = useTheme();
  useStashFlaps();
  const [overDark, setOverDark] = useState(true);
  const [current, setCurrent] = useState<string>('top');
  const section = useSectionLink();

  useEffect(() => { if (reducedMotion) setIntroDone(true); }, [reducedMotion]);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 96) setIntroDone(true);
      const y = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 96) / 2;
      let tone = false;
      for (const el of document.querySelectorAll<HTMLElement>('[data-nav-tone]')) {
        const r = el.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) {
          tone = el.dataset.navTone === 'dark';
        }
      }
      setOverDark(tone);
      let at = '';
      for (const l of LINKS) {
        const r = document.getElementById(l.id)?.getBoundingClientRect();
        if (r && r.top <= y * 2) at = l.id;
      }
      setCurrent(at);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);

  return (
    <header className={`cd-nav ${overDark ? 'cd-nav--over-dark' : ''} ${introEnabled ? 'cd-nav--intro' : ''} ${introEnabled && introReady ? 'cd-nav--intro-shown' : ''}`} style={{ '--nav-entry-delay': `${HERO_CUES.nav}ms` } as CSSProperties}
      onFocusCapture={() => setIntroDone(true)} onAnimationEnd={e => { if (e.animationName === 'hero-nav-arrive') setIntroDone(true); }} data-morph-root>
      <a href="#main" className="skip-link">Skip to content</a>
      <div className="cd-nav__inner">
        <Link to="/" className="inline-flex items-center min-h-11 font-display text-[26px] sm:text-[32px] leading-none pt-1 justify-self-start" aria-label="Raccoon Hub home" data-morph="type">
          Raccoon<span className="text-red"> Hub</span>
        </Link>
        <nav aria-label="Site" className="cd-nav__center" data-morph="move">
          <ul className="cd-nav__links eyebrow">
            {LINKS.map((l, i) => (
              <Fragment key={l.id}>
                {i > 0 && <li aria-hidden="true" className="cd-nav__dot" />}
                <li><a href={`/#${l.id}`} aria-current={current === l.id ? 'location' : undefined}
                  onClick={(e: MouseEvent) => { if (!section.onStorefront) { e.preventDefault(); section.go(l.id); } }}>{l.label}</a></li>
              </Fragment>
            ))}
            <li aria-hidden="true" className="cd-nav__dot" />
            <li><NavLink to="/articles">Journal</NavLink></li>
            <li aria-hidden="true" className="cd-nav__dot" />
            <li><NavLink to="/stash">Stash</NavLink></li>
            <li aria-hidden="true" className="cd-nav__dot" />
            <li><Link to="/admin">Owner hub</Link></li>
          </ul>
        </nav>
        <div className="flex gap-1.5 justify-self-end items-center" data-morph="move">
          <StashNavButton />
          <button type="button" onClick={toggle} className="icon-btn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? <Sun className="w-[18px] h-[18px]" strokeWidth={1.5} /> : <Moon className="w-[18px] h-[18px]" strokeWidth={1.5} />}
          </button>
          <MenuButton current={current} />
        </div>
      </div>
    </header>
  );
}

const EASE = [0.83, 0, 0.17, 1] as const; // --ease-curtain

// The menu disc's two lines (long over short) fold into a cross; they sit 5.6px apart (1.6px line + 4px gap).
const LINE_TOP = { closed: { width: 20, y: 0, rotate: 0 }, open: { width: 20, y: 2.8, rotate: 45 } };
const LINE_BOTTOM = { closed: { width: 13, y: 0, rotate: 0 }, open: { width: 20, y: -2.8, rotate: -45 } };

/** Phone/tablet navigation: the design system's solid menu disc opens a full-screen black curtain that
    grows out of the button as a circle; links rise in one after another. Desktop keeps the inline links.
    The curtain's close button is drawn in exactly the same place and colours as the menu disc, so the
    disc appears to stay put while its two lines turn into a cross (and back on close). */
function MenuButton({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState('100% 0%');
  const [from, setFrom] = useState({ bg: '#fff', fg: '#0A0A0A' });
  const panel = useDialog(open, () => setOpen(false));
  const section = useSectionLink();

  const show = () => {
    const el = btn.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setOrigin(`${r.left + r.width / 2}px ${r.top + r.height / 2}px`);
      const style = getComputedStyle(el);
      setFrom({ bg: style.backgroundColor, fg: style.color });
    }
    setOpen(true);
  };
  const go = (id: string) => {
    setOpen(false);
    // let the curtain start closing, then glide to the section
    requestAnimationFrame(() => section.go(id));
  };

  return (
    <>
      <button ref={btn} type="button" className="cd-menu-btn" onClick={show} aria-label="Open menu" aria-expanded={open} aria-haspopup="dialog">
        <span /><span />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div ref={panel} role="dialog" aria-modal="true" aria-label="Menu" tabIndex={-1} className="cd-menu"
            initial={{ clipPath: `circle(0px at ${origin})` }}
            animate={{ clipPath: `circle(150vmax at ${origin})` }}
            exit={{ clipPath: `circle(0px at ${origin})` }}
            transition={{ duration: 0.7, ease: EASE }}>
            <div className="cd-menu__top">
              <span className="font-display text-[26px] sm:text-[32px] leading-none pt-1">Raccoon<span className="text-red"> Hub</span></span>
              <motion.button type="button" className="cd-menu-btn cd-menu-btn--close" onClick={() => setOpen(false)} aria-label="Close menu" data-initial-focus
                initial={{ backgroundColor: from.bg, color: from.fg }} animate={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }} exit={{ backgroundColor: from.bg, color: from.fg }}
                transition={{ duration: 0.45, ease: EASE }}>
                <motion.span initial={LINE_TOP.closed} animate={LINE_TOP.open} exit={LINE_TOP.closed} transition={{ duration: 0.45, ease: EASE }} />
                <motion.span initial={LINE_BOTTOM.closed} animate={LINE_BOTTOM.open} exit={LINE_BOTTOM.closed} transition={{ duration: 0.45, ease: EASE }} />
              </motion.button>
            </div>
            <nav aria-label="Site" className="cd-menu__links">
              {[...LINKS.map(l => ({ ...l, to: '' })), { id: 'articles', label: 'Journal', to: '/articles' }, { id: 'stash', label: 'Your stash', to: '/stash' }, { id: 'admin', label: 'Owner hub', to: '/admin' }].map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.7, delay: 0.18 + i * 0.07, ease: [0.7, 0, 0.2, 1] }}>
                  {l.to
                    ? <NavLink to={l.to} className="cd-menu__link" onClick={() => setOpen(false)}><span className="cd-menu__n">{String(i + 1).padStart(2, '0')}</span>{l.label}</NavLink>
                    : <a href={`/#${l.id}`} className="cd-menu__link" aria-current={current === l.id ? 'location' : undefined}
                        onClick={e => { e.preventDefault(); go(l.id); }}><span className="cd-menu__n">{String(i + 1).padStart(2, '0')}</span>{l.label}</a>}
                </motion.div>
              ))}
            </nav>
            <motion.p className="cd-menu__foot eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }}>
              Small finds . Big everyday upgrades .
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function Footer() {
  const text = useSiteText();
  return (
    <footer className="mt-auto bg-[var(--stage-bg)] text-[var(--stage-fg)] relative" data-morph-root>
      <div className="h-[3px]" style={{ background: 'var(--gradient-section-edge)' }} aria-hidden="true" />
      {/* The crimson wordmark band carries most of the page's 10% accent. */}
      <div className="cd-footer__brand">
        <div className="max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)]">
          <TrackingReveal from="0.3em" once className="overflow-hidden" morph="type">
            <p className="font-display text-[clamp(64px,15vw,220px)] leading-[.8] whitespace-nowrap text-center">Raccoon<span className="cd-footer__hub"> Hub</span></p>
          </TrackingReveal>
        </div>
      </div>
      <div className="max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)]">
        <div className="cd-footer__details">
          <div data-morph="move">
            <SectionLabel>The idea</SectionLabel>
            <p className="mt-4 text-sm text-[var(--stage-muted)] max-w-xs">{text.footerIdea}</p>
          </div>
          <nav aria-label="Categories" data-morph="move">
            <SectionLabel>Browse</SectionLabel>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
              {CATEGORIES.map(c => <li key={c}><Link to={`/?category=${encodeURIComponent(c)}`} className="inline-flex min-h-11 items-center font-display text-xl hover:text-red transition-colors">{c}</Link></li>)}
            </ul>
          </nav>
          <div className="text-sm text-[var(--stage-muted)]" data-morph="move">
            <SectionLabel className="text-[var(--stage-fg)]">Good to know</SectionLabel>
            <p className="mt-4">Prices and availability are shown on Amazon and may change.</p>
            <Link to="/articles" className="inline-flex min-h-11 items-center mt-1 mr-4 eyebrow text-[var(--stage-muted)] hover:text-[var(--stage-fg)]">Journal ↗</Link>
            <Link to="/admin" className="inline-flex min-h-11 items-center mt-1 eyebrow text-[var(--stage-muted)] hover:text-[var(--stage-fg)]">Owner sign-in ↗</Link>
          </div>
          <Reveal effect="rise" distance={24} once className="cd-footer__mascot" morph="move">
            <img src="/art/video-concept/raccoon-closing-heart.webp" srcSet="/art/video-concept/raccoon-closing-heart-720.webp 676w, /art/video-concept/raccoon-closing-heart.webp 1200w" sizes="(max-width: 639px) 270px, (max-width: 1023px) 340px, 31vw" alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} />
          </Reveal>
        </div>
      </div>
      <div className="border-t border-[var(--stage-line)]">
        <p className="max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)] py-5 text-xs text-[var(--stage-muted)]">
          <strong className="text-[var(--stage-fg)] font-semibold">Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases.
          {' '}· © {new Date().getFullYear()} Raccoon Hub
        </p>
      </div>
    </footer>
  );
}

const DISMISS_KEY = 'rh-announcement-dismissed';

/**
 * Owner announcement from Site text: a small banner pinned to the bottom of the page.
 * Hidden when the text is empty; a visitor can close it for the rest of the visit
 * (until the owner changes the text).
 */
export function Announcement() {
  const { announcement, announcementLink } = useSiteText();
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY); } catch { return null; }
  });
  if (!announcement || dismissed === announcement) return null;

  const close = () => {
    setDismissed(announcement);
    try { sessionStorage.setItem(DISMISS_KEY, announcement); } catch { /* private mode: closes for this page only */ }
  };
  const label = <>{announcement}{announcementLink && <span aria-hidden="true"> →</span>}</>;
  const linkClass = 'min-w-0 flex-1 py-2 text-sm font-semibold underline-offset-4 hover:underline';

  return (
    <aside aria-label="Announcement" className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex max-w-xl items-center gap-2 rounded-full bg-ink text-white pl-5 pr-1.5 shadow-lg border border-white/15">
        {!announcementLink ? <p className="min-w-0 flex-1 py-2 text-sm font-semibold">{announcement}</p>
          : announcementLink.startsWith('/') ? <Link to={announcementLink} className={linkClass}>{label}</Link>
          : <a href={announcementLink} target="_blank" rel="noopener noreferrer" className={linkClass}>{label}</a>}
        <button type="button" onClick={close} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close announcement">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
