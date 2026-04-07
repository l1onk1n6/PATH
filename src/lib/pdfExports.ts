const KEY = 'path-pdf-exports';

interface ExportRecord {
  month: string;   // 'YYYY-MM'
  count: number;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function load(): ExportRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { month: currentMonth(), count: 0 };
    const parsed = JSON.parse(raw) as ExportRecord;
    // Reset counter if we're in a new month
    if (parsed.month !== currentMonth()) return { month: currentMonth(), count: 0 };
    return parsed;
  } catch {
    return { month: currentMonth(), count: 0 };
  }
}

function save(record: ExportRecord) {
  localStorage.setItem(KEY, JSON.stringify(record));
}

export function getPdfExportCount(): number {
  return load().count;
}

export function incrementPdfExport(): void {
  const record = load();
  save({ ...record, count: record.count + 1 });
}

export function canExportPdf(limit: number): boolean {
  if (limit === Infinity) return true;
  return load().count < limit;
}
