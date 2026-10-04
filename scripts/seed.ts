// Sample products for local/dev databases only (refuses the production URL).
//   npm run db:seed
import { createPoolDb } from '../worker/db/db';
import { insertProduct } from '../worker/repo/products';
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

console.log(`Seeding ${describeUrl(url)} …`);
const db = createPoolDb(url);
try {
  const { rows } = await db.query<{ n: string }>('SELECT count(*) AS n FROM products');
  if (Number(rows[0]!.n) > 0) {
    console.log('Products already exist — skipping.');
  } else {
    for (const [i, s] of SAMPLES.entries()) {
      await insertProduct(db, { imagePublicId: null, affiliateTag: null, subId: null, badge: null, featured: false, status: 'published', sortOrder: i, ...s });
    }
    console.log(`Added ${SAMPLES.length} sample products.`);
  }
} finally {
  await db.close();
}
