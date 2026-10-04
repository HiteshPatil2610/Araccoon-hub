import { useEffect, useRef } from 'react';
import type React from 'react';

/**
 * ASCII Wave Background — adapted from the reference IIFE implementation.
 * Ported to a React component for this project with:
 *   - dark / light mode theming via .dark / .dark-mode root class
 *   - position: absolute so it scrolls with the page
 *   - full document height coverage (not just viewport)
 *   - visibility-change pause, debounced resize, prefers-reduced-motion
 *   - TypeScript types throughout
 *
 * Tune the CONFIG object below to change look / feel / performance.
 */

const CONFIG = {
  charRamp:   ' .:-=+*#%@',  // low density → high density
  cellSize:   14,             // px per character cell
  fps:        30,             // target frame rate

  // Light mode
  lightColor:      '0, 0, 0',
  lightMinOpacity: 0.10,
  lightMaxOpacity: 0.16,

  // Dark mode
  darkColor:       '255, 255, 255',
  darkMinOpacity:  0.08,
  darkMaxOpacity:  0.16,
};

export const AsciiBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = motionPreference.matches;

    const isDark = () =>
      document.documentElement.classList.contains('dark') ||
      document.documentElement.classList.contains('dark-mode');

    let cols         = 0;
    let rows         = 0;
    let dpr          = Math.min(window.devicePixelRatio || 1, 2);
    let running      = true;
    let lastFrame    = 0;
    let rafId        = 0;
    const frameMs    = 1000 / CONFIG.fps;
    const startTime  = performance.now();

    // ── Wave octaves — each drifts in its own random direction ──────────
    // Computed once at startup. angle in radians, speed is time multiplier.
    interface Octave {
      scaleX:    number;
      scaleY:    number;
      dx:        number; // time contribution along X  (cos of random angle)
      dy:        number; // time contribution along Y  (sin of random angle)
      speed:     number;
      weight:    number;
    }

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const octaves: Octave[] = [
      { scaleX: 0.055, scaleY: 0.055, speed: rand(0.40, 0.70), weight: 0.40, dx: Math.cos(rand(0, Math.PI * 2)), dy: Math.sin(rand(0, Math.PI * 2)) },
      { scaleX: 0.035, scaleY: 0.080, speed: rand(0.25, 0.55), weight: 0.28, dx: Math.cos(rand(0, Math.PI * 2)), dy: Math.sin(rand(0, Math.PI * 2)) },
      { scaleX: 0.090, scaleY: 0.040, speed: rand(0.30, 0.60), weight: 0.20, dx: Math.cos(rand(0, Math.PI * 2)), dy: Math.sin(rand(0, Math.PI * 2)) },
      { scaleX: 0.060, scaleY: 0.100, speed: rand(0.20, 0.45), weight: 0.12, dx: Math.cos(rand(0, Math.PI * 2)), dy: Math.sin(rand(0, Math.PI * 2)) },
    ];
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      const w = window.innerWidth;
      const h = window.innerHeight;

      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width        = Math.floor(w * dpr);
      canvas.height       = Math.floor(h * dpr);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      cols = Math.ceil(w / CONFIG.cellSize) + 1;
      rows = Math.ceil(h / CONFIG.cellSize) + 1;

      ctx.font         = `${CONFIG.cellSize}px monospace`;
      ctx.textBaseline = 'top';
    };

    // ── Draw one frame ────────────────────────────────────────────────────
    const draw = (ts: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const dark    = isDark();
      const color   = dark ? CONFIG.darkColor      : CONFIG.lightColor;
      const minOp   = dark ? CONFIG.darkMinOpacity : CONFIG.lightMinOpacity;
      const maxOp   = dark ? CONFIG.darkMaxOpacity : CONFIG.lightMaxOpacity;
      const ramp    = CONFIG.charRamp;
      const rampLen = ramp.length - 1;

      for (let row = 0; row < rows; row++) {
        const y = row * CONFIG.cellSize;
        for (let col = 0; col < cols; col++) {
          const x = col * CONFIG.cellSize;

          // Each octave drifts in its own random direction — no single heading
          let v = 0;
          for (const o of octaves) {
            const t = ((ts - startTime) / 1000) * o.speed;
            v += Math.sin(col * o.scaleX + t * o.dx + row * o.scaleY + t * o.dy) * o.weight;
          }

          // Normalise [-1, 1] → [0, 1]
          const norm = (v + 1) / 2;

          const idx  = Math.max(0, Math.min(rampLen, Math.round(norm * rampLen)));
          const char = ramp[idx];
          if (char === ' ') continue; // cheap win — skip blank cells

          const alpha = minOp + norm * (maxOp - minOp);
          ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
          if (char) ctx.fillText(char, x, y);
        }
      }
    };

    // ── Animation loop ────────────────────────────────────────────────────
    const loop = (ts: number) => {
      if (!running) return;
      rafId = requestAnimationFrame(loop);
      if (ts - lastFrame < frameMs) return;
      lastFrame = ts;
      draw(ts);
    };

    // ── Visibility pause (saves CPU/battery on hidden tabs) ───────────────
    const onVisibility = () => {
      cancelAnimationFrame(rafId);
      running = !prefersReduced && document.visibilityState === 'visible';
      if (running) {
        lastFrame = 0;
        rafId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ── Debounced resize ──────────────────────────────────────────────────
    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { resize(); if (prefersReduced) draw(performance.now()); }, 150);
    };
    window.addEventListener('resize', onResize);

    const onMotionChange = () => { prefersReduced = motionPreference.matches; onVisibility(); if (prefersReduced) draw(performance.now()); };
    motionPreference.addEventListener('change', onMotionChange);
    // ── Boot ──────────────────────────────────────────────────────────────
    resize();

    if (prefersReduced) {
      draw(performance.now()); // single static frame
    } else {
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      motionPreference.removeEventListener('change', onMotionChange);
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        -1,
        pointerEvents: 'none',
        display:       'block',
        opacity:       0.4,
      }}
    />
  );
};

export default AsciiBackground;
