import { NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { Activity, BarChart3, ExternalLink, Gauge, LogOut, Moon, Package, Settings, Sun } from 'lucide-react';
import { useAuth } from './auth';
import { useTheme } from '../lib/theme';

const NAV = [
  { to: '/admin', label: 'Overview', icon: Gauge, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
  { to: '/admin/settings', label: 'Account', icon: Settings },
];

export function AdminLayout() {
  const { state, owner, error, refresh, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const location = useLocation();

  if (error) return (
    <main className="min-h-screen bg-bg text-fg flex items-center justify-center p-6">
      <div className="max-w-lg w-full panel p-6 sm:p-8">
        <p className="eyebrow text-red mb-3">Owner hub</p>
        <h1 className="text-4xl sm:text-5xl">Couldn’t check access</h1>
        <p role="alert" className="text-muted-fg mt-4">{error}</p>
        <p className="text-sm text-muted-fg mt-2">Your session hasn’t been changed. Try again when the service is available.</p>
        <div className="flex flex-wrap gap-3 mt-6">
          <button type="button" className="btn btn-primary" onClick={() => void refresh()}>Try again</button>
          <a href="/" className="btn">Back to the finds</a>
        </div>
      </div>
    </main>
  );
  if (!state) return <p className="p-8 font-bold text-muted-fg" aria-busy="true">Checking access…</p>;
  if (!owner) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (owner.needsPasskey && location.pathname !== '/admin/settings') return <Navigate to="/admin/settings" replace />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr] bg-bg">
      <a href="#owner-main" className="skip-link">Skip to workspace</a>
      <aside className="hidden lg:flex flex-col bg-ink text-white p-4 gap-1 sticky top-0 h-screen border-r border-white/10">
        <NavLink to="/" className="px-3 pt-3 mb-8">
          <span className="block font-display text-[34px] leading-none">Raccoon<span className="text-red"> Hub</span></span>
          <span className="eyebrow text-white/60">Owner hub .</span>
        </NavLink>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex items-center gap-3 px-4 min-h-11 rounded-full font-display text-xl pt-0.5 transition-colors ${isActive ? 'bg-white text-ink' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
            <Icon className="w-4 h-4" aria-hidden="true" /> {label}
          </NavLink>
        ))}
        <div className="mt-auto space-y-2">
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-2 px-3 min-h-11 eyebrow text-white/60 hover:text-white">
            <ExternalLink className="w-4 h-4" /> View store
          </a>
          <div className="rounded-[var(--radius-m)] bg-ink-700 p-3">
            <p className="text-sm font-semibold truncate">{owner.displayName || owner.email}</p>
            <p className="text-sm text-[var(--cd-gray-300)] truncate">{owner.email}</p>
            <div className="flex gap-2 mt-2">
              <button type="button" className="icon-btn !border-white/50" onClick={toggle} aria-label={dark ? 'Light mode' : 'Dark mode'}>{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
              <button type="button" className="icon-btn !border-white/50" onClick={signOut} aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 border-b border-line bg-[var(--nav-bg)] backdrop-blur">
          <NavLink to="/" className="inline-flex items-center min-h-11 font-display text-2xl leading-none pt-1">← Raccoon<span className="text-red"> Hub</span></NavLink>
          <div className="flex gap-2">
            <button type="button" className="icon-btn" onClick={toggle} aria-label={dark ? 'Light mode' : 'Dark mode'}>{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</button>
            <button type="button" className="icon-btn" onClick={signOut} aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
          </div>
        </header>
        <nav aria-label="Owner sections" className="lg:hidden flex flex-wrap gap-2 p-4 border-b border-line bg-card">
          {NAV.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `btn !text-lg ${isActive ? 'btn-sun' : ''}`}>{label}</NavLink>)}
        </nav>
        {owner.needsPasskey && (
          <p role="alert" className="m-4 panel-sm !bg-coral text-on-coral p-3 text-sm font-bold">
            You signed in with a recovery code. Add a new passkey below to unlock the rest of the hub.
          </p>
        )}
        <main id="owner-main" tabIndex={-1} className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-4 border-b border-line">
      <div>
        <h1 className="text-[clamp(44px,5vw,64px)]">{title}</h1>
        {subtitle && <p className="text-sm text-muted-fg mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
