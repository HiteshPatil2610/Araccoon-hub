import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTestContext, integrationSkipReason, ORIGIN, OWNER_EMAIL, SETUP_TOKEN, TURNSTILE_PASS, type TestContext } from '../support/testApp';
import { VirtualAuthenticator } from '../support/virtualAuthenticator';

describe('adversarial registration and concurrency', { skip: integrationSkipReason }, () => {
  let t: TestContext;
  let owner: Awaited<ReturnType<TestContext['setupOwner']>>;
  before(async () => { t = await createTestContext(); owner = await t.setupOwner(); });
  after(async () => { await t?.close(); });

  async function invite(email: string) {
    const res = await owner.browser.post('/api/admin/owners/invite', { email });
    assert.equal(res.status, 201, res.text);
    const token = new URL(res.body.inviteUrl).hash.slice(1);
    const browser = t.browser();
    const options = await browser.post('/api/auth/invite/options', { token, turnstileToken: TURNSTILE_PASS });
    assert.equal(options.status, 200, options.text);
    const key = new VirtualAuthenticator('localhost', ORIGIN);
    return { token, browser, key, input: { token, challengeId: options.body.challengeId, response: await key.createResponse(options.body.options) } };
  }

  it('cannot register another account credential before rejecting a mismatched owner', async () => {
    const invited = await invite('cross-owner@example.test');
    const res = await owner.browser.post('/api/admin/passkeys/verify', invited.input);
    assert.equal(res.status, 400); // strict body rejects the invitation token
    const { token: _token, ...registration } = invited.input;
    assert.equal((await owner.browser.post('/api/admin/passkeys/verify', registration)).status, 400);
    assert.equal((await t.db.query('SELECT id FROM passkeys WHERE id = $1', [registration.response.id])).rowCount, 0);
    assert.equal((await invited.browser.post('/api/auth/invite/verify', invited.input)).status, 200, 'legitimate invitation remains usable');
  });

  it('binds invitations to the exact token and rolls back failed verification', async () => {
    const a = await invite('invitation-a@example.test');
    const b = await invite('invitation-b@example.test');
    assert.equal((await a.browser.post('/api/auth/invite/verify', { ...a.input, token: b.token })).status, 400);
    assert.equal((await a.browser.post('/api/auth/invite/verify', { ...a.input, response: {} })).status, 400);
    assert.equal((await a.browser.post('/api/auth/invite/verify', a.input)).status, 200);
    assert.equal((await b.browser.post('/api/auth/invite/verify', b.input)).status, 200);
  });

  it('rejects an invitation when the account was disabled after options were issued', async () => {
    const a = await invite('disabled-pending@example.test');
    const { rows } = await t.db.query<{ id: string }>('SELECT id FROM owners WHERE email = $1', ['disabled-pending@example.test']);
    assert.equal((await owner.browser.post(`/api/admin/owners/${rows[0]!.id}/disable`)).status, 200);
    assert.equal((await a.browser.post('/api/auth/invite/verify', a.input)).status, 403);
    assert.equal((await t.db.query('SELECT id FROM passkeys WHERE owner_id = $1', [rows[0]!.id])).rowCount, 0);
  });

  it('accepts only one concurrent completion of one invitation', async () => {
    const a = await invite('parallel-invite@example.test');
    const results = await Promise.all([a.browser.post('/api/auth/invite/verify', a.input), t.browser().post('/api/auth/invite/verify', a.input)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
  });

  it('retains a last passkey when two credentials are deleted concurrently', async () => {
    const a = await invite('parallel-delete@example.test');
    assert.equal((await a.browser.post('/api/auth/invite/verify', a.input)).status, 200);
    const options = await a.browser.post('/api/admin/passkeys/options');
    const second = new VirtualAuthenticator('localhost', ORIGIN);
    assert.equal((await a.browser.post('/api/admin/passkeys/verify', { challengeId: options.body.challengeId, response: await second.createResponse(options.body.options) })).status, 201);
    const keys = await a.browser.get('/api/admin/passkeys');
    const results = await Promise.all(keys.body.map((k: { id: string }) => a.browser.del(`/api/admin/passkeys/${encodeURIComponent(k.id)}`)));
    assert.deepEqual(results.map((r: { status: number }) => r.status).sort(), [200, 409]);
    assert.equal((await a.browser.get('/api/admin/passkeys')).body.length, 1);
  });

  it('serializes recovery-code regeneration to one usable set', async () => {
    const results = await Promise.all([owner.browser.post('/api/admin/recovery-codes'), owner.browser.post('/api/admin/recovery-codes')]);
    assert.ok(results.every(r => r.status === 200));
    assert.equal((await owner.browser.get('/api/admin/recovery-codes/status')).body.total, 10);
  });

  it('never regresses the passkey counter during simultaneous sign-ins', async () => {
    const attempts = [];
    for (let i = 0; i < 2; i++) {
      const browser = t.browser();
      const start = await browser.post('/api/auth/login/options', { turnstileToken: TURNSTILE_PASS });
      const response = await owner.authenticator.getResponse(start.body.options);
      attempts.push({ browser, input: { challengeId: start.body.challengeId, response }, counter: Buffer.from(response.response.authenticatorData, 'base64url').readUInt32BE(33) });
    }
    const results = await Promise.all(attempts.map(a => a.browser.post('/api/auth/login/verify', a.input)));
    assert.ok(results.some(r => r.status === 200));
    assert.ok(results.every(r => [200, 401, 409].includes(r.status)));
    const acceptedCounter = Math.max(...attempts.filter((_a, i) => results[i]!.status === 200).map(a => a.counter));
    const { rows } = await t.db.query<{ counter: string }>('SELECT counter FROM passkeys WHERE id = $1', [attempts[0]!.input.response.id]);
    assert.equal(Number(rows[0]!.counter), acceptedCounter);
  });

  it('rejects malformed owner, product and conversion IDs without internal errors', async () => {
    for (const [method, path] of [
      ['DELETE', '/api/admin/products/not-a-uuid'], ['DELETE', '/api/admin/analytics/conversions/not-a-uuid'],
      ['POST', '/api/admin/owners/not-a-uuid/disable'], ['POST', '/api/admin/owners/not-a-uuid/enable'],
    ]) {
      const res = await owner.browser.request(method!, path!, { body: {} });
      assert.equal(res.status, 400, path!);
      assert.equal(res.headers.get('cache-control'), 'no-store');
    }
  });

  it('serializes first-owner setup and rejects a stale setup challenge', async () => {
    const fresh = await createTestContext();
    try {
      const browser = fresh.browser();
      const attempts = [];
      for (let i = 0; i < 2; i++) {
        const start = await browser.post('/api/auth/setup/options', { email: OWNER_EMAIL, setupToken: SETUP_TOKEN, turnstileToken: TURNSTILE_PASS });
        const key = new VirtualAuthenticator('localhost', ORIGIN);
        attempts.push({ challengeId: start.body.challengeId, response: await key.createResponse(start.body.options) });
      }
      const results = await Promise.all(attempts.map(input => browser.post('/api/auth/setup/verify', input)));
      assert.deepEqual(results.map(r => r.status).sort(), [200, 403]);
      assert.equal((await fresh.db.query('SELECT id FROM passkeys')).rowCount, 1);
    } finally { await fresh.close(); }
  });
});
