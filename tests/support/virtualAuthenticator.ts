// A software WebAuthn authenticator for tests: produces real ES256 (P-256)
// registration and assertion responses that @simplewebauthn/server verifies
// exactly as it would a phone or Windows Hello passkey.
import { isoCBOR } from '@simplewebauthn/server/helpers';

const b64url = (b: Uint8Array) => Buffer.from(b).toString('base64url');
const sha256 = async (d: Uint8Array | string) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', typeof d === 'string' ? new TextEncoder().encode(d) : Uint8Array.from(d)));

function derFromRaw(raw: Uint8Array): Uint8Array {
  const int = (b: Uint8Array) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i++;
    let v = b.slice(i);
    if (v[0]! & 0x80) v = Uint8Array.from([0, ...v]);
    return Uint8Array.from([0x02, v.length, ...v]);
  };
  const r = int(raw.slice(0, 32));
  const s = int(raw.slice(32));
  return Uint8Array.from([0x30, r.length + s.length, ...r, ...s]);
}

export class VirtualAuthenticator {
  private keys!: CryptoKeyPair;
  readonly credentialId = crypto.getRandomValues(new Uint8Array(16));
  private counter = 0;

  constructor(private rpId: string, private origin: string) {}

  async createResponse(options: { challenge: string }) {
    this.keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const jwk = await crypto.subtle.exportKey('jwk', this.keys.publicKey);
    const cose = new Map<number, unknown>([
      [1, 2], [3, -7], [-1, 1],
      [-2, new Uint8Array(Buffer.from(jwk.x!, 'base64url'))],
      [-3, new Uint8Array(Buffer.from(jwk.y!, 'base64url'))],
    ]);
    const coseBytes = isoCBOR.encode(cose as never);
    const idLen = new Uint8Array([0, this.credentialId.length]);
    const authData = Uint8Array.from([
      ...(await sha256(this.rpId)), 0x45 /* UP|UV|AT */, 0, 0, 0, 0,
      ...new Uint8Array(16), ...idLen, ...this.credentialId, ...coseBytes,
    ]);
    const clientData = JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin: this.origin, crossOrigin: false });
    const attestationObject = isoCBOR.encode(new Map<string, unknown>([['fmt', 'none'], ['attStmt', new Map()], ['authData', authData]]) as never);
    return {
      id: b64url(this.credentialId), rawId: b64url(this.credentialId), type: 'public-key',
      response: { clientDataJSON: b64url(new TextEncoder().encode(clientData)), attestationObject: b64url(attestationObject), transports: ['internal'] },
      clientExtensionResults: {},
    };
  }

  async getResponse(options: { challenge: string }, overrides: { origin?: string; userVerified?: boolean } = {}) {
    this.counter++;
    const counter = new Uint8Array(4);
    new DataView(counter.buffer).setUint32(0, this.counter);
    const flags = overrides.userVerified === false ? 0x01 : 0x05;
    const authData = Uint8Array.from([...(await sha256(this.rpId)), flags, ...counter]);
    const clientData = new TextEncoder().encode(JSON.stringify({ type: 'webauthn.get', challenge: options.challenge, origin: overrides.origin ?? this.origin, crossOrigin: false }));
    const signed = Uint8Array.from([...authData, ...(await sha256(clientData))]);
    const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, this.keys.privateKey, signed));
    return {
      id: b64url(this.credentialId), rawId: b64url(this.credentialId), type: 'public-key',
      response: { clientDataJSON: b64url(clientData), authenticatorData: b64url(authData), signature: b64url(derFromRaw(raw)) },
      clientExtensionResults: {},
    };
  }
}
