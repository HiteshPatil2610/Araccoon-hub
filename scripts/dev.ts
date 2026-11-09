// `npm run dev`: points the Worker's Hyperdrive binding at the dev database
// (Neon dev branch from DATABASE_URL_DEV, or the local cluster) and starts Vite.
// Vite runs through Node directly (no shell), so arguments are passed through unchanged
// on every platform.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describeUrl, devDatabaseUrl } from './env';

const url = devDatabaseUrl();
console.log(`Dev database: ${describeUrl(url)}`);
const require = createRequire(import.meta.url);
const viteCli = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const child = spawn(process.execPath, [viteCli, '--configLoader', 'runner', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: url },
});
child.on('exit', code => process.exit(code ?? 0));
