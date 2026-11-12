import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, KeyRound, LifeBuoy, LogIn, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { api, HttpError } from '../lib/api';
import { useAuth } from './auth';
import { useTheme } from '../lib/theme';
import { Turnstile } from '../components/Turnstile';
import { SectionLabel, TrackingReveal, Viewfinder } from '../components/cine';
import { RecoveryCodes } from './RecoveryCodes';

function friendly(err: unknown): string {
  if (err instanceof HttpError) return err.message;
  if (err instanceof Error && err.name === 'NotAllowedError') return 'The passkey prompt was cancelled or timed out.';
  if (err instanceof Error && err.name === 'InvalidStateError') return 'This device already has a passkey for this account.';
  return err instanceof Error ? err.message : 'Something went wrong.';
}

function Shell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  const { dark, toggle } = useTheme();
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex relative overflow-hidden flex-col justify-between bg-ink text-white p-14">
        <Viewfinder size={620} top="52%" />
        <div aria-hidden="true" className="absolute left-1/2 top-[52%] w-[340px] h-[340px] -ml-[170px] -mt-[170px] rounded-full bg-red" />
        <Link to="/" className="relative font-display text-[34px] leading-none">Raccoon<span className="text-red"> Hub</span></Link>
        <div className="relative">
          <SectionLabel>Owner hub</SectionLabel>
          <TrackingReveal from="0.3em" once><h2 className="text-[clamp(88px,9vw,140px)] leading-[.82] mt-5">Curate.<br />Track.<br />Repeat.</h2></TrackingReveal>
          <p className="mt-6 max-w-sm text-sm text-[var(--cd-gray-300)]">Sign in with your email and password, or with a passkey: your fingerprint, face or device PIN.</p>
        </div>
        <p className="relative eyebrow text-white/60">Private catalog workspace .</p>
      </section>
      <section className="flex items-center justify-center p-4 sm:p-10 bg-bg">
        <div className="w-full max-w-md panel p-6 sm:p-8">
          <h1 className="text-[clamp(44px,5vw,64px)]">{title}</h1>
          <p className="text-sm text-muted-fg mt-1 mb-6">{subtitle}</p>
          {children}
          <Link to="/" className="inline-flex min-h-11 items-center mt-4 eyebrow text-muted-fg hover:text-fg">← Back to the store</Link>
          <button type="button" className="btn btn-ghost !px-0 mt-2 block" onClick={toggle}>{dark ? 'Switch to light mode' : 'Switch to dark mode'}</button>
        </div>
      </section>
    </main>
  );
}

