/**
 * Gera e baixa um CSV a partir de linhas de dados. Usa `;` como
 * delimitador (não `,`): o Excel em locale pt-BR usa vírgula como
 * separador decimal, então espera `;` separando colunas — usar `,`
 * quebraria o parse de qualquer valor monetário. O BOM UTF-8 garante
 * que acentos apareçam corretos ao abrir no Excel.
 */
/** Formata um número no padrão pt-BR (vírgula decimal) para uso em células de CSV — Excel em locale pt-BR não reconhece ponto decimal. */
export function csvNumber(value: number, digits = 2): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function escapeCsvValue(value: string | number) {
  const str = String(value);
  return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function rowsToCsvLines(rows: Record<string, string | number>[]): string[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);
  return [headers.join(";"), ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(";"))];
}

function triggerCsvDownload(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  triggerCsvDownload(filename, rowsToCsvLines(rows).join("\n"));
}

/** Um CSV só com várias seções (título + linhas), separadas por uma linha em branco. */
export function downloadMultiSectionCsv(filename: string, sections: { title: string; rows: Record<string, string | number>[] }[]) {
  const blocks = sections
    .filter((s) => s.rows.length > 0)
    .map((s) => [s.title, ...rowsToCsvLines(s.rows)].join("\n"));
  if (blocks.length === 0) return;
  triggerCsvDownload(filename, blocks.join("\n\n"));
}
