import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

/**
 * Share a link via the platform-native share sheet on mobile,
 * falling back to clipboard copy on the web.
 * Returns `true` when the user saw a native share sheet, `false` when
 * the URL was copied to the clipboard (so the caller can show a toast).
 */
export async function shareLink(url: string, title: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    await Share.share({ title, url, dialogTitle: title });
    return true;
  }
  await navigator.clipboard.writeText(url);
  return false;
}
