import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import './index.css';
import { Storefront } from './pages/Storefront';
import { ToastProvider } from './components/Toasts';
import { SiteTextProvider } from './lib/siteText';
// Entry point only: keep components out of this file so Fast Refresh never re-runs it (that would mount a second root).
import { NotFound } from './pages/NotFound';
import { PageLoadError } from './pages/PageLoadError';

// The owner hub (and the charting library) load only when /admin is visited.
const page = (load: () => Promise<{ Component: React.ComponentType }>) => ({ lazy: load });

const router = createBrowserRouter([
  // /find/<slug> is the storefront with one find's quick view open; as a child route it keeps the page mounted.
  { path: '/', element: <Storefront />, ErrorBoundary: PageLoadError, children: [{ index: true, element: null }, { path: 'find/:slug', element: null }] },
  { path: '/articles', ErrorBoundary: PageLoadError, HydrateFallback: () => null, ...page(async () => ({ Component: (await import('./pages/Articles')).ArticleList })) },
  { path: '/articles/:slug', ErrorBoundary: PageLoadError, HydrateFallback: () => null, ...page(async () => ({ Component: (await import('./pages/Articles')).ArticlePage })) },
  { path: '/collections/:slug', ErrorBoundary: PageLoadError, HydrateFallback: () => null, ...page(async () => ({ Component: (await import('./pages/Collection')).CollectionPage })) },
  {
    path: '/admin',
    ErrorBoundary: PageLoadError,
    ...page(async () => ({ Component: (await import('./admin/AdminApp')).default })),
    HydrateFallback: () => null,
    children: [
      { path: 'login', ...page(async () => ({ Component: (await import('./admin/SignIn')).SignIn })) },
      { path: 'invite', ...page(async () => ({ Component: (await import('./admin/SignIn')).AcceptInvite })) },
      {
        ...page(async () => ({ Component: (await import('./admin/AdminLayout')).AdminLayout })),
        children: [
          { index: true, ...page(async () => ({ Component: (await import('./admin/Overview')).Overview })) },
          { path: 'products', ...page(async () => ({ Component: (await import('./admin/Products')).Products })) },
          { path: 'analytics', ...page(async () => ({ Component: (await import('./admin/Analytics')).Analytics })) },
          { path: 'collections', ...page(async () => ({ Component: (await import('./admin/Collections')).Collections })) },
          { path: 'site-text', ...page(async () => ({ Component: (await import('./admin/SiteText')).SiteTextEditor })) },
          { path: 'activity', ...page(async () => ({ Component: (await import('./admin/Activity')).ActivityLog })) },
          { path: 'settings', ...page(async () => ({ Component: (await import('./admin/Settings')).Settings })) },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound />, ErrorBoundary: PageLoadError },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user"><ToastProvider><SiteTextProvider>
      <RouterProvider router={router} />
    </SiteTextProvider></ToastProvider></MotionConfig>
  </StrictMode>,
);
