import { Outlet, useLocation } from 'react-router';
import { usePageMeta } from '../lib/pageMeta';
import { AuthProvider } from './auth';

const TITLES: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/products': 'Products',
  '/admin/collections': 'Collections',
  '/admin/analytics': 'Analytics',
  '/admin/site-text': 'Site text',
  '/admin/activity': 'Activity',
  '/admin/settings': 'Account',
  '/admin/login': 'Sign in',
  '/admin/invite': 'Accept invitation',
};

/** Everything under /admin lives in this lazily loaded chunk. */
export default function AdminApp() {
  const { pathname } = useLocation();
  const page = TITLES[pathname.replace(/\/+$/, '') || '/admin'];
  usePageMeta(page ? `${page} — Raccoon Hub owner hub` : 'Raccoon Hub owner hub');
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
