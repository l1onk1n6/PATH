/**
 * Supabase Storage helpers for documents and avatars.
 * Documents are stored in the private 'documents' bucket (signed URLs required).
 * Avatars are stored in the public 'avatars' bucket (permanent public URLs).
 */
import { getSupabase } from './supabase';

export const DOCUMENTS_BUCKET = 'documents';
export const AVATARS_BUCKET = 'avatars';

/** Upload a document file. Returns the storage path (e.g. "uid/docId.pdf") or null on failure. */
export async function uploadDocument(
  userId: string,
  docId: string,
  file: File,
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${userId}/${docId}.${ext}`;
    const { error } = await getSupabase().storage
      .from(DOCUMENTS_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    return path;
  } catch (e) {
    console.warn('[storage] uploadDocument', e);
    return null;
  }
}

/** Create a signed URL for a private document (valid for 1 hour). */
export async function getDocumentSignedUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await getSupabase().storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  } catch (e) {
    console.warn('[storage] getDocumentSignedUrl', e);
    return null;
  }
}

/** Delete a file from any storage bucket. Silently ignores errors. */
export async function deleteStorageFile(bucket: string, path: string): Promise<void> {
  try {
    await getSupabase().storage.from(bucket).remove([path]);
  } catch (e) {
    console.warn('[storage] deleteStorageFile', e);
  }
}

/** Upload an avatar image to the public avatars bucket. Returns the permanent public URL or null. */
export async function uploadAvatar(
  userId: string,
  personId: string,
  file: File,
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${personId}.${ext}`;
    const { error } = await getSupabase().storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = getSupabase().storage.from(AVATARS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn('[storage] uploadAvatar', e);
    return null;
  }
}

export interface StorageFileEntry {
  name: string;        // original filename, e.g. "some-uuid.pdf"
  storagePath: string; // full bucket path, e.g. "uid/some-uuid.pdf"
  size: number;
  mimeType: string;
}

function mimeFromExt(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  };
  return map[ext] ?? 'application/octet-stream';
}

/** List all document files for a user in Supabase Storage. */
export async function listUserDocuments(userId: string): Promise<StorageFileEntry[]> {
  try {
    const { data, error } = await getSupabase().storage
      .from(DOCUMENTS_BUCKET)
      .list(userId);
    if (error) throw error;
    return (data ?? []).map(item => ({
      name: item.name,
      storagePath: `${userId}/${item.name}`,
      size: (item.metadata?.size as number) ?? 0,
      mimeType: (item.metadata?.mimetype as string) || mimeFromExt(item.name),
    }));
  } catch (e) {
    console.warn('[storage] listUserDocuments', e);
    return [];
  }
}

/**
 * Download a file and trigger browser save dialog.
 * Handles both data: URIs (old base64) and HTTPS URLs (Supabase Storage).
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    let blobUrl: string;
    if (url.startsWith('data:')) {
      blobUrl = url;
    } else {
      const response = await fetch(url);
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
    }
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (!url.startsWith('data:')) URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.warn('[storage] downloadFile', e);
  }
}
