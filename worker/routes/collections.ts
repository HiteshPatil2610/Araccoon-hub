import { Hono } from 'hono';
import { body, fail, ipKey, limit, type AppEnv, type Ctx } from '../app';
import { requireOwner } from '../auth/sessions';
import { audit } from '../lib/audit';
import { toPublic } from '../repo/products';
import {
  UnknownProductError, deleteCollection, getCollection, getPublicCollection, insertCollection, listCollections,
  listPublicCollections, updateCollection,
} from '../repo/collections';
import { COLLECTION_SLUG, collectionInputSchema, collectionPatchSchema, type PublicCollection } from '../../shared/collections';

// Visitors: published collections and their published finds (no affiliate URLs, as everywhere else).
export const publicCollectionRoutes = new Hono<AppEnv>();

publicCollectionRoutes.get('/', async (c) => {
  await limit(c, 'catalog', ipKey(c), 300, 60, true);
  const list = await listPublicCollections(c.get('db'));
  c.header('Cache-Control', 'public, max-age=30');
  return c.json(list.map(({ updatedAt: _updatedAt, ...summary }) => summary));
});

publicCollectionRoutes.get('/:slug', async (c) => {
  await limit(c, 'catalog', ipKey(c), 300, 60, true);
  const slug = c.req.param('slug');
  const found = slug.length <= 70 && COLLECTION_SLUG.test(slug) ? await getPublicCollection(c.get('db'), slug) : undefined;
  if (!found) fail(404, 'Collection not found.');
  c.header('Cache-Control', 'public, max-age=30');
  return c.json({ ...found.summary, products: found.products.map(toPublic) } satisfies PublicCollection);
});

// Owners: create, edit, reorder and delete collections.
export const adminCollectionRoutes = new Hono<AppEnv>();
adminCollectionRoutes.use('*', requireOwner());

const ownerKey = (c: Ctx) => c.get('session')!.ownerId;

/** A list that names a product which does not exist is the owner's mistake, not a server error. */
async function withKnownProducts<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (err) {
    if (err instanceof UnknownProductError) fail(400, 'Please check the highlighted fields.', { productIds: 'One of the chosen finds no longer exists. Reload and try again.' });
    throw err;
  }
}

adminCollectionRoutes.get('/', async (c) => c.json(await listCollections(c.get('db'))));

adminCollectionRoutes.post('/', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const input = await body(c, collectionInputSchema);
  const created = await withKnownProducts(() => insertCollection(c.get('db'), input));
  await audit(c, 'collection.create', 'success', created.id);
  return c.json(created, 201);
});

adminCollectionRoutes.patch('/:id', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const before = await getCollection(c.get('db'), c.req.param('id'));
  if (!before) fail(404, 'Collection not found.');
  const patch = await body(c, collectionPatchSchema);
  const updated = await withKnownProducts(() => updateCollection(c.get('db'), before.id, patch));
  await audit(c, 'collection.update', 'success', before.id);
  return c.json(updated);
});

adminCollectionRoutes.delete('/:id', async (c) => {
  await limit(c, 'owner-write', ownerKey(c), 60, 60);
  const before = await getCollection(c.get('db'), c.req.param('id'));
  if (!before || !(await deleteCollection(c.get('db'), before.id))) fail(404, 'Collection not found.');
  await audit(c, 'collection.delete', 'success', before.id);
  return c.json({ ok: true });
});
