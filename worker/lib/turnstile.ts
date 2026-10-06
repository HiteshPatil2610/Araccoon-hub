// Cloudflare Turnstile server-side verification.
export interface HumanCheck {
  verify(token: unknown, ip: string | null): Promise<boolean>;
}

export function turnstileVerifier(secretKey: string | null, fetcher: typeof fetch = fetch): HumanCheck {
  return {
    async verify(token, ip) {
      // Without a secret (local dev/tests) the check is skipped; production
      // config refuses to start without TURNSTILE_SECRET_KEY.
      if (!secretKey) return true;
      if (typeof token !== 'string' || !token || token.length > 4096) return false;
      const body = new FormData();
      body.set('secret', secretKey);
      body.set('response', token);
      if (ip) body.set('remoteip', ip);
      try {
        const res = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(5000) });
        if (!res.ok) return false;
        const data = (await res.json()) as { success?: boolean };
        return data.success === true;
      } catch {
        return false;
      }
    },
  };
}
