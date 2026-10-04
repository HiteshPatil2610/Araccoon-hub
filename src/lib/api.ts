// The single HTTP boundary for the React app. Owner auth is an HttpOnly cookie
// (sent automatically, unreadable from JS); nothing secret lives in storage.
import type { AnalyticsSummary, AuditEntry, OwnerProfile, PasskeyInfo, Product, PublicProduct } from '../../shared/types';
import type { ProductInput, ProductPatch } from '../../shared/schemas';

export class HttpError extends Error {
  constructor(public status: number, message: string, public fields: Record<string, string> = {}, public correlationId?: string) {
    super(message);
  }
}

export const SESSION_EXPIRED_EVENT = 'araccoon:session-expired';

async function request<T>(method: string, path: string, body?: unknown, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
  const signal = opts.signal ?? AbortSignal.timeout(opts.timeoutMs ?? 15_000);
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      throw new HttpError(0, 'The request timed out. Check your connection and try again.');
    }
    throw new HttpError(0, 'Network error. Check your connection and try again.');
  }
  if (res.status === 401 && path.startsWith('/api/admin/')) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string>; correlationId?: string };
    const retry = res.headers.get('retry-after');
    const msg = res.status === 429 && retry ? `${data.error ?? 'Too many requests.'} Try again in ${retry}s.` : data.error ?? `Request failed (${res.status}).`;
    throw new HttpError(res.status, msg, data.fields ?? {}, data.correlationId);
  }
  if (res.status === 204) return undefined as T;
  const type = res.headers.get('content-type') ?? '';
  return (type.includes('application/json') ? res.json() : res.text()) as Promise<T>;
}

type Options = { challengeId: string; options: any };
export interface AuthState { owner: OwnerProfile | null; setupOpen: boolean; turnstileSiteKey: string | null; devLogin: boolean }
export interface OwnerRow { id: string; email: string; displayName: string; disabled: boolean; createdAt: string; passkeys: number; you: boolean }
export interface SessionRow { id: string; current: boolean; createdAt: string; lastSeenAt: string; userAgent: string | null }
export interface ConversionRow { id: string; productId: string | null; productTitle: string; occurredAt: string; source: 'manual' | 'webhook'; amountCents: number | null; note: string | null }

