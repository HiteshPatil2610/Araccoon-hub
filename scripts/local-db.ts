// Local Postgres for development before (or instead of) the Neon dev branch.
//   npm run db:local          start (creates .localdb/ on first run)
//   npm run db:local -- stop  stop
// Needs PostgreSQL binaries (initdb, pg_ctl) on PATH or in PG_BIN.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { LOCAL_DB_PORT, LOCAL_DB_URL } from './env';

const DIR = path.resolve('.localdb');
const DATA = path.join(DIR, 'data');

function bin(name: string): string {
  const exe = process.platform === 'win32' ? `${name}.exe` : name;
  for (const dir of [process.env.PG_BIN, ...(process.env.PATH ?? '').split(path.delimiter)].filter(Boolean) as string[]) {
    const p = path.join(dir, exe);
    if (fs.existsSync(p)) return p;
  }
  throw new Error(`${name} not found. Install PostgreSQL or set PG_BIN.`);
}

async function start() {
  if (!fs.existsSync(DATA)) {
    fs.mkdirSync(DIR, { recursive: true });
    const r = spawnSync(bin('initdb'), ['-D', DATA, '-U', 'araccoon', '--auth=trust', '-E', 'UTF8', '--no-locale'], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('initdb failed');
  }
  const status = spawnSync(bin('pg_ctl'), ['-D', DATA, 'status'], { stdio: 'ignore' });
  if (status.status !== 0) {
    const r = spawnSync(bin('pg_ctl'), ['-D', DATA, '-o', `-p ${LOCAL_DB_PORT} -h 127.0.0.1`, '-l', path.join(DIR, 'postgres.log'), '-w', 'start'], { stdio: 'ignore' });
    if (r.status !== 0) throw new Error(`pg_ctl start failed — see ${path.join(DIR, 'postgres.log')}`);
  }
  const admin = new pg.Client({ connectionString: LOCAL_DB_URL.replace('/araccoon_dev', '/postgres') });
  await admin.connect();
  const { rowCount } = await admin.query(`SELECT 1 FROM pg_database WHERE datname = 'araccoon_dev'`);
  if (!rowCount) await admin.query('CREATE DATABASE araccoon_dev');
  await admin.end();
  console.log(`Local Postgres running on 127.0.0.1:${LOCAL_DB_PORT} (database araccoon_dev).`);
}

function stop() {
  spawnSync(bin('pg_ctl'), ['-D', DATA, '-m', 'fast', 'stop'], { stdio: 'inherit' });
}

if (process.argv[2] === 'stop') stop();
else await start();
