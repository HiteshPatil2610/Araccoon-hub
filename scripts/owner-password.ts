// Set (or reset) the owner's sign-in password straight in the database, for when you
// are locked out of the owner hub. You must say which database:
//   npm run owner:password -- --target=dev                 (DATABASE_URL_DEV, or the local cluster)
//   npm run owner:password -- --target=prod                (DATABASE_URL — the live Neon branch)
// Optional: --email=someone@example.com (defaults to OWNER_EMAIL). Signs out every session
// of that owner. The password is typed at a hidden prompt and never printed or logged.
import readline from 'node:readline';
import { Writable } from 'node:stream';
import { createPoolDb } from '../worker/db/db';
import { loadConfig } from '../worker/config';
import { hashPassword, PASSWORD_MAX, PASSWORD_MIN } from '../worker/lib/password';
import { describeUrl, devDatabaseUrl, loadEnv } from './env';

const arg = (name: string) => process.argv.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const target = arg('target');
if (target !== 'dev' && target !== 'prod') {
  console.error('Specify --target=dev or --target=prod.');
  process.exit(1);
}
const env = loadEnv();
const url = target === 'prod' ? env.DATABASE_URL : devDatabaseUrl(env);
if (!url) {
  console.error('DATABASE_URL is not set in .env.');
  process.exit(1);
}
// Must match the pepper the running site uses, or the password will not verify.
const pepper = target === 'prod' ? env.RECOVERY_CODE_PEPPER?.trim() : loadConfig({ ...env, ENVIRONMENT: 'development' }).recoveryPepper;
if (!pepper) {
  console.error('RECOVERY_CODE_PEPPER is not set in .env (it must match the live site).');
  process.exit(1);
}
const email = (arg('email') ?? env.OWNER_EMAIL ?? '').trim().toLowerCase();
if (!/^[^@\s]+@[^@\s]+$/.test(email)) {
  console.error('Pass --email=you@example.com or set OWNER_EMAIL in .env.');
  process.exit(1);
}

function askHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({ write(chunk, enc, cb) { if (!muted) process.stdout.write(chunk, enc); cb(); } });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    muted = true;
  });
}

const password = await askHidden(`New password for ${email} (hidden): `);
if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
  console.error(`The password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`);
  process.exit(1);
}
if ((await askHidden('Type it again: ')) !== password) {
  console.error('The passwords do not match. Nothing changed.');
  process.exit(1);
}

console.log(`Updating the ${target} database at ${describeUrl(url)} …`);
const db = createPoolDb(url);
try {
  const hash = await hashPassword(password, pepper);
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO owners (email, password_hash, password_updated_at) VALUES ($1, $2, now())
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, password_updated_at = now(), disabled_at = NULL
     RETURNING id`,
    [email, hash]
  );
  const ownerId = rows[0]!.id;
  await db.query('UPDATE sessions SET revoked_at = now() WHERE owner_id = $1 AND revoked_at IS NULL', [ownerId]);
  await db.query(`INSERT INTO audit_events (actor_id, action, target, result) VALUES ($1, 'security.password_reset_cli', NULL, 'success')`, [ownerId]);
  console.log(`Done. Sign in at /admin/login with ${email} and the new password.`);
} finally {
  await db.close();
}
