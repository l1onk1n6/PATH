import { getSupabase, isSupabaseConfigured } from './supabase';
import { useAuthStore } from '../store/authStore';

const LEGACY_KEY = 'path-pdf-exports';

interface ExportRecord {
  month: string;  // 'YYYY-MM'
  count: number;
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function emptyRecord(): ExportRecord {
  return { month: currentMonth(), count: 0 };
}

/** Read current record from user_metadata (falls back to localStorage when not logged in) */
function loadRecord(): ExportRecord {
  const meta = useAuthStore.getState().user?.user_metadata;
  if (meta?.pdf_exports) {
    const rec = meta.pdf_exports as ExportRecord;
    return rec.month === currentMonth() ? rec : emptyRecord();
  }
  // Legacy fallback (unauthenticated / first load)
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return emptyRecord();
    const parsed = JSON.parse(raw) as ExportRecord;
    return parsed.month === currentMonth() ? parsed : emptyRecord();
  } catch {
    return emptyRecord();
  }
}

export function getPdfExportCount(): number {
  return loadRecord().count;
}

export function canExportPdf(limit: number): boolean {
  if (limit === Infinity) return true;
  return loadRecord().count < limit;
}

export async function incrementPdfExport(): Promise<void> {
  const record = loadRecord();
  const updated: ExportRecord = { month: currentMonth(), count: record.count + 1 };

  if (isSupabaseConfigured()) {
    try {
      const { data } = await getSupabase().auth.updateUser({
        data: { pdf_exports: updated },
      });
      // Keep local store in sync
      if (data.user) {
        useAuthStore.setState({ user: data.user });
      }
      // Clean up legacy localStorage entry
      localStorage.removeItem(LEGACY_KEY);
      return;
    } catch {
      // Fall through to localStorage on error
    }
  }

  // Fallback: localStorage (unauthenticated / offline)
  localStorage.setItem(LEGACY_KEY, JSON.stringify(updated));
}