export function SignIn() {
  const { state, setOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'password' | 'passkey' | 'recover' | 'setup'>(state?.setupOpen ? 'setup' : 'password');
  const [turnstile, setTurnstile] = useState<string>();
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const lock = useRef(false);
  const supported = browserSupportsWebAuthn();
  const next = (location.state as { from?: string } | null)?.from ?? '/admin';

  useEffect(() => { if (state?.setupOpen) setMode('setup'); }, [state?.setupOpen]);

  const run = async (fn: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(friendly(e));
      setResetKey(k => k + 1);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const passkeyLogin = () => run(async () => {
    const { challengeId, options } = await api.loginOptions({ turnstileToken: turnstile });
    const response = await startAuthentication({ optionsJSON: options });
    const { owner } = await api.loginVerify({ challengeId, response });
    setOwner(owner);
    navigate(next, { replace: true });
  });

  const passwordLogin = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { owner } = await api.passwordLogin({ email, password: secret, turnstileToken: turnstile });
      setOwner(owner);
      navigate(next, { replace: true });
    });
  };

  const switchTo = (m: typeof mode) => { setMode(m); setError(''); setSecret(''); };

  const recover = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { owner } = await api.recover({ email, code: secret, turnstileToken: turnstile });
      setOwner(owner);
      navigate('/admin/settings', { replace: true });
    });
  };

  const setupWithPassword = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (newPassword.length < 12) throw new Error('Use at least 12 characters for the password.');
      const res = await api.setupPassword({ email, setupToken: secret, password: newPassword, turnstileToken: turnstile });
      setCodes(res.recoveryCodes);
      setOwner(res.owner);
    });
  };

  const setup = () => {
    void run(async () => {
      const { challengeId, options } = await api.setupOptions({ email, setupToken: secret, turnstileToken: turnstile });
      const response = await startRegistration({ optionsJSON: options });
      const res = await api.setupVerify({ challengeId, response, name: deviceName() });
      setCodes(res.recoveryCodes);
      setOwner(res.owner);
    });
  };

  if (codes) {
    return (
      <Shell title="Save your recovery codes" subtitle="Each code works once if you forget your password or lose your passkey.">
        <RecoveryCodes codes={codes} />
        <button type="button" className="btn btn-primary w-full mt-5" onClick={() => navigate('/admin', { replace: true })}>I saved them — open the hub</button>
      </Shell>
    );
  }

  return (
    <Shell
      title={mode === 'setup' ? 'Set up the owner account' : mode === 'recover' ? 'Use a recovery code' : 'Welcome back'}
      subtitle={mode === 'setup' ? 'First run: create the owner account with a password or a passkey. This closes once the account has a sign-in method.' : mode === 'recover' ? 'Sign in once with a recovery code, then set a new password or add a new passkey.' : 'Sign in to manage finds and review recorded catalog activity.'}
    >
      {(mode === 'password' || mode === 'passkey') && (
        <div role="tablist" aria-label="Sign-in method" className="grid grid-cols-2 gap-2 mb-5">
          <button type="button" role="tab" aria-selected={mode === 'password'} className={`btn ${mode === 'password' ? 'btn-sun' : ''}`} onClick={() => switchTo('password')}>
            <KeyRound className="w-4 h-4" /> Email &amp; password
          </button>
          <button type="button" role="tab" aria-selected={mode === 'passkey'} className={`btn ${mode === 'passkey' ? 'btn-sun' : ''}`} onClick={() => switchTo('passkey')}>
            <Fingerprint className="w-4 h-4" /> Passkey
          </button>
        </div>
      )}

      {(mode === 'passkey' || mode === 'setup') && !supported && <p role="alert" className="panel-sm !bg-coral text-on-coral p-3 text-sm font-bold mb-4">This browser doesn't support passkeys. Try an up-to-date Chrome, Edge, Safari or Firefox.</p>}

      {mode === 'password' && (
        <form onSubmit={passwordLogin} className="space-y-4">
          <div>
            <label htmlFor="pw-email" className="field-label">Email</label>
            <input id="pw-email" aria-describedby={error ? 'auth-error' : undefined} type="email" autoComplete="username" className="field" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
          </div>
          <div>
            <label htmlFor="pw-password" className="field-label">Password</label>
            <input id="pw-password" aria-describedby={error ? 'auth-error' : undefined} type="password" autoComplete="current-password" className="field" value={secret} onChange={e => setSecret(e.target.value)} required maxLength={128} />
          </div>
          <Turnstile siteKey={state?.turnstileSiteKey ?? null} onToken={setTurnstile} resetKey={resetKey} />
          <button type="submit" className="btn btn-primary w-full !py-3" disabled={busy || !email || !secret}>
            <LogIn className="w-4 h-4" /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-xs text-muted-fg">No password yet? Sign in another way, then set one under Account.</p>
        </form>
      )}

      {mode === 'passkey' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-fg">Use the fingerprint, face or PIN prompt on this device, or scan a QR code with your phone.</p>
          <Turnstile siteKey={state?.turnstileSiteKey ?? null} onToken={setTurnstile} resetKey={resetKey} />
          <button type="button" className="btn btn-primary w-full !py-3" disabled={busy || !supported} onClick={passkeyLogin}>
            <Fingerprint className="w-5 h-5" /> {busy ? 'Waiting for your passkey…' : 'Sign in with a passkey'}
          </button>
        </div>
      )}

      {(mode === 'recover' || mode === 'setup') && (
        <form onSubmit={mode === 'setup' ? setupWithPassword : recover} className="space-y-4">
          <div>
            <label htmlFor="email" className="field-label">Owner email</label>
            <input id="email" aria-describedby={error ? 'auth-error' : undefined} type="email" autoComplete="username" className="field" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} />
          </div>
          <div>
            <label htmlFor="secret" className="field-label">{mode === 'setup' ? 'Setup token' : 'Recovery code'}</label>
            <input id="secret" aria-describedby={error ? 'auth-error' : undefined} className="field font-mono" autoComplete="off" spellCheck={false} value={secret} onChange={e => setSecret(e.target.value)} required
              placeholder={mode === 'setup' ? 'From OWNER_SETUP_TOKEN' : 'XXXX-XXXX-XXXX'} maxLength={200} />
          </div>
          {mode === 'setup' && (
            <div>
              <label htmlFor="setup-password" className="field-label">Choose a password</label>
              <input id="setup-password" type="password" autoComplete="new-password" aria-describedby="setup-password-hint" className="field" minLength={12} maxLength={128} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <p id="setup-password-hint" className="text-xs text-muted-fg mt-1">At least 12 characters. Leave empty if you only want a passkey.</p>
            </div>
          )}
          <Turnstile siteKey={state?.turnstileSiteKey ?? null} onToken={setTurnstile} resetKey={resetKey} />
          {mode === 'setup' ? (
            <div className="grid gap-2">
              <button type="submit" className="btn btn-primary w-full !py-3" disabled={busy || !email || !secret || !newPassword}>
                <Sparkles className="w-4 h-4" /> Create account with password
              </button>
              <button type="button" className="btn w-full" disabled={busy || !email || !secret || !supported} onClick={setup}>
                <Fingerprint className="w-4 h-4" /> Create with a passkey instead
              </button>
            </div>
          ) : (
            <button type="submit" className="btn btn-primary w-full !py-3" disabled={busy || !email || !secret}>
              <LifeBuoy className="w-4 h-4" /> Sign in with code
            </button>
          )}
        </form>
      )}

      {error && <p id="auth-error" role="alert" className="field-error mt-4">{error}</p>}

      <div className="mt-6 pt-4 border-t border-line flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold">
        {(mode === 'recover' || mode === 'setup') && <button type="button" className="inline-flex min-h-11 items-center gap-1 underline" onClick={() => switchTo('password')}><LogIn className="w-3.5 h-3.5" /> Back to sign in</button>}
        {mode !== 'recover' && <button type="button" className="inline-flex min-h-11 items-center gap-1 underline" onClick={() => switchTo('recover')}><LifeBuoy className="w-3.5 h-3.5" /> Forgot password or lost your device?</button>}
        {state?.setupOpen && mode !== 'setup' && <button type="button" className="inline-flex min-h-11 items-center gap-1 underline" onClick={() => switchTo('setup')}><ShieldCheck className="w-3.5 h-3.5" /> First-time setup</button>}
      </div>

      {state?.devLogin && <DevLogin onDone={() => navigate(next, { replace: true })} />}
    </Shell>
  );
}

