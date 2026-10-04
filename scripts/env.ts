import fs from 'node:fs';

/** Loads .env then .env.local (later files win) into a plain object — never prints values. */
export function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of ['.env', '.env.local']) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m || line.trimStart().startsWith('#')) continue;
      let value = m[2]!;
      if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
      else value = value.replace(/\s+#.*$/, '');
      out[m[1]!] = value;
    }
  }
  return out;
}

export const LOCAL_DB_PORT = 54329;
export const LOCAL_DB_URL = `postgresql://araccoon:local-dev-only@127.0.0.1:${LOCAL_DB_PORT}/araccoon_dev?sslmode=disable`;

/** The database used by `npm run dev`: Neon dev branch if configured, else the local cluster. */
export function devDatabaseUrl(env = loadEnv()): string {
  return env.DATABASE_URL_DEV || LOCAL_DB_URL;
}

export function describeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return '(invalid URL)';
  }
}
