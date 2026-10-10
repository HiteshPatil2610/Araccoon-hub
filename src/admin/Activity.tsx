import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { PageHeader } from './AdminLayout';
import type { AuditEntry } from '../../shared/types';

const LABELS: Record<string, string> = {
  'auth.login': 'Signed in', 'auth.setup': 'Owner setup', 'auth.recovery': 'Recovery code sign-in', 'auth.invite_accepted': 'Accepted invitation',
  'auth.dev_login': 'Development sign-in', 'product.create': 'Added a product', 'product.update': 'Edited a product', 'product.delete': 'Deleted a product',
  'product.duplicate': 'Duplicated a product', 'analytics.export': 'Exported clicks', 'analytics.reset': 'Reset analytics',
  'conversion.manual': 'Recorded a sale', 'conversion.webhook': 'Sale received (webhook)', 'conversion.delete': 'Deleted a sale',
  'security.passkey_added': 'Added a passkey', 'security.passkey_removed': 'Removed a passkey', 'security.recovery_codes_regenerated': 'New recovery codes',
  'security.session_revoked': 'Signed out a device', 'security.sessions_revoked': 'Signed out other devices', 'security.owner_invited': 'Invited an owner',
  'security.owner_disabled': 'Disabled an owner', 'security.owner_enabled': 'Re-enabled an owner',
};
const label = (a: string) => LABELS[a] ?? (a.startsWith('product.bulk_') ? `Bulk ${a.slice(13)}` : a);

export function ActivityLog() {
  const [items, setItems] = useState<AuditEntry[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const more = async (before?: string) => {
    setLoading(true);
    try {
      const page = await api.activity(before);
      setItems(i => (before ? [...i, ...page] : page));
      setDone(page.length < 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load activity.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void more(); }, []);

  return (
    <>
      <PageHeader title="Activity" subtitle="Every sign-in and change in the owner hub. Failed sign-ins are shown too." />
      {error && <p role="alert" className="field-error mb-4">{error}</p>}
      <ol className="panel divide-y divide-[color:var(--border)]/15">
        {items.map(e => (
          <li key={e.id} className="grid grid-cols-[20px_minmax(0,1fr)] sm:flex sm:items-start gap-x-3 gap-y-1 p-3">
            {e.result === 'success' ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" aria-label="Succeeded" /> : <XCircle className="w-5 h-5 text-danger shrink-0" aria-label="Failed" />}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{label(e.action)}{e.result === 'failure' && <span className="text-danger"> — failed</span>}</p>
              <p className="text-xs text-muted-fg truncate">{e.actor ?? 'Unknown / system'}{e.target ? ` · ${e.target}` : ''}</p>
            </div>
            <time className="col-start-2 text-xs text-muted-fg sm:whitespace-nowrap" dateTime={e.occurredAt}>{new Date(e.occurredAt).toLocaleString()}</time>
          </li>
        ))}
        {!items.length && !loading && <li className="p-4 text-sm text-muted-fg">Nothing yet.</li>}
      </ol>
      {!done && items.length > 0 && (
        <button type="button" className="btn mt-4" disabled={loading} onClick={() => more(items.at(-1)!.id)}>{loading ? 'Loading…' : 'Load older'}</button>
      )}
    </>
  );
}
