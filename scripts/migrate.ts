// Apply database migrations. You must say which database:
//   npm run db:migrate -- --target=dev    (DATABASE_URL_DEV, or the local cluster)
//   npm run db:migrate -- --target=prod   (DATABASE_URL — the live Neon branch)
import { createPoolDb } from '../worker/db/db';
import { migrate } from '../worker/db/migrations';
import { describeUrl, devDatabaseUrl, loadEnv } from './env';

const target = process.argv.find(a => a.startsWith('--target='))?.split('=')[1];
const env = loadEnv();
if (target !== 'dev' && target !== 'prod') {
  console.error('Specify --target=dev or --target=prod.');
  process.exit(1);
}
const url = target === 'prod' ? env.DATABASE_URL : devDatabaseUrl(env);
if (!url) {
  console.error('DATABASE_URL is not set in .env.');
  process.exit(1);
}
console.log(`Migrating ${target} database at ${describeUrl(url)} …`);
const db = createPoolDb(url);
try {
  const applied = await migrate(db, msg => console.log(`  ${msg}`));
  console.log(applied.length ? `Done (${applied.length} applied).` : 'Already up to date.');
} finally {
  await db.close();
}
