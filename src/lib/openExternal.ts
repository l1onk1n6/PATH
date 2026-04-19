import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

/**
 * Open a URL. On native platforms this uses the in-app browser
 * (Custom Tab on Android) so the user stays inside the app flow;
 * on the web it opens a new tab. `mailto:` links always go through
 * the system default handler.
 */
export async function openExternal(url: string): Promise<void> {
  if (url.startsWith('mailto:')) {
    window.location.href = url;
    return;
  }
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
