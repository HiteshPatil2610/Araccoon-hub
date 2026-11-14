// Applies the saved light/dark theme before React renders (avoids a flash).
try {
  var t = localStorage.getItem('araccoon_theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
// The home hero opens on black; hold the page black until it has painted (see .hero-opening in index.css).
try {
  var p = location.pathname;
  if ((p === '/' || p.indexOf('/find/') === 0) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('hero-opening');
  }
} catch (e) {}
