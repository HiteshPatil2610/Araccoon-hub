// Sample products for local/dev databases only (refuses the production URL).
//   npm run db:seed
// The first six are added to an empty catalog. The comparison samples (three mice, three keyboards,
// three headphones, one per tier) are added whenever one with that title is missing, so running it
// again on a catalog that already has products adds them too, and so is a published collection for
// each of the three types (its page shows the Compare section). All of them are invented.
import { createPoolDb } from '../worker/db/db';
import { insertProduct } from '../worker/repo/products';
import { insertCollection } from '../worker/repo/collections';
import { productInputSchema } from '../shared/schemas';
import { TIER_LABELS, type Tier } from '../shared/productFacts';
import { describeUrl, devDatabaseUrl, loadEnv } from './env';

const env = loadEnv();
const url = devDatabaseUrl(env);
if (env.DATABASE_URL && url === env.DATABASE_URL) {
  console.error('Refusing to seed: the dev database URL is the production DATABASE_URL.');
  process.exit(1);
}

const img = (id: string) => `https://images.unsplash.com/${id}?w=900&auto=format&fit=crop&q=80`;
const SAMPLES = [
  { title: 'Magnetic Levitating Desk Plant Pot', category: 'Desk & Office', description: 'A tiny plant that floats above its base — the desk upgrade everyone asks about.', rating: 4.4, reviewCount: 1832, imageUrl: img('photo-1485955900006-10f4d324d411'), affiliateUrl: 'https://www.amazon.in/dp/B0SAMPLE01', featured: true, badge: 'Crowd favourite' },
  { title: 'Mechanical Keyboard Cleaning Putty', category: 'Tech & Gadgets', description: 'Squishes into every gap and lifts out the crumbs your keyboard has been hiding.', rating: 4.2, reviewCount: 9120, imageUrl: img('photo-1587829741301-dc798b83add3'), affiliateUrl: 'https://www.amazon.com/dp/B0SAMPLE02' },
  { title: 'Sunrise Alarm Clock Lamp', category: 'Home & Living', description: 'Wakes you with a slow, warm glow instead of a jolt.', rating: 4.5, reviewCount: 4410, imageUrl: img('photo-1513506003901-1e6a229e2d15'), affiliateUrl: 'https://www.amazon.in/dp/B0SAMPLE03' },
  { title: 'Raccoon-Shaped Cable Organiser', category: 'Quirky Finds', description: 'A small masked bandit that guards your charging cables.', rating: 4.7, reviewCount: 640, imageUrl: img('photo-1497206365907-f5e630693df0'), affiliateUrl: 'https://amzn.in/d/sample04', badge: 'Under ₹499' },
  { title: 'Pocket Retro Game Console', category: 'Fun & Novelty', description: '400 classic games in something smaller than a phone.', rating: 4.1, reviewCount: 2750, imageUrl: img('photo-1550745165-9bc0b252726f'), affiliateUrl: 'https://www.amazon.com/dp/B0SAMPLE05' },
  { title: 'Under-Desk Cable Tray', category: 'Desk & Office', description: 'Hides the spaghetti and keeps your power strip off the floor.', rating: 4.6, reviewCount: 3305, imageUrl: img('photo-1593062096033-9a26b09da705'), affiliateUrl: 'https://www.amazon.in/dp/B0SAMPLE06' },
];

type Facts = { title: string; brand: string; tier: Tier; photo: string; blurb: string; specs: [string, string][] };
const group = (productType: string, category: string, finds: Facts[]) => finds.map(f => ({ ...f, productType, category }));

