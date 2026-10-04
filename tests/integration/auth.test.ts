import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, integrationSkipReason, OWNER_EMAIL, SETUP_TOKEN, TURNSTILE_PASS, ORIGIN, type TestContext } from '../support/testApp';
import { VirtualAuthenticator } from '../support/virtualAuthenticator';

async function signIn(t: TestContext, auth: VirtualAuthenticator, overrides?: Parameters<VirtualAuthenticator['getResponse']>[1]) {
  const b = t.browser();
  const start = await b.post('/api/auth/login/options', { turnstileToken: TURNSTILE_PASS });
  assert.equal(start.status, 200, start.text);
  const res = await b.post('/api/auth/login/verify', { challengeId: start.body.challengeId, response: await auth.getResponse(start.body.options, overrides) });
  return { b, res };
}

describe('owner authentication with passkeys', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  let owner: Awaited<ReturnType<TestContext['setupOwner']>>;

  before(async () => {
    mock.method(console, 'error', () => {});
    t = await createTestContext();
    owner = await t.setupOwner();
  });
  after(async () => { mock.restoreAll(); await t?.close(); });

  it('first setup signs the owner in and returns 10 one-time recovery codes', async () => {
    assert.equal(owner.recoveryCodes.length, 10);
    assert.ok(owner.recoveryCodes.every(c => /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(c)));
    const me = await owner.browser.get('/api/admin/me');
    assert.equal(me.status, 200);
    assert.equal(me.body.email, OWNER_EMAIL);
    const cookie = (await owner.browser.get('/api/auth/state')).headers;
    assert.equal(cookie.get('cache-control'), 'no-store');
  });

  it('closes setup once any passkey exists', async () => {
    const state = await t.browser().get('/api/auth/state');
    assert.equal(state.body.setupOpen, false);
    const again = await t.browser().post('/api/auth/setup/options', { email: OWNER_EMAIL, setupToken: SETUP_TOKEN, turnstileToken: TURNSTILE_PASS });
    assert.equal(again.status, 403);
  });

  it('stores only hashes: no recovery code or session token appears in the database', async () => {
    const { rows: codes } = await t.db.query<{ code_hash: string }>('SELECT code_hash FROM recovery_codes');
    const dump = JSON.stringify(codes);
    for (const code of owner.recoveryCodes) assert.ok(!dump.includes(code.replace(/-/g, '')) && !dump.includes(code));
    const token = owner.browser.cookies.get('__Host-rh_session')!;
    const { rows: sessions } = await t.db.query<{ id_hash: string }>('SELECT id_hash FROM sessions');
    assert.ok(!sessions.some(s => s.id_hash === token));
  });

  it('signs in with the registered passkey and rejects unknown, wrong-origin and unverified ones', async () => {
    const { b, res } = await signIn(t, owner.authenticator);
    assert.equal(res.status, 200, res.text);
    assert.equal((await b.get('/api/admin/me')).status, 200);

    const stranger = new VirtualAuthenticator('localhost', ORIGIN);
    await stranger.createResponse({ challenge: 'x' });
    assert.equal((await signIn(t, stranger)).res.status, 401);
    assert.equal((await signIn(t, owner.authenticator, { origin: 'https://evil.example' })).res.status, 401);
    assert.equal((await signIn(t, owner.authenticator, { userVerified: false })).res.status, 401);
  });

  it('challenges are single-use', async () => {
    const b = t.browser();
    const start = await b.post('/api/auth/login/options', { turnstileToken: TURNSTILE_PASS });
    const response = await owner.authenticator.getResponse(start.body.options);
    assert.equal((await b.post('/api/auth/login/verify', { challengeId: start.body.challengeId, response })).status, 200);
    assert.equal((await t.browser().post('/api/auth/login/verify', { challengeId: start.body.challengeId, response })).status, 400);
  });

  it('requires the bot check', async () => {
    assert.equal((await t.browser().post('/api/auth/login/options', { turnstileToken: 'bad' })).status, 400);
  });

  it('rejects anonymous access to every owner route', async () => {
    const anon = t.browser();
    for (const [m, p] of [['GET', '/api/admin/me'], ['GET', '/api/admin/products'], ['POST', '/api/admin/products'], ['GET', '/api/admin/analytics'],
      ['GET', '/api/admin/analytics/export'], ['POST', '/api/admin/analytics/reset'], ['GET', '/api/admin/activity'], ['POST', '/api/admin/owners/invite']] as const) {
      const res = await anon.request(m, p, { body: m === 'GET' ? undefined : {} });
      assert.equal(res.status, 401, `${m} ${p}`);
    }
  });

  it('blocks cross-origin state changes even with a valid session (CSRF)', async () => {
    const res = await owner.browser.request('POST', '/api/admin/products', { body: {}, origin: 'https://evil.example' });
    assert.equal(res.status, 403);
    const noOrigin = await owner.browser.request('POST', '/api/admin/products', { body: {}, origin: null });
    assert.equal(noOrigin.status, 403);
  });

  it('recovery code: one use only, revokes other sessions, and limits the session to adding a passkey', async () => {
    const { b: other } = await signIn(t, owner.authenticator);
    const code = owner.recoveryCodes[0]!;
    const rec = t.browser();
    const res = await rec.post('/api/auth/recover', { email: OWNER_EMAIL, code: code.toLowerCase().replace(/-/g, ' '), turnstileToken: TURNSTILE_PASS });
    assert.equal(res.status, 200, res.text);
    assert.equal(res.body.owner.needsPasskey, true);
    assert.equal((await other.get('/api/admin/me')).status, 401, 'other sessions revoked');
    assert.equal((await rec.get('/api/admin/products')).status, 403, 'recovery session cannot manage the store');

    const reuse = await t.browser().post('/api/auth/recover', { email: OWNER_EMAIL, code, turnstileToken: TURNSTILE_PASS });
    assert.equal(reuse.status, 401);

    const newKey = new VirtualAuthenticator('localhost', ORIGIN);
    const opts = await rec.post('/api/admin/passkeys/options', {});
    const add = await rec.post('/api/admin/passkeys/verify', { challengeId: opts.body.challengeId, response: await newKey.createResponse(opts.body.options), name: 'Replacement phone' });
    assert.equal(add.status, 201, add.text);
    assert.equal((await rec.get('/api/admin/products')).status, 200, 'full access after adding a passkey');
    owner.browser = (await signIn(t, owner.authenticator)).b;
  });

  it('wrong recovery codes are rate limited per account', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      statuses.push((await t.browser().post('/api/auth/recover', { email: OWNER_EMAIL, code: 'AAAA-BBBB-CCCC', turnstileToken: TURNSTILE_PASS })).status);
    }
    assert.ok(statuses.includes(429), statuses.join(','));
  });

  it('invites a second owner, who can then be disabled with immediate effect', async () => {
    const inv = await owner.browser.post('/api/admin/owners/invite', { email: 'Second@Example.test' });
    assert.equal(inv.status, 201);
    const token = new URL(inv.body.inviteUrl).hash.slice(1);
    const second = t.browser();
    const key = new VirtualAuthenticator('localhost', ORIGIN);
    const start = await second.post('/api/auth/invite/options', { token, turnstileToken: TURNSTILE_PASS });
    assert.equal(start.status, 200, start.text);
    const done = await second.post('/api/auth/invite/verify', { token, challengeId: start.body.challengeId, response: await key.createResponse(start.body.options), name: 'Second key' });
    assert.equal(done.status, 200, done.text);
    assert.equal(done.body.owner.email, 'second@example.test');
    const reuse = await t.browser().post('/api/auth/invite/options', { token, turnstileToken: TURNSTILE_PASS });
    assert.equal(reuse.status, 400, 'invites are single use');

    const owners = await owner.browser.get('/api/admin/owners');
    const secondId = owners.body.find((o: any) => o.email === 'second@example.test').id;
    assert.equal((await owner.browser.post(`/api/admin/owners/${secondId}/disable`)).status, 200);
    assert.equal((await second.get('/api/admin/me')).status, 401, 'disabled owner loses access immediately');
    assert.equal((await signIn(t, key)).res.status, 401, 'disabled owner cannot sign in');
    const self = owners.body.find((o: any) => o.you).id;
    assert.equal((await owner.browser.post(`/api/admin/owners/${self}/disable`)).status, 400, 'cannot disable yourself');
  });

  it('cannot remove the last passkey; sign-out ends the session server-side', async () => {
    const keys = await owner.browser.get('/api/admin/passkeys');
    assert.ok(keys.body.length >= 2);
    for (const k of keys.body.slice(1)) assert.equal((await owner.browser.del(`/api/admin/passkeys/${encodeURIComponent(k.id)}`)).status, 200);
    assert.equal((await owner.browser.del(`/api/admin/passkeys/${encodeURIComponent(keys.body[0].id)}`)).status, 409);

    const stolenCookie = owner.browser.cookies.get('__Host-rh_session')!;
    assert.equal((await owner.browser.post('/api/auth/logout')).status, 200);
    const replay = t.browser();
    replay.cookies.set('__Host-rh_session', stolenCookie);
    assert.equal((await replay.get('/api/admin/me')).status, 401, 'old cookie is useless after sign-out');
  });

  it('records security events in the activity log without secrets', async () => {
    const { b } = await signIn(t, owner.authenticator);
    const log = await b.get('/api/admin/activity');
    const actions = log.body.map((e: any) => `${e.action}:${e.result}`);
    for (const a of ['auth.setup:success', 'auth.login:success', 'auth.login:failure', 'auth.recovery:success', 'auth.recovery:failure', 'security.owner_disabled:success']) {
      assert.ok(actions.includes(a), `missing ${a}`);
    }
    const dump = JSON.stringify(await t.db.query('SELECT * FROM audit_events'));
    assert.ok(!owner.recoveryCodes.some(c => dump.includes(c)));
  });

  it('dev-login does not exist outside development', async () => {
    assert.equal((await t.browser().post('/api/auth/dev-login', { token: 'anything' })).status, 404);
  });
});
