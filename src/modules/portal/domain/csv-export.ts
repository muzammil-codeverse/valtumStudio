/**
 * A deterministic CSV encoder for customer-facing statements.
 * Neutralise spreadsheet formulas before quoting cells (CSV injection).
 */
export function encodeCsvCell(value: unknown): string {
  const text = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ");
  const neutral = /^[\s]*[=+\-@]/u.test(text) ? "'" + text : text;
  return '"' + neutral.replaceAll('"', '""') + '"';
}

export function formatCsvTable(rows: readonly (readonly unknown[])[]): string {
  return (
    "\uFEFF" + rows.map((row) => row.map(encodeCsvCell).join(",")).join("\r\n") + "\r\n"
  );
}
