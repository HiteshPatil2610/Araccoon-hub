import { createApp, type AppDeps } from './app';
import { authRoutes } from './routes/auth';
import { publicRoutes } from './routes/public';
import { adminProductRoutes } from './routes/adminProducts';
import { adminAnalyticsRoutes } from './routes/adminAnalytics';
import { adminSecurityRoutes } from './routes/adminSecurity';
import { webhookRoutes } from './routes/webhooks';
import { adminSiteTextRoutes, publicSiteTextRoutes } from './routes/siteText';
import { adminCollectionRoutes, publicCollectionRoutes } from './routes/collections';
import { pageRoutes } from './routes/pages';
import { adminProductImportRoutes } from './routes/adminProductImports';
import { createSelectedProductImportProvider } from './lib/productImport/composition';

/** Builds the full API. Shared by the Worker entry point and the test harness. */
export function buildApp(deps: AppDeps) {
  const app = createApp({ ...deps, productImporter: deps.productImporter ?? createSelectedProductImportProvider() });
  app.route('/', publicRoutes);
  app.route('/', pageRoutes);
  app.route('/api/auth', authRoutes);
  app.route('/api/admin/products', adminProductRoutes);
  app.route('/api/admin/product-imports', adminProductImportRoutes);
  app.route('/api/admin/analytics', adminAnalyticsRoutes);
  app.route('/api/admin/site-text', adminSiteTextRoutes);
  app.route('/api/site-text', publicSiteTextRoutes);
  app.route('/api/admin/collections', adminCollectionRoutes);
  app.route('/api/collections', publicCollectionRoutes);
  app.route('/api/admin', adminSecurityRoutes);
  app.route('/api/webhooks', webhookRoutes);
  return app;
}
