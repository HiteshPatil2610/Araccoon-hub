/**
 * node:test global setup — starts ONE throwaway Postgres cluster for the whole
 * test run, in a temporary directory, bound to 127.0.0.1 on a random port.
 * It never touches DATABASE_URL from .env or any existing server.
 *
 * Resolution order:
 *   1. TEST_DATABASE_ADMIN_URL — an already-running disposable server (CI).
 *      Must point at localhost; checked by assertDisposableUrl().
 *   2. Local PostgreSQL binaries (PG_BIN, or initdb/pg_ctl on PATH).
 * If neither is available, integration suites skip with a visible reason —
 * they never report a pass without a database.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

let clusterDir: string | null = null;
let pgCtl: string | null = null;

function findBinary(name: string): string | null {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  const dirs = [process.env.PG_BIN, ...(process.env.PATH || '').split(path.delimiter)].filter(Boolean) as string[];
  for (const dir of dirs) {
    const candidate = path.join(dir, exe);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as net.AddressInfo;
      srv.close(() => resolve(port));
    });
  });
}

export async function globalSetup() {
  if (process.env.TEST_DATABASE_ADMIN_URL) return;

  const initdb = findBinary('initdb');
  pgCtl = findBinary('pg_ctl');
  if (!initdb || !pgCtl) {
    if (process.env.REQUIRE_INTEGRATION_TESTS === '1') throw new Error('Security verification requires PostgreSQL binaries or a disposable TEST_DATABASE_ADMIN_URL.');
    process.env.TEST_DATABASE_UNAVAILABLE = 'PostgreSQL binaries (initdb/pg_ctl) not found; set PG_BIN or TEST_DATABASE_ADMIN_URL';
    return;
  }

  clusterDir = fs.mkdtempSync(path.join(os.tmpdir(), 'araccoon-pg-'));
  const dataDir = path.join(clusterDir, 'data');
  const init = spawnSync(initdb, ['-D', dataDir, '-U', 'araccoon_test', '--auth=trust', '-E', 'UTF8', '--no-locale'], { encoding: 'utf8' });
  if (init.status !== 0) {
    if (process.env.REQUIRE_INTEGRATION_TESTS === '1') throw new Error(`Security verification initdb failed: ${init.stderr?.slice(0, 300)}`);
    process.env.TEST_DATABASE_UNAVAILABLE = `initdb failed: ${init.stderr?.slice(0, 300)}`;
    return;
  }

  const port = await freePort();
  const start = spawnSync(pgCtl, [
    '-D', dataDir,
    '-o', `-p ${port} -h 127.0.0.1 -c fsync=off -c full_page_writes=off -c max_connections=200`,
    '-l', path.join(clusterDir, 'postgres.log'),
    '-w', 'start',
  ], { stdio: 'ignore', timeout: 60_000 }); // the postmaster inherits pipes; 'ignore' stops spawnSync waiting on it
  if (start.status !== 0) {
    if (process.env.REQUIRE_INTEGRATION_TESTS === '1') throw new Error('Security verification could not start disposable PostgreSQL.');
    process.env.TEST_DATABASE_UNAVAILABLE = `pg_ctl start failed (exit ${start.status}); see ${clusterDir}/postgres.log`;
    return;
  }

  process.env.TEST_DATABASE_ADMIN_URL = `postgresql://araccoon_test@127.0.0.1:${port}/postgres?sslmode=disable`;
}

export async function globalTeardown() {
  if (!clusterDir || !pgCtl) return;
  spawnSync(pgCtl, ['-D', path.join(clusterDir, 'data'), '-m', 'immediate', '-w', 'stop'], { encoding: 'utf8' });
  fs.rmSync(clusterDir, { recursive: true, force: true });
}
