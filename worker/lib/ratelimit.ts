// Fixed-window rate limiting. Production uses Upstash Redis over its REST API
// (shared by every Worker instance and region). Development/tests use an
// in-memory store. If Redis is unreachable, sensitive routes fail closed
// (503) and public reads fail open — see `failOpen` on each rule.

export interface LimitResult { ok: boolean; retryAfter: number }
export interface RateLimiter {
  hit(key: string, max: number, windowSeconds: number): Promise<LimitResult>;
}

export function memoryLimiter(): RateLimiter & { size(): number } {
  const windows = new Map<string, { count: number; resetAt: number }>();
  return {
    async hit(key, max, windowSeconds) {
      const now = Date.now();
      if (windows.size > 50_000) {
        for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
      }
      let w = windows.get(key);
      if (!w || w.resetAt <= now) {
        w = { count: 0, resetAt: now + windowSeconds * 1000 };
        windows.set(key, w);
      }
      w.count++;
      return { ok: w.count <= max, retryAfter: Math.max(1, Math.ceil((w.resetAt - now) / 1000)) };
    },
    size: () => windows.size,
  };
}

export function upstashLimiter(url: string, token: string, fetcher: typeof fetch = fetch): RateLimiter {
  return {
    async hit(key, max, windowSeconds) {
      const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
      const redisKey = `rl:${key}:${bucket}`;
      const res = await fetcher(`${url.replace(/\/$/, '')}/pipeline`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([
          ['INCR', redisKey],
          ['EXPIRE', redisKey, String(windowSeconds + 5), 'NX'],
        ]),
      });
      if (!res.ok) throw new Error(`rate limiter unavailable (${res.status})`);
      const data = (await res.json()) as { result?: unknown; error?: string }[];
      const count = data[0]?.result;
      if (!Array.isArray(data) || data.length !== 2 || data.some(item => item.error)
        || typeof count !== 'number' || !Number.isSafeInteger(count) || count < 1
        || (data[1]?.result !== 0 && data[1]?.result !== 1)) throw new Error('rate limiter returned an invalid response');
      const retryAfter = (bucket + 1) * windowSeconds - Math.floor(Date.now() / 1000);
      return { ok: count <= max, retryAfter: Math.max(1, retryAfter) };
    },
  };
}
