import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useDialog } from '../lib/useDialog';
import { HERO_CUES, Reveal, SectionLabel, TrackingReveal, useHeroEntrance, usePrefersReducedMotion } from './cine';
import { CATEGORIES } from '../../shared/types';

const LINKS = [
  { id: 'top', label: 'Featured' },
  { id: 'picks', label: 'Picks' },
  { id: 'story', label: 'Story' },
  { id: 'finds', label: 'Browse' },
] as const;

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
  const [overDark, setOverDark] = useState(true);
  const [current, setCurrent] = useState<string>('top');

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
                <li><a href={`/#${l.id}`} aria-current={current === l.id ? 'location' : undefined}>{l.label}</a></li>
              </Fragment>
            ))}
            <li aria-hidden="true" className="cd-nav__dot" />
            <li><Link to="/admin">Owner hub</Link></li>
          </ul>
        </nav>
        <div className="flex gap-1.5 justify-self-end items-center" data-morph="move">
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

/** Phone/tablet navigation: the design system's solid menu disc opens a full-screen black curtain that
    grows out of the button as a circle; links rise in one after another. Desktop keeps the inline links. */
function MenuButton({ current }: { current: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const [origin, setOrigin] = useState('100% 0%');
  const panel = useDialog(open, () => setOpen(false));

  const show = () => {
    const r = btn.current?.getBoundingClientRect();
    if (r) setOrigin(`${r.left + r.width / 2}px ${r.top + r.height / 2}px`);
    setOpen(true);
  };
  const go = (id: string) => {
    setOpen(false);
    // let the curtain start closing, then glide to the section
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
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
              <button type="button" className="icon-btn !border-white/70" onClick={() => setOpen(false)} aria-label="Close menu" data-initial-focus><X className="w-5 h-5" /></button>
            </div>
            <nav aria-label="Site" className="cd-menu__links">
              {[...LINKS.map(l => ({ ...l, to: '' })), { id: 'admin', label: 'Owner hub', to: '/admin' }].map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.7, delay: 0.18 + i * 0.07, ease: [0.7, 0, 0.2, 1] }}>
                  {l.to
                    ? <Link to={l.to} className="cd-menu__link" onClick={() => setOpen(false)}><span className="cd-menu__n">{String(i + 1).padStart(2, '0')}</span>{l.label}</Link>
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
  return (
    <footer className="mt-auto bg-ink text-white relative" data-morph-root>
      <div className="h-[3px]" style={{ background: 'var(--gradient-section-edge)' }} aria-hidden="true" />
      <div className="max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)] pt-14">
        <TrackingReveal from="0.3em" once className="overflow-hidden" morph="type">
          <p className="font-display text-[clamp(64px,15vw,220px)] leading-[.8] whitespace-nowrap text-center">Raccoon<span className="text-red"> Hub</span></p>
        </TrackingReveal>
        <div className="cd-footer__details mt-12 border-t border-white/10">
          <div data-morph="move">
            <SectionLabel>The idea</SectionLabel>
            <p className="mt-4 text-sm text-[var(--cd-gray-300)] max-w-xs">A small internet treasure map of clever objects and useful oddities.</p>
          </div>
          <nav aria-label="Categories" data-morph="move">
            <SectionLabel>Browse</SectionLabel>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
              {CATEGORIES.map(c => <li key={c}><Link to={`/?category=${encodeURIComponent(c)}`} className="inline-flex min-h-11 items-center font-display text-xl hover:text-red transition-colors">{c}</Link></li>)}
            </ul>
          </nav>
          <div className="text-sm text-[var(--cd-gray-300)]" data-morph="move">
            <SectionLabel className="text-white">Good to know</SectionLabel>
            <p className="mt-4">Prices and availability are shown on Amazon and may change.</p>
            <Link to="/admin" className="inline-flex min-h-11 items-center mt-1 eyebrow text-white/60 hover:text-white">Owner sign-in ↗</Link>
          </div>
          <Reveal effect="rise" distance={24} once className="cd-footer__mascot" morph="move">
            <img src="/art/video-concept/raccoon-closing-heart.webp" alt="" aria-hidden="true" loading="lazy" decoding="async" draggable={false} />
          </Reveal>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="max-w-[var(--page-max)] mx-auto px-[var(--page-gutter)] py-5 text-xs text-[var(--cd-gray-300)]">
          <strong className="text-white font-semibold">Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases.
          {' '}· © {new Date().getFullYear()} Raccoon Hub
        </p>
      </div>
    </footer>
  );
}
