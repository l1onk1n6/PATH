/**
 * Global toast notification system.
 *
 * Usage:
 *   import { toast } from '../components/ui/Toast';
 *   toast.success('copied');     // picks a random witty message
 *   toast.success('Eigener Text');  // shows literal text
 *   toast.error('pdf');
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// ─── Witty message pool ────────────────────────────────────────────────────────

const POOL: Record<string, string[]> = {
  // ── success keys ──
  copied:       ['Kopiert! Ab in die Zwischenablage 📋', 'Erwischt! ✌️ Strg+V und los!', 'Sauber kopiert — du weißt was du tust 🎯'],
  linkCopied:   ['Link kopiert! Ab damit in die Welt 🚀', 'Frischer Link, warm serviert 🍕', 'Bitteschön — dein persönlicher Bewerbungslink 🎉'],
  saved:        ['Gespeichert, bevor der Strom weg ist 💾', 'Daten sicher vergraben — niemand findet sie 🐱', 'Alles picobello gesichert ✨'],
  pdfExported:  ['PDF frisch aus dem digitalen Ofen 🔥', 'Druckbereit! Die Welt verdient diesen Lebenslauf 🚀', 'Boom — fertig gerendert! 📄', 'Das Recruiting-Team wird beeindruckt sein. Oder auch nicht. Aber gut sieht es aus! 😎'],
  deleted:      ['Puff — weg damit! 💨', 'Ins digitale Nirwana befördert 🌈', 'Gelöscht. Keine Reue. Kein Pardon. 🗑️'],
  linkCreated:  ['Frischer Link, direkt aus der Produktion 🔗', 'Teile ihn mit Headhuntern, Freunden, dem Hund 🎉', 'Dein Bewerbungslink ist lebendig und hungrig 🧟'],
  linkDeleted:  ['Link vernichtet — spurlos verschwunden 💨', 'Dieser Link existiert nicht mehr. War er je da? 🤔'],
  templateChanged: ['Neues Design aktiviert! Kleiderordnung eingehalten 👔', 'Stylish. Sehr stylish. 🎨', 'Der HR-Manager wird das sehen und denken: "Klasse!" 💅'],
  personCreated:['Neue Person, neues Glück! 🎭', 'Willkommen an Bord, neue Bewerberpersönlichkeit! 🚀'],
  resumeCreated:['Neue Mappe angelegt — der erste Schritt zur Traumstelle! 📁', 'Eine Mappe gebaut, der Job wartet schon! 🏆'],
  emailSent:    ['Nachricht sicher angekommen! ✉️ Wir melden uns bald.', 'Abgeschickt! Die Bits sind unterwegs 📡'],
  imported:     ['Daten eingelesen — LinkedIn hat sein Bestes gegeben 🤝', 'Importiert! Wie ein digitaler Umzug 📦'],
  translating:  ['Übersetzer an Bord — gib dem KI einen Moment ✈️', 'Wörter werden in andere Wörter verwandelt ✨'],
  translated:   ['Übersetzt! Jetzt klingt du wie ein Einheimischer 🌍', 'Fertig übersetzt — hoff mal, es klingt noch gut 😅'],
  versionSaved: ['Version eingefroren wie ein Mammut 🦣', 'Snapshot gemacht — die Vergangenheit bleibt bewahrt 📸'],
  versionRestored: ['Zurück in der Zeit! Willkommen in Version X ⏰', 'Wiederhergestellt — Rückwärtsgang eingelegt 🔄'],

  // ── error keys ──
  errorGeneric: ['Hoppla! Da hat was geknirscht 🙈', 'Mist! Bitte nochmal versuchen 🔧', 'Der Server hatte kurz einen schlechten Tag 😬', 'Fehler aufgetaucht — wir machen das schon! 💪'],
  errorNetwork: ['Netzwerk streikt gerade ✊ Kurz warten und nochmal?', 'Die Verbindung hat sich verabschiedet 🏃', 'Kein Internet? Oder der Server schläft 💤'],
  errorPdf:     ['PDF wollte nicht. Manchmal sind Dateien einfach stur 😤', 'Export fehlgeschlagen — kurze Pause, dann nochmal! 🔄'],
  errorLimit:   ['Limit erreicht! Upgrade = mehr Spaß 🚀', 'Da wäre mehr drin — mit Pro 💎', 'Hier endet die Free-Zone. Pro wartet! ⭐'],
  errorRateLimit:['Immer mit der Ruhe, Freund! 🐢 Kurze Pause bitte.', 'So schnell? Atemübung, dann nochmal 🧘'],

  // ── info keys ──
  infoSyncing:  ['Synchronisiere mit der Cloud ☁️', 'Bits werden übertragen ⚡'],
  infoCopied:   ['In die Zwischenablage gewandert 📋'],
};

function pick(key: string): string {
  const list = POOL[key];
  if (list) return list[Math.floor(Math.random() * list.length)];
  return key; // treat unknown keys as literal message text
}

// ─── Store ─────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  items: ToastItem[];
  add: (type: ToastType, msgKey: string, duration?: number) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  items: [],
  add(type, msgKey, duration = 4000) {
    const id = Math.random().toString(36).slice(2);
    const message = pick(msgKey);
    set((s) => ({ items: [...s.items, { id, type, message }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), duration);
  },
  dismiss(id) {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
  },
}));

// ─── Public API ────────────────────────────────────────────────────────────────

export const toast = {
  success: (key: string, duration?: number) => useToastStore.getState().add('success', key, duration),
  error:   (key: string, duration?: number) => useToastStore.getState().add('error',   key, duration),
  info:    (key: string, duration?: number) => useToastStore.getState().add('info',    key, duration),
  warning: (key: string, duration?: number) => useToastStore.getState().add('warning', key, duration),
};

// ─── Toast item component ──────────────────────────────────────────────────────

const TYPE_STYLE: Record<ToastType, { bg: string; border: string; icon: React.ReactNode }> = {
  success: {
    bg:     'rgba(30,40,30,0.97)',
    border: 'rgba(52,199,89,0.35)',
    icon:   <CheckCircle size={15} style={{ color: '#34C759', flexShrink: 0 }} />,
  },
  error: {
    bg:     'rgba(40,20,20,0.97)',
    border: 'rgba(255,59,48,0.4)',
    icon:   <AlertCircle size={15} style={{ color: '#FF3B30', flexShrink: 0 }} />,
  },
  warning: {
    bg:     'rgba(40,35,15,0.97)',
    border: 'rgba(255,159,10,0.4)',
    icon:   <AlertTriangle size={15} style={{ color: '#FF9F0A', flexShrink: 0 }} />,
  },
  info: {
    bg:     'rgba(20,30,45,0.97)',
    border: 'rgba(0,122,255,0.35)',
    icon:   <Info size={15} style={{ color: '#007AFF', flexShrink: 0 }} />,
  },
};

function ToastItem({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const s = TYPE_STYLE[item.type];
  return (
    <div
      className="animate-fade-in"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        maxWidth: 360,
        width: 'max-content',
      }}
    >
      {s.icon}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.4, flex: 1 }}>
        {item.message}
      </span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 2, flexShrink: 0, lineHeight: 0 }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Container — render once in AppShell ──────────────────────────────────────

export function ToastContainer() {
  const { items, dismiss } = useToastStore();

  // Inject spin keyframe if missing
  useEffect(() => {
    if (!document.getElementById('toast-spin-style')) {
      const s = document.createElement('style');
      s.id = 'toast-spin-style';
      s.textContent = '@keyframes toast-slide-in { from { opacity:0; transform:translateY(12px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }';
      document.head.appendChild(s);
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        pointerEvents: 'none',
      }}
    >
      {items.map((item) => (
        <div key={item.id} style={{ pointerEvents: 'auto', animation: 'toast-slide-in 0.22s ease' }}>
          <ToastItem item={item} onDismiss={() => dismiss(item.id)} />
        </div>
      ))}
    </div>
  );
}
