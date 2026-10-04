// `npm run dev`: points the Worker's Hyperdrive binding at the dev database
// (Neon dev branch from DATABASE_URL_DEV, or the local cluster) and starts Vite.
import { spawn } from 'node:child_process';
import { describeUrl, devDatabaseUrl } from './env';

const url = devDatabaseUrl();
console.log(`Dev database: ${describeUrl(url)}`);
const child = spawn('npx', ['vite', '--configLoader', 'runner', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: url },
});
child.on('exit', code => process.exit(code ?? 0));
