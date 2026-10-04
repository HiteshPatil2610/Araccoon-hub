import type { Db } from './db/db';

// Daily maintenance (Cloudflare Cron Trigger). Every statement is bounded and
// idempotent, so a missed or repeated run is harmless.
export async function runMaintenance(db: Db, clickRetentionDays: number): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const run = async (name: string, sql: string, params: unknown[] = []) => {
    result[name] = (await db.query(sql, params)).rowCount;
  };
  await run('clicks', `DELETE FROM clicks WHERE occurred_at < now() - make_interval(days => $1)`, [clickRetentionDays]);
  await run('sessions', `DELETE FROM sessions WHERE expires_at < now() - interval '7 days' OR revoked_at < now() - interval '7 days'`);
  await run('challenges', `DELETE FROM auth_challenges WHERE expires_at < now() - interval '1 day'`);
  await run('invites', `DELETE FROM owner_invites WHERE expires_at < now() - interval '30 days'`);
  await run('audit', `DELETE FROM audit_events WHERE occurred_at < now() - interval '400 days'`);
  return result;
}