// Same row names within a type, so the three can be lined up; brands and models are made up.
const COMPARE_SAMPLES = [
  ...group('Mouse', 'Tech & Gadgets', [
    { title: 'Dabba Click M1 Wireless Mouse', brand: 'Dabba', tier: 'budget', photo: 'photo-1527864550417-7fd91fc51a46', blurb: 'A plain wireless mouse that does the basics and runs for months on one AA cell.',
      specs: [['Connection', '2.4 GHz wireless'], ['Sensor', 'Optical'], ['Max DPI', '1,600'], ['Polling rate', '125 Hz'], ['Buttons', '3'], ['Weight', '78 g'], ['Battery life', '12 months (1 AA)'], ['Hand', 'Both']] },
    { title: 'Tanuki Swift S2 Gaming Mouse', brand: 'Tanuki', tier: 'value', photo: 'photo-1527814050087-3793815479db', blurb: 'Most of what a pricey gaming mouse offers, for about half the money.',
      specs: [['Connection', '2.4 GHz wireless, Bluetooth'], ['Sensor', 'Optical, 12K'], ['Max DPI', '12,000'], ['Polling rate', '1,000 Hz'], ['Buttons', '6'], ['Weight', '95 g'], ['Battery life', '250 hours (1 AA)'], ['Hand', 'Right']] },
    { title: 'Kestrel Apex Pro Wireless Mouse', brand: 'Kestrel', tier: 'premium', photo: 'photo-1615663245857-ac93bb7c39e7', blurb: 'Very light, very fast and charged by USB-C: the one to get if price does not matter.',
      specs: [['Connection', '2.4 GHz wireless, Bluetooth, USB-C'], ['Sensor', 'Optical, 36K'], ['Max DPI', '36,000'], ['Polling rate', '8,000 Hz'], ['Buttons', '5'], ['Weight', '54 g'], ['Battery life', '90 hours (rechargeable)'], ['Hand', 'Right']] },
  ]),
  ...group('Keyboard', 'Tech & Gadgets', [
    { title: 'Dabba Type K1 Membrane Keyboard', brand: 'Dabba', tier: 'budget', photo: 'photo-1587829741301-dc798b83add3', blurb: 'A quiet full-size keyboard with a number pad and nothing to set up.',
      specs: [['Layout', 'Full size (104 keys)'], ['Switches', 'Membrane'], ['Connection', 'USB-A cable'], ['Backlight', 'None'], ['Hot-swappable', 'No'], ['Weight', '480 g']] },
    { title: 'Tanuki Tappy 75 Mechanical Keyboard', brand: 'Tanuki', tier: 'value', photo: 'photo-1618384887929-16ec33fab9ef', blurb: 'A compact mechanical board with swappable switches at a sensible price.',
      specs: [['Layout', '75% (82 keys)'], ['Switches', 'Linear, red'], ['Connection', 'USB-C cable, Bluetooth'], ['Backlight', 'White'], ['Hot-swappable', 'Yes'], ['Battery life', '80 hours'], ['Weight', '760 g']] },
    { title: 'Kestrel Forge 65 Aluminium Keyboard', brand: 'Kestrel', tier: 'premium', photo: 'photo-1595225476474-87563907a212', blurb: 'A heavy aluminium case, pre-lubed switches and a sound people buy it for.',
      specs: [['Layout', '65% (68 keys)'], ['Switches', 'Tactile, pre-lubed'], ['Connection', 'USB-C cable, Bluetooth, 2.4 GHz wireless'], ['Backlight', 'RGB, per key'], ['Hot-swappable', 'Yes'], ['Battery life', '200 hours'], ['Weight', '1,450 g']] },
  ]),
  ...group('Headphones', 'Tech & Gadgets', [
    { title: 'Dabba Tune H1 Wired Headphones', brand: 'Dabba', tier: 'budget', photo: 'photo-1484704849700-f032a568e944', blurb: 'Light wired headphones for calls and classes, with a microphone on the cable.',
      specs: [['Style', 'On-ear'], ['Connection', '3.5 mm cable'], ['Noise cancelling', 'No'], ['Driver size', '32 mm'], ['Microphone', 'On the cable'], ['Weight', '140 g']] },
    { title: 'Tanuki Hush Q30 Wireless Headphones', brand: 'Tanuki', tier: 'value', photo: 'photo-1505740420928-5e560c06d30e', blurb: 'Good noise cancelling and two days of battery without the flagship price.',
      specs: [['Style', 'Over-ear'], ['Connection', 'Bluetooth 5.3, 3.5 mm cable'], ['Noise cancelling', 'Yes'], ['Driver size', '40 mm'], ['Battery life', '50 hours'], ['Microphone', 'Built in'], ['Weight', '255 g']] },
    { title: 'Kestrel Aria X Wireless Headphones', brand: 'Kestrel', tier: 'premium', photo: 'photo-1546435770-a3e426bf472b', blurb: 'The quietest of the three, with the best microphones and a fold-flat case.',
      specs: [['Style', 'Over-ear'], ['Connection', 'Bluetooth 5.4, 3.5 mm cable, USB-C audio'], ['Noise cancelling', 'Yes, adaptive'], ['Driver size', '40 mm'], ['Battery life', '30 hours'], ['Microphone', 'Built in, 8 mics'], ['Weight', '250 g']] },
  ]),
].map((s, i) => productInputSchema.parse({
  title: s.title, category: s.category, brand: s.brand, productType: s.productType, tier: s.tier,
  // Quick View shows "Name: value" lines as a spec list, so the description repeats them.
  description: [s.blurb, ...s.specs.map(([name, value]) => `${name}: ${value}`)].join('\n'),
  specs: s.specs.map(([name, value]) => ({ name, value })),
  pickNote: `Sample ${TIER_LABELS[s.tier].toLowerCase()} pick for testing. The product, brand and specs are made up.`,
  rating: 0, reviewCount: 0, imageUrl: img(s.photo), affiliateUrl: `https://www.amazon.in/dp/B0SAMPLE${i + 11}`, sortOrder: 100 + i,
}));

