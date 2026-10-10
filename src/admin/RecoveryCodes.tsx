import { useState } from 'react';
import { Copy, Download } from 'lucide-react';
import { downloadBlob } from '../lib/api';

/** Shows freshly issued recovery codes once, with copy/download helpers. */
export function RecoveryCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);
  const text = `Raccoon Hub recovery codes (each works once)\n\n${codes.join('\n')}\n`;
  return (
    <div>
      <ol className="grid grid-cols-1 min-[440px]:grid-cols-2 gap-2 font-mono text-sm panel-sm !bg-muted p-4" aria-label="Recovery codes">
        {codes.map(c => <li key={c} className="min-w-0 break-words tracking-wider">{c}</li>)}
      </ol>
      <div className="flex gap-2 mt-3">
        <button type="button" className="btn flex-1" onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        }}><Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy'}</button>
        <button type="button" className="btn flex-1" onClick={() => downloadBlob(new Blob([text], { type: 'text/plain' }), 'araccoon-recovery-codes.txt')}>
          <Download className="w-4 h-4" /> Download
        </button>
      </div>
      <p className="text-xs text-muted-fg mt-3">Store them somewhere safe (a password manager or printed). They won't be shown again.</p>
    </div>
  );
}
