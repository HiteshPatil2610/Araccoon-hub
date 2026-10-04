// Spreadsheet-safe CSV: every cell quoted, embedded quotes doubled, and cells
// that a spreadsheet could treat as a formula (leading = + - @ TAB CR LF,
// including after leading whitespace) prefixed with an apostrophe.
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const safe = /^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function serializeCsv(rows: readonly (readonly unknown[])[]): string {
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
