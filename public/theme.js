// Applies the saved light/dark theme before React renders (avoids a flash).
try {
  var t = localStorage.getItem('araccoon_theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
