import * as XLSX from "xlsx";

/**
 * Parse a CSV or Excel (.xlsx / .xls / .xlsm) file buffer into an array of
 * plain objects whose keys are the column headers from the first row.
 *
 * Numbers are returned as numbers, dates as ISO strings, everything else as
 * strings — matching what Zod's coerce variants expect.
 */
export function parseImportFile(buffer: Buffer): Record<string, unknown>[] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false, // keep dates as formatted strings for consistent coercion
    dense: false,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName]!;

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: undefined, // missing cells → undefined (not "" or null)
    raw: true, // numbers stay numbers; strings stay strings
  });
}
