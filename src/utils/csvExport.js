/**
 * CSV export helpers used by the teacher portal.
 *
 * `data:text/csv,...` + `encodeURI` corrupts values containing commas,
 * quotes, or newlines and hits browser URL length limits for large
 * classes. These helpers escape properly and build a Blob URL instead.
 */

/**
 * Escape a single cell for CSV per RFC 4180: wrap in double quotes and
 * double any embedded quotes. Null/undefined become empty strings.
 */
export const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Build the CSV text (header + rows). `rows` is an array of objects; the
 * columns are the keys of the first row and every row is read in that
 * order. A leading BOM is added so Excel opens UTF-8 without mojibake.
 */
export const buildCsvContent = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCsvCell).join(',');
  const bodyLines = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header])).join(',')
  );
  return `﻿${[headerLine, ...bodyLines].join('\n')}`;
};

/**
 * Trigger a browser download for the given CSV text. Split out so tests
 * can stub the download step and exercise the content builder directly.
 */
export const downloadCsv = (csvContent, filename) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const csvExport = { escapeCsvCell, buildCsvContent, downloadCsv };
export default csvExport;