export const api = {
  // ---- public storefront
  products: (q: { category?: string; search?: string } = {}) => {
    const p = new URLSearchParams();
    if (q.category && q.category !== 'All') p.set('category', q.category);
    if (q.search) p.set('search', q.search);
    return request<PublicProduct[]>('GET', `/api/products${p.size ? `?${p}` : ''}`);
  },
  stats: () => request<{ clicksToday: number }>('GET', '/api/stats', undefined, { timeoutMs: 5000 }),
  track: (b: { productId: string; clickKey: string; utmSource?: string; utmMedium?: string; referrer?: string }) =>
    request<{ clickId: string; destinationUrl: string }>('POST', '/api/track', b, { timeoutMs: 4000 }),
  redirectUrl: (productId: string, clickKey: string) => `/r/${productId}?ck=${clickKey}&utm_source=storefront&utm_medium=fallback`,

  // ---- auth
  authState: () => request<AuthState>('GET', '/api/auth/state'),
  setupOptions: (b: { email: string; setupToken: string; turnstileToken?: string }) => request<Options>('POST', '/api/auth/setup/options', b),
  setupVerify: (b: { challengeId: string; response: unknown; name: string }) => request<{ owner: OwnerProfile; recoveryCodes: string[] }>('POST', '/api/auth/setup/verify', b),
  inviteOptions: (b: { token: string; turnstileToken?: string }) => request<Options>('POST', '/api/auth/invite/options', b),
  inviteVerify: (b: { token: string; challengeId: string; response: unknown; name: string }) => request<{ owner: OwnerProfile; recoveryCodes: string[] }>('POST', '/api/auth/invite/verify', b),
  loginOptions: (b: { turnstileToken?: string }) => request<Options>('POST', '/api/auth/login/options', b),
  loginVerify: (b: { challengeId: string; response: unknown }) => request<{ owner: OwnerProfile }>('POST', '/api/auth/login/verify', b),
  recover: (b: { email: string; code: string; turnstileToken?: string }) => request<{ owner: OwnerProfile }>('POST', '/api/auth/recover', b),
  devLogin: (token: string) => request<{ owner: OwnerProfile }>('POST', '/api/auth/dev-login', { token }),
  logout: () => request<{ ok: true }>('POST', '/api/auth/logout', {}),

  // ---- owner: products
  adminProducts: (q: { status?: string; search?: string } = {}) => {
    const p = new URLSearchParams();
    if (q.status && q.status !== 'all') p.set('status', q.status);
    if (q.search) p.set('search', q.search);
    return request<Product[]>('GET', `/api/admin/products${p.size ? `?${p}` : ''}`);
  },
  createProduct: (b: ProductInput) => request<Product>('POST', '/api/admin/products', b),
  updateProduct: (id: string, b: ProductPatch) => request<Product>('PATCH', `/api/admin/products/${id}`, b),
  deleteProduct: (id: string) => request<{ ok: true }>('DELETE', `/api/admin/products/${id}`, {}),
  duplicateProduct: (id: string) => request<Product>('POST', `/api/admin/products/${id}/duplicate`, {}),
  bulkProducts: (ids: string[], action: 'publish' | 'draft' | 'archive' | 'feature' | 'unfeature' | 'delete') =>
    request<{ affected: number }>('POST', '/api/admin/products/bulk', { ids, action }),
  signImageUpload: () => request<{ cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string; uploadPreset: string }>('POST', '/api/admin/products/images/sign', {}),

  // ---- owner: analytics
  analytics: (days: number) => request<AnalyticsSummary>('GET', `/api/admin/analytics?days=${days}`),
  exportCsv: async (days: number) => {
    const res = await fetch(`/api/admin/analytics/export?days=${days}`, { credentials: 'same-origin' });
    if (!res.ok) throw new HttpError(res.status, 'Export failed.');
    const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `araccoon_clicks_${days}d.csv`;
    return { blob: await res.blob(), name, truncated: res.headers.get('x-export-truncated') === 'true' };
  },
  conversions: () => request<ConversionRow[]>('GET', '/api/admin/analytics/conversions'),
  addConversion: (b: { productId: string; amountCents?: number; note?: string; occurredAt?: string }) => request<{ id: string }>('POST', '/api/admin/analytics/conversions', b),
  deleteConversion: (id: string) => request<{ ok: true }>('DELETE', `/api/admin/analytics/conversions/${id}`, {}),
  resetAnalytics: () => request<{ ok: true }>('POST', '/api/admin/analytics/reset', { confirm: 'RESET' }),

  // ---- owner: account & security
  me: () => request<OwnerProfile>('GET', '/api/admin/me'),
  updateMe: (displayName: string) => request<OwnerProfile>('PATCH', '/api/admin/me', { displayName }),
  passkeys: () => request<PasskeyInfo[]>('GET', '/api/admin/passkeys'),
  passkeyOptions: () => request<Options>('POST', '/api/admin/passkeys/options', {}),
  passkeyVerify: (b: { challengeId: string; response: unknown; name: string }) => request<{ ok: true }>('POST', '/api/admin/passkeys/verify', b),
  renamePasskey: (id: string, name: string) => request<{ ok: true }>('PATCH', `/api/admin/passkeys/${encodeURIComponent(id)}`, { name }),
  deletePasskey: (id: string) => request<{ ok: true }>('DELETE', `/api/admin/passkeys/${encodeURIComponent(id)}`, {}),
  recoveryStatus: () => request<{ total: number; unused: number }>('GET', '/api/admin/recovery-codes/status'),
  regenerateRecoveryCodes: () => request<{ recoveryCodes: string[] }>('POST', '/api/admin/recovery-codes', {}),
  sessions: () => request<SessionRow[]>('GET', '/api/admin/sessions'),
  revokeSession: (id: string) => request<{ ok: true }>('DELETE', `/api/admin/sessions/${id}`, {}),
  revokeOtherSessions: () => request<{ revoked: number }>('POST', '/api/admin/sessions/revoke-others', {}),
  owners: () => request<OwnerRow[]>('GET', '/api/admin/owners'),
  inviteOwner: (email: string) => request<{ inviteUrl: string; expiresInHours: number }>('POST', '/api/admin/owners/invite', { email }),
  disableOwner: (id: string) => request<{ ok: true }>('POST', `/api/admin/owners/${id}/disable`, {}),
  enableOwner: (id: string) => request<{ ok: true }>('POST', `/api/admin/owners/${id}/enable`, {}),
  activity: (before?: string) => request<AuditEntry[]>('GET', `/api/admin/activity${before ? `?before=${before}` : ''}`),
};

/** Save a Blob as a file download (object URL is revoked right after). */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
