import pg from 'pg';

// Minimal database interface used by every repository. Two implementations:
// a single pg.Client per Worker request (Hyperdrive does the pooling) and a
// pg.Pool for scripts/tests. Every value goes through $n placeholders.
export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount: number }>;
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>;
}

type Queryable = Pick<pg.Client, 'query'>;

function wrap(conn: Queryable, txFactory: Db['tx']): Db {
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const res = await conn.query(sql, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    },
    tx: txFactory,
  };
}

async function runTx<T>(client: pg.Client | pg.PoolClient, fn: (db: Db) => Promise<T>, nested: Db['tx']): Promise<T> {
  await client.query('BEGIN');
  try {
    const result = await fn(wrap(client, nested));
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  }
}

const noNestedTx: Db['tx'] = () => Promise.reject(new Error('Nested transactions are not supported.'));

/** One connection for the lifetime of a Worker request. Call close() via waitUntil. */
export function createRequestDb(connectionString: string): Db & { close(): Promise<void> } {
  let client: pg.Client | null = null;
  let connecting: Promise<pg.Client> | null = null;
  const conn = () => {
    connecting ??= (async () => {
      client = new pg.Client({ connectionString, statement_timeout: 10_000, query_timeout: 15_000 });
      await client.connect();
      return client;
    })();
    return connecting;
  };
  return {
    async query<T>(sql: string, params: unknown[] = []) {
      const c = await conn();
      const res = await c.query(sql, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    },
    async tx(fn) {
      return runTx(await conn(), fn, noNestedTx);
    },
    async close() {
      if (client) await (client as pg.Client).end().catch(() => {});
    },
  };
}

/** Pooled access for Node scripts and tests. */
export function createPoolDb(connectionString: string): Db & { pool: pg.Pool; close(): Promise<void> } {
  const pool = new pg.Pool({ connectionString, max: 10, statement_timeout: 10_000 });
  return {
    pool,
    async query<T>(sql: string, params: unknown[] = []) {
      const res = await pool.query(sql, params);
      return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
    },
    async tx(fn) {
      const client = await pool.connect();
      try {
        return await runTx(client, fn, noNestedTx);
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
