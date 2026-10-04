import type { Ctx } from '../app';

// Append-only audit trail. Actor is an owner id (never an email or secret).
// A failed audit write is logged but never fails the user's request.
export async function audit(c: Ctx, action: string, result: 'success' | 'failure', target?: string | null, actorId?: string | null): Promise<void> {
  try {
    await c.get('db').query(
      `INSERT INTO audit_events (actor_id, action, target, result, correlation_id) VALUES ($1, $2, $3, $4, $5)`,
      [actorId ?? c.get('session')?.ownerId ?? null, action.slice(0, 64), target?.slice(0, 200) ?? null, result, c.get('correlationId')]
    );
  } catch (err) {
    console.error(`[${c.get('correlationId')}] audit write failed: ${err instanceof Error ? err.message : err}`);
  }
}
