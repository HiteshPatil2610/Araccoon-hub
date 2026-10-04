import { MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import './index.css';
import { Storefront } from './pages/Storefront';
import { ToastProvider } from './components/Toasts';
// Entry point only: keep components out of this file so Fast Refresh never re-runs it (that would mount a second root).
import { NotFound } from './pages/NotFound';

// The owner hub (and the charting library) load only when /admin is visited.
const page = (load: () => Promise<{ Component: React.ComponentType }>) => ({ lazy: load });

const router = createBrowserRouter([
  { path: '/', element: <Storefront /> },
  { path: '/raccoon-preview', ...page(async () => ({ Component: (await import('./pages/RaccoonPreview')).RaccoonPreview })) },
  {
    path: '/admin',
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
          { path: 'activity', ...page(async () => ({ Component: (await import('./admin/Activity')).ActivityLog })) },
          { path: 'settings', ...page(async () => ({ Component: (await import('./admin/Settings')).Settings })) },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user"><ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider></MotionConfig>
  </StrictMode>,
);
