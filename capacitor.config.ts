import type { CapacitorConfig } from '@capacitor/cli';

// Android-App via Capacitor. Die Web-App laeuft im WebView unter
// https://path.pixmatic.ch, damit Supabase-Auth-Mails zurueck auf
// eine verifizierbare URL zeigen (Android App Links + assetlinks.json).
const config: CapacitorConfig = {
  appId: 'ch.pixmatic.path',
  appName: 'PATH',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
    hostname: 'path.pixmatic.ch',
  },
};

export default config;
