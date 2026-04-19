import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Persist a PDF to the user's device. On the web this triggers a browser
 * download via a temporary blob URL; on Android/iOS the file is written
 * to the Documents directory and surfaced through the native share sheet
 * so the user can save/send it.
 */
export async function savePdf(bytes: Uint8Array, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: filename,
      data: uint8ToBase64(bytes),
      directory: Directory.Documents,
      recursive: true,
    });
    await Share.share({
      title: filename,
      url: result.uri,
      dialogTitle: 'PDF teilen oder speichern',
    });
    return;
  }
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
