import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, integrationSkipReason, OWNER_EMAIL, SETUP_TOKEN, TURNSTILE_PASS, type Browser, type TestContext } from '../support/testApp';

const PASSWORD = 'correct horse battery staple';
const put = (b: Browser, path: string, body: unknown) => b.request('PUT', path, { body });
const login = (t: TestContext, email: string, password: string, extra: Record<string, unknown> = { turnstileToken: TURNSTILE_PASS }) => {
  const b = t.browser();
  return b.post('/api/auth/password-login', { email, password, ...extra }).then(res => ({ b, res }));
};

describe('owner authentication with email and password', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  let owner: Awaited<ReturnType<TestContext['setupOwner']>>;

  before(async () => {
    mock.method(console, 'error', () => {});
    t = await createTestContext();
    owner = await t.setupOwner();
  });
  after(async () => { mock.restoreAll(); await t?.close(); });

  it('rejects password sign-in until a password is set, with the same message for unknown emails', async () => {
    const noPassword = await login(t, OWNER_EMAIL, PASSWORD);
    const unknown = await login(t, 'nobody@example.test', PASSWORD);
    assert.equal(noPassword.res.status, 401);
    assert.equal(unknown.res.status, 401);
    assert.equal(noPassword.res.body.error, unknown.res.body.error);
    assert.equal((await owner.browser.get('/api/admin/me')).body.hasPassword, false);
  });

  it('sets a password from the account page and stores only a salted hash', async () => {
    assert.equal((await put(owner.browser, '/api/admin/password', { newPassword: 'short' })).status, 400);
    assert.equal((await put(owner.browser, '/api/admin/password', { newPassword: OWNER_EMAIL })).status, 400, 'email as password is refused');
    const set = await put(owner.browser, '/api/admin/password', { newPassword: PASSWORD });
    assert.equal(set.status, 200, set.text);
    assert.equal(set.body.hasPassword, true);
    const { rows } = await t.db.query<{ password_hash: string }>('SELECT password_hash FROM owners WHERE email = $1', [OWNER_EMAIL]);
    assert.match(rows[0]!.password_hash, /^pbkdf2-sha256\$\d+\$[\w-]+\$[\w-]+$/);
    assert.ok(!rows[0]!.password_hash.includes(PASSWORD));
    assert.equal((await t.browser().get('/api/auth/state')).body.setupOpen, false);
  });

  it('signs in with the right password only, and requires the bot check', async () => {
    const ok = await login(t, OWNER_EMAIL.toUpperCase(), PASSWORD);
    assert.equal(ok.res.status, 200, ok.res.text);
    assert.equal(ok.res.body.owner.email, OWNER_EMAIL);
    assert.equal((await ok.b.get('/api/admin/me')).status, 200);
    assert.equal((await login(t, OWNER_EMAIL, `${PASSWORD}!`)).res.status, 401);
    assert.equal((await login(t, OWNER_EMAIL, PASSWORD, {})).res.status, 400, 'missing Turnstile token');
  });

  it('changing the password needs the current one and signs out other devices', async () => {
    const other = (await login(t, OWNER_EMAIL, PASSWORD)).b;
    assert.equal((await put(owner.browser, '/api/admin/password', { currentPassword: 'wrong password!!', newPassword: 'another long passphrase' })).status, 400);
    assert.equal((await put(owner.browser, '/api/admin/password', { newPassword: 'another long passphrase' })).status, 400, 'current password required');
    const changed = await put(owner.browser, '/api/admin/password', { currentPassword: PASSWORD, newPassword: 'another long passphrase' });
    assert.equal(changed.status, 200, changed.text);
    assert.equal((await other.get('/api/admin/me')).status, 401, 'other session revoked');
    assert.equal((await owner.browser.get('/api/admin/me')).status, 200, 'current session kept');
    assert.equal((await login(t, OWNER_EMAIL, PASSWORD)).res.status, 401, 'old password no longer works');
    assert.equal((await login(t, OWNER_EMAIL, 'another long passphrase')).res.status, 200);
  });

  it('a recovery-code session can set a new password without the old one, which unlocks the hub', async () => {
    const b = t.browser();
    const rec = await b.post('/api/auth/recover', { email: OWNER_EMAIL, code: owner.recoveryCodes[0], turnstileToken: TURNSTILE_PASS });
    assert.equal(rec.status, 200, rec.text);
    assert.equal((await b.get('/api/admin/products')).status, 403, 'recovery session is limited');
    const set = await put(b, '/api/admin/password', { newPassword: 'recovered passphrase 1' });
    assert.equal(set.status, 200, set.text);
    assert.equal(set.body.needsPasskey, false);
    assert.equal((await b.get('/api/admin/products')).status, 200, 'hub unlocked');
    assert.equal((await login(t, OWNER_EMAIL, 'recovered passphrase 1')).res.status, 200);
    owner.browser = b;
  });

  it('with a password the last passkey can be removed, but then the password cannot', async () => {
    const keys = await owner.browser.get('/api/admin/passkeys');
    for (const k of keys.body) assert.equal((await owner.browser.del(`/api/admin/passkeys/${encodeURIComponent(k.id)}`)).status, 200);
    assert.equal((await owner.browser.del('/api/admin/password')).status, 409, 'would leave no sign-in method');
    assert.equal((await t.browser().get('/api/auth/state')).body.setupOpen, false, 'a password alone keeps setup closed');
  });

  it('limits guesses per account', async () => {
    const email = 'second-target@example.test';
    let last = 0;
    for (let i = 0; i < 11; i++) last = (await login(t, email, `guess number ${i}`)).res.status;
    assert.equal(last, 429);
  });

  it('records password events without the password', async () => {
    const actions = (await owner.browser.get('/api/admin/activity')).body.map((e: any) => `${e.action}:${e.result}`);
    for (const a of ['auth.password_login:success', 'auth.password_login:failure', 'security.password_set:success', 'security.password_changed:success', 'security.password_changed:failure']) {
      assert.ok(actions.includes(a), `missing ${a}`);
    }
    const dump = JSON.stringify((await t.db.query('SELECT * FROM audit_events')).rows);
    assert.ok(!dump.includes(PASSWORD) && !dump.includes('another long passphrase'));
  });
});

describe('first-owner setup with a password', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  before(async () => { mock.method(console, 'error', () => {}); t = await createTestContext(); });
  after(async () => { mock.restoreAll(); await t?.close(); });

  it('needs the setup token, signs the owner in, returns recovery codes and then closes', async () => {
    const setup = (b: Browser, extra: Record<string, unknown>) => b.post('/api/auth/setup/password', { email: OWNER_EMAIL, setupToken: SETUP_TOKEN, password: PASSWORD, turnstileToken: TURNSTILE_PASS, ...extra });
    assert.equal((await setup(t.browser(), { setupToken: 'wrong-token-wrong-token-wrong' })).status, 403);
    assert.equal((await setup(t.browser(), { password: 'short' })).status, 400);
    const b = t.browser();
    const done = await setup(b, {});
    assert.equal(done.status, 200, done.text);
    assert.equal(done.body.recoveryCodes.length, 10);
    assert.equal(done.body.owner.hasPassword, true);
    assert.equal((await b.get('/api/admin/me')).status, 200);
    assert.equal((await t.browser().get('/api/auth/state')).body.setupOpen, false);
    assert.equal((await setup(t.browser(), { password: 'a different passphrase' })).status, 403, 'setup is closed');
    assert.equal((await t.browser().post('/api/auth/password-login', { email: OWNER_EMAIL, password: PASSWORD, turnstileToken: TURNSTILE_PASS })).status, 200);
  });
});