/** Local development only (server enables it only when ENVIRONMENT=development). */
function DevLogin({ onDone }: { onDone: () => void }) {
  const { setOwner } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  return (
    <form aria-labelledby="dev-login-title" className="mt-6 p-4 rounded-[var(--radius-m)] border-2 border-dashed border-line bg-muted" onSubmit={async e => {
      e.preventDefault();
      setError('');
      try {
        setOwner((await api.devLogin(token)).owner);
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
      }
    }}>
      <h2 id="dev-login-title" className="flex items-center gap-2 text-[22px] leading-none"><Terminal className="w-4 h-4" aria-hidden="true" /> Developer sign-in</h2>
      <p className="text-xs text-muted-fg mt-2 mb-3">
        Only shown on this computer while <code>ENVIRONMENT=development</code>. Open <code>.env.local</code> in the project folder,
        copy the value after <code>DEV_LOGIN_TOKEN=</code> and paste it here. The live site never shows this.
      </p>
      <label htmlFor="dev-token" className="field-label">Development token</label>
      <div className="flex gap-2">
        <input id="dev-token" type="password" autoComplete="off" className="field !min-h-11" value={token} onChange={e => setToken(e.target.value)} required />
        <button type="submit" className="btn btn-sun !min-h-11" disabled={!token}>Sign in</button>
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
    </form>
  );
}

export function deviceName(): string {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : 'Device';
  return `${os} passkey`;
}

/** /admin/invite#<token> — an invited owner creates their passkey. */
export function AcceptInvite() {
  const { state, setOwner } = useAuth();
  const navigate = useNavigate();
  const [token] = useState(() => window.location.hash.slice(1));
  const [turnstile, setTurnstile] = useState<string>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const lock = useRef(false);

  useEffect(() => { history.replaceState(null, '', window.location.pathname); }, []); // keep the token out of history

  const accept = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const { challengeId, options } = await api.inviteOptions({ token, turnstileToken: turnstile });
      const response = await startRegistration({ optionsJSON: options });
      const res = await api.inviteVerify({ token, challengeId, response, name: deviceName() });
      setOwner(res.owner);
      setCodes(res.recoveryCodes);
    } catch (e) {
      setError(friendly(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  if (codes) {
    return (
      <Shell title="You're in! Save your recovery codes" subtitle="Each code works once if you lose your passkey.">
        <RecoveryCodes codes={codes} />
        <button type="button" className="btn btn-primary w-full mt-5" onClick={() => navigate('/admin', { replace: true })}>Open the owner hub</button>
      </Shell>
    );
  }
  return (
    <Shell title="Accept your invitation" subtitle="Create a passkey on this device to become an owner of Raccoon Hub.">
      {!token && <p role="alert" className="field-error mb-4">This invitation link is incomplete. Ask for a new one.</p>}
      <Turnstile siteKey={state?.turnstileSiteKey ?? null} onToken={setTurnstile} />
      <button type="button" className="btn btn-primary w-full !py-3 mt-4" disabled={busy || !token} onClick={accept}>
        <Fingerprint className="w-5 h-5" /> {busy ? 'Waiting for your passkey…' : 'Create my passkey'}
      </button>
      {error && <p role="alert" className="field-error mt-4">{error}</p>}
    </Shell>
  );
}
