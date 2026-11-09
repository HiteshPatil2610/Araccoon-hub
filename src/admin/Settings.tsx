import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Copy, Fingerprint, KeyRound, Laptop, LockKeyhole, Pencil, Trash2, UserPlus } from 'lucide-react';
import { api, type OwnerRow, type SessionRow } from '../lib/api';
import { PageHeader } from './AdminLayout';
import { useAuth } from './auth';
import { deviceName } from './SignIn';
import { RecoveryCodes } from './RecoveryCodes';
import { Dialog, ConfirmDialog } from '../components/Dialog';
import { useToast } from '../components/Toasts';
import type { PasskeyInfo } from '../../shared/types';

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="text-[30px]">{title}</h2>
      {description && <p className="text-sm text-muted-fg mt-1 mb-4">{description}</p>}
      {children}
    </section>
  );
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : 'never');

export function Settings() {
  const { owner, setOwner } = useAuth();
  const toast = useToast();
  const recovering = owner?.needsPasskey ?? false;
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [codesLeft, setCodesLeft] = useState<{ total: number; unused: number } | null>(null);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [owners, setOwners] = useState<OwnerRow[]>([]);
  const [name, setName] = useState(owner?.displayName ?? '');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [rename, setRename] = useState<PasskeyInfo | null>(null);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; action: () => Promise<unknown> }>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const lock = useRef(false);

  const load = useCallback(async () => {
    setPasskeys(await api.passkeys());
    if (!recovering) {
      const [c, s, o] = await Promise.all([api.recoveryStatus(), api.sessions(), api.owners()]);
      setCodesLeft(c); setSessions(s); setOwners(o);
    }
  }, [recovering]);
  useEffect(() => { load().catch(e => toast('error', e.message)); }, [load, toast]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setActionError('');
    try {
      await fn();
      toast('success', ok);
      await load();
      setConfirm(null);
      return true;
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'The action failed. Try again.');
      toast('error', e instanceof Error ? e.message : 'Something went wrong.');
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const addPasskey = () => act(async () => {
    const { challengeId, options } = await api.passkeyOptions();
    const response = await startRegistration({ optionsJSON: options });
    await api.passkeyVerify({ challengeId, response, name: deviceName() });
    if (recovering) setOwner(await api.me());
  }, 'Passkey added.');

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    void act(async () => setOwner(await api.updateMe(name)), 'Name saved.');
  };

  const invite = (e: FormEvent) => {
    e.preventDefault();
    void act(async () => { setInviteUrl((await api.inviteOwner(inviteEmail)).inviteUrl); setInviteEmail(''); }, 'Invitation created — send the link privately.');
  };

  return (
    <>
      <PageHeader title="Account & security" subtitle="Your profile, sign-in methods and who can manage the store." />
      <div className="grid gap-6">
        <PasswordCard recovering={recovering} hasPassword={owner?.hasPassword ?? false} canRemove={passkeys.length > 0} busy={busy}
          onSave={(b) => act(async () => setOwner(await api.setPassword(b)), owner?.hasPassword && !recovering ? 'Password changed. Other devices were signed out.' : 'Password set. You can now sign in with your email and password.')}
          onRemove={() => setConfirm({ title: 'Remove your password?', message: 'You will only be able to sign in with a passkey or a recovery code.', action: async () => setOwner(await api.removePassword()) })} />

        <Card title="Passkeys" description="Sign in with your fingerprint, face or device PIN. Add one on each device you use (phone + laptop), so losing one never locks you out.">
          <ul className="space-y-2 mb-4">
            {passkeys.map(p => (
              <li key={p.id} className="grid grid-cols-[20px_minmax(0,1fr)] sm:flex sm:items-center gap-3 panel-sm p-3">
                <Fingerprint className="w-5 h-5 shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{p.name}{p.backedUp && <span className="chip !ml-2 !bg-sky !text-on-sky !border-line">Synced</span>}</p>
                  <p className="text-xs text-muted-fg">Added {when(p.createdAt)} · last used {when(p.lastUsedAt)}</p>
                </div>
                {!recovering && <div className="col-start-2 flex shrink-0 gap-2">
                  <button type="button" className="btn btn-ghost !px-2" aria-label={`Rename ${p.name}`} onClick={() => setRename(p)}><Pencil className="w-4 h-4" /></button>
                  <button type="button" className="btn btn-ghost !px-2" aria-label={`Remove ${p.name}`} disabled={passkeys.length <= 1 && !owner?.hasPassword}
                    onClick={() => setConfirm({ title: 'Remove this passkey?', message: `“${p.name}” will no longer be able to sign in.`, action: () => api.deletePasskey(p.id) })}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>}
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={addPasskey}><Fingerprint className="w-4 h-4" /> Add a passkey on this device</button>
        </Card>

        {!recovering && <>
          <Card title="Recovery codes" description="One-time codes for when you forget your password or can't use a passkey. Keep them offline.">
            {newCodes ? <RecoveryCodes codes={newCodes} /> : (
              <>
                <p className="text-sm font-bold mb-3">
                  {!codesLeft ? '…' : codesLeft.total === 0 ? 'You have no recovery codes yet.' : `${codesLeft.unused} of ${codesLeft.total} codes unused`}
                </p>
                {codesLeft && codesLeft.total > 0 && codesLeft.unused <= 3 && <p className="text-sm text-danger font-bold mb-3">Running low — generate a fresh set.</p>}
                <button type="button" className="btn" disabled={busy} onClick={() => setConfirm({
                  title: 'Generate new recovery codes?', message: 'Your current codes will stop working immediately.',
                  action: async () => setNewCodes((await api.regenerateRecoveryCodes()).recoveryCodes),
                })}><KeyRound className="w-4 h-4" /> Generate new codes</button>
              </>
            )}
          </Card>

          <Card title="Profile">
            <form onSubmit={saveName} className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1"><label htmlFor="s-name" className="field-label">Display name</label><input id="s-name" className="field" maxLength={80} value={name} onChange={e => setName(e.target.value)} /></div>
              <button type="submit" className="btn btn-sun" disabled={busy}>Save</button>
            </form>
            <p className="text-xs text-muted-fg mt-2">Signed in as {owner?.email}</p>
          </Card>

          <Card title="Signed-in devices" description="Sessions last 12 hours. Sign out anything you don't recognise.">
            <ul className="space-y-2 mb-4">
              {sessions.map(s => (
                <li key={s.id} className="grid grid-cols-[20px_minmax(0,1fr)] sm:flex sm:items-center gap-3 panel-sm p-3">
                  <Laptop className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{s.userAgent?.match(/\(([^)]+)\)/)?.[1] ?? 'Unknown device'}{s.current && <span className="chip !ml-2 !bg-sun !text-on-sun">This device</span>}</p>
                    <p className="text-xs text-muted-fg">Active {when(s.lastSeenAt)}</p>
                  </div>
                  {!s.current && <button type="button" className="btn btn-ghost col-start-2 justify-self-start shrink-0" onClick={() => act(() => api.revokeSession(s.id), 'Device signed out.')}>Sign out</button>}
                </li>
              ))}
            </ul>
            {sessions.length > 1 && <button type="button" className="btn" disabled={busy} onClick={() => act(api.revokeOtherSessions, 'Other devices signed out.')}>Sign out all other devices</button>}
          </Card>

          <Card title="Owners" description="Everyone listed can manage products and see analytics. Disabling someone signs them out instantly.">
            <ul className="space-y-2 mb-4">
              {owners.map(o => (
                <li key={o.id} className="flex flex-col items-start sm:flex-row sm:items-center gap-3 panel-sm p-3">
                  <div className="w-full sm:w-auto flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{o.displayName || o.email}{o.you && <span className="chip !ml-2">You</span>}{o.disabled && <span className="chip !ml-2 !bg-coral !text-on-coral">Disabled</span>}</p>
                    <p className="text-xs text-muted-fg truncate">{o.email} · {o.passkeys} passkey{o.passkeys === 1 ? '' : 's'}</p>
                  </div>
                  {!o.you && (o.disabled
                    ? <button type="button" className="btn btn-ghost" onClick={() => act(() => api.enableOwner(o.id), 'Owner re-enabled.')}>Enable</button>
                    : <button type="button" className="btn btn-ghost text-danger" onClick={() => setConfirm({ title: `Disable ${o.email}?`, message: 'They will be signed out everywhere and cannot sign in until re-enabled.', action: () => api.disableOwner(o.id) })}>Disable</button>)}
                </li>
              ))}
            </ul>
            <form onSubmit={invite} className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1"><label htmlFor="s-inv" className="field-label">Invite another owner</label><input id="s-inv" type="email" className="field" placeholder="name@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required /></div>
              <button type="submit" className="btn btn-sun" disabled={busy || !inviteEmail}><UserPlus className="w-4 h-4" /> Create invite</button>
            </form>
            {inviteUrl && (
              <div className="mt-3 panel-sm !bg-muted p-3">
                <p className="text-xs font-bold mb-1">Single-use link, valid 48 hours. Send it privately:</p>
                <div className="flex gap-2"><input readOnly aria-label="Invitation link" className="field font-mono !text-xs" value={inviteUrl} />
                  <button type="button" className="btn !px-3" aria-label="Copy link" onClick={() => navigator.clipboard.writeText(inviteUrl).then(() => toast('success', 'Copied.'))}><Copy className="w-4 h-4" /></button></div>
              </div>
            )}
          </Card>
        </>}
      </div>

      <RenameDialog passkey={rename} busy={busy} error={actionError} onClose={() => { setRename(null); setActionError(''); }} onSave={async (n) => { if (await act(() => api.renamePasskey(rename!.id, n), 'Renamed.')) setRename(null); }} />
      <ConfirmDialog open={confirm !== null} title={confirm?.title ?? ''} message={<>{confirm?.message}{actionError && <p role="alert" className="field-error mt-3">{actionError}</p>}</>} confirmLabel="Confirm" danger busy={busy}
        onClose={() => { setConfirm(null); setActionError(''); }} onConfirm={() => confirm && act(confirm.action, 'Done.')} />
    </>
  );
}

function PasswordCard({ recovering, hasPassword, canRemove, busy, onSave, onRemove }: {
  recovering: boolean; hasPassword: boolean; canRemove: boolean; busy: boolean;
  onSave: (b: { currentPassword?: string; newPassword: string }) => Promise<boolean>; onRemove: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const needCurrent = hasPassword && !recovering;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next.length < 12) return setError('Use at least 12 characters. A short phrase of a few words works well.');
    if (next !== again) return setError('The two new passwords do not match.');
    setError('');
    if (await onSave({ newPassword: next, ...(needCurrent ? { currentPassword: current } : {}) })) {
      setCurrent(''); setNext(''); setAgain('');
    }
  };

  return (
    <Card title="Password" description={hasPassword
      ? 'Sign in with your email and this password from any device. Changing it signs out your other devices.'
      : 'Set a password to sign in with your email on any device, without needing a passkey.'}>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 sm:items-end">
        {needCurrent && (
          <div className="sm:col-span-2"><label htmlFor="pw-current" className="field-label">Current password</label>
            <input id="pw-current" type="password" autoComplete="current-password" className="field" maxLength={128} value={current} onChange={e => setCurrent(e.target.value)} required /></div>
        )}
        <div><label htmlFor="pw-new" className="field-label">New password</label>
          <input id="pw-new" type="password" autoComplete="new-password" aria-describedby="pw-hint" className="field" minLength={12} maxLength={128} value={next} onChange={e => setNext(e.target.value)} required /></div>
        <div><label htmlFor="pw-again" className="field-label">Repeat new password</label>
          <input id="pw-again" type="password" autoComplete="new-password" className="field" minLength={12} maxLength={128} value={again} onChange={e => setAgain(e.target.value)} required /></div>
        <p id="pw-hint" className="text-xs text-muted-fg sm:col-span-2">At least 12 characters. Don't reuse a password from another site.</p>
        {error && <p role="alert" className="field-error sm:col-span-2">{error}</p>}
        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={busy || !next || !again}><LockKeyhole className="w-4 h-4" /> {hasPassword && !recovering ? 'Change password' : 'Set password'}</button>
          {hasPassword && !recovering && <button type="button" className="btn btn-ghost text-danger" disabled={busy || !canRemove} title={canRemove ? undefined : 'Add a passkey first'} onClick={onRemove}>Remove password</button>}
        </div>
      </form>
    </Card>
  );
}

function RenameDialog({ passkey, busy, error, onClose, onSave }: { passkey: PasskeyInfo | null; busy: boolean; error: string; onClose: () => void; onSave: (name: string) => void }) {
  const [value, setValue] = useState('');
  useEffect(() => setValue(passkey?.name ?? ''), [passkey]);
  return (
    <Dialog open={passkey !== null} busy={busy} onClose={onClose} title="Rename passkey">
      <form onSubmit={e => { e.preventDefault(); if (value.trim()) onSave(value.trim()); }} className="space-y-4">
        <div><label htmlFor="rn" className="field-label">Name</label><input id="rn" className="field" maxLength={60} value={value} onChange={e => setValue(e.target.value)} /></div>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="flex justify-end gap-3"><button type="button" disabled={busy} className="btn" onClick={onClose}>Cancel</button><button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Dialog>
  );
}
