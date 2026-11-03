import { Hono } from 'hono';
import { body, ipKey, limit, type AppEnv } from '../app';
import { requireOwner } from '../auth/sessions';
import { audit } from '../lib/audit';
import { getSiteText, getSiteTextState, updateSiteText } from '../repo/siteText';
import { siteTextPatchSchema } from '../../shared/siteText';

// Public read: the storefront uses it when the page did not arrive with the
// text embedded (e.g. after client-side navigation from the owner hub).
export const publicSiteTextRoutes = new Hono<AppEnv>();

publicSiteTextRoutes.get('/', async (c) => {
  await limit(c, 'catalog', ipKey(c), 300, 60, true);
  c.header('Cache-Control', 'public, max-age=30');
  return c.json(await getSiteText(c.get('db')));
});

export const adminSiteTextRoutes = new Hono<AppEnv>();
adminSiteTextRoutes.use('*', requireOwner());

adminSiteTextRoutes.get('/', async (c) => c.json(await getSiteTextState(c.get('db'))));

adminSiteTextRoutes.put('/', async (c) => {
  const ownerId = c.get('session')!.ownerId;
  await limit(c, 'owner-write', ownerId, 60, 60);
  const patch = await body(c, siteTextPatchSchema);
  const changed = await updateSiteText(c.get('db'), patch, ownerId);
  if (changed.length) await audit(c, 'site_text.update', 'success', changed.join(','));
  return c.json(await getSiteTextState(c.get('db')));
});