console.log(`Seeding ${describeUrl(url)} …`);
const db = createPoolDb(url);
try {
  const { rows } = await db.query<{ n: string }>('SELECT count(*) AS n FROM products');
  if (Number(rows[0]!.n) > 0) {
    console.log('Products already exist — skipping the basic samples.');
  } else {
    for (const [i, s] of SAMPLES.entries()) {
      await insertProduct(db, { imagePublicId: null, affiliateTag: null, subId: null, badge: null, pickNote: null, brand: null, productType: null, tier: null, specs: [], featured: false, status: 'published', sortOrder: i, ...s });
    }
    console.log(`Added ${SAMPLES.length} sample products.`);
  }
  const existing = await db.query<{ title: string }>('SELECT title FROM products WHERE title = ANY($1)', [COMPARE_SAMPLES.map(s => s.title)]);
  const have = new Set(existing.rows.map(r => r.title));
  const missing = COMPARE_SAMPLES.filter(s => !have.has(s.title));
  for (const s of missing) await insertProduct(db, s);
  console.log(missing.length ? `Added ${missing.length} comparison samples (mice, keyboards, headphones).` : 'Comparison samples already exist — skipping.');

  // One collection per sample type, holding that type's samples in tier order.
  const groups = [
    { title: 'Mice', type: 'Mouse', description: 'Sample collection: three made-up mice, one per tier, to try Compare.' },
    { title: 'Keyboards', type: 'Keyboard', description: 'Sample collection: three made-up keyboards, one per tier, to try Compare.' },
    { title: 'Headphones', type: 'Headphones', description: 'Sample collection: three made-up headphones, one per tier, to try Compare.' },
  ];
  const made = await db.query<{ title: string }>('SELECT title FROM collections WHERE title = ANY($1)', [groups.map(g => g.title)]);
  const haveGroup = new Set(made.rows.map(r => r.title));
  let added = 0;
  for (const [i, g] of groups.entries()) {
    if (haveGroup.has(g.title)) continue;
    const titles = COMPARE_SAMPLES.filter(s => s.productType === g.type).map(s => s.title);
    const ids = await db.query<{ id: string }>('SELECT id FROM products WHERE title = ANY($1) ORDER BY sort_order', [titles]);
    await insertCollection(db, { title: g.title, description: g.description, status: 'published', sortOrder: 100 + i, productIds: ids.rows.map(r => r.id) });
    added++;
  }
  console.log(added ? `Added ${added} sample collections (Mice, Keyboards, Headphones).` : 'Sample collections already exist — skipping.');
} finally {
  await db.close();
}
