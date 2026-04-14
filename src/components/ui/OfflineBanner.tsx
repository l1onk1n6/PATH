import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * Shows a fixed banner at the top of the screen when the device is offline.
 * Mount once in AppShell — renders nothing while online.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 10000,
        background: 'rgba(255,159,10,0.97)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '9px 16px',
        fontSize: 13,
        fontWeight: 600,
        color: '#000',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        letterSpacing: '0.01em',
      }}
    >
      <WifiOff size={15} />
      Keine Internetverbindung — Änderungen werden lokal gespeichert
    </div>
  );
}
