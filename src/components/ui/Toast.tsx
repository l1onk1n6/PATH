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
import { useIsMobile } from '../../hooks/useBreakpoint';

// ─── Witty message pool ────────────────────────────────────────────────────────

const POOL: Record<string, string[]> = {
  // ── copy ──
  copied:           ['Kopiert! Ab in die Zwischenablage 📋', 'Erwischt! ✌️ Strg+V und los!', 'Sauber kopiert — du weißt was du tust 🎯'],
  linkCopied:       ['Link kopiert! Ab damit in die Welt 🚀', 'Frischer Link, warm serviert 🍕', 'Bitteschön — dein persönlicher Bewerbungslink 🎉'],

  // ── save ──
  saved:            ['Gespeichert, bevor der Strom weg ist 💾', 'Daten sicher vergraben — niemand findet sie 🐱', 'Alles picobello gesichert ✨'],

  // ── PDF export ──
  pdfExported:      ['PDF frisch aus dem digitalen Ofen 🔥', 'Druckbereit! Die Welt verdient diesen Lebenslauf 🚀', 'Boom — fertig gerendert! 📄', 'Das Recruiting-Team wird beeindruckt sein. Oder auch nicht. Aber gut sieht es aus! 😎'],

  // ── delete ──
  deleted:          ['Puff — weg damit! 💨', 'Ins digitale Nirwana befördert 🌈', 'Gelöscht. Keine Reue. Kein Pardon. 🗑️'],
  personDeleted:    ['Person gelöscht — wer war das nochmal? 🤷', 'Weg damit! Die Stelle ist jetzt vakant 👻', 'Persona non grata. Persona non mehr. 🫥'],
  resumeDeleted:    ['Mappe vernichtet — kein Beweis zurückgelassen 🔥', 'Diese Bewerbung hat das Zeitliche gesegnet 💀', 'Weg ist weg. Neues Leben, neue Mappe! 🗑️'],
  applicationDeleted: ['Bewerbung gecancelt — manchmal ist das die richtige Entscheidung 🙅', 'Aus den Augen, aus dem Sinn 💨', 'Adieu, Stelle! Die Welt hat mehr zu bieten 🌍'],
  versionDeleted:   ['Version in Rente geschickt 🏖️', 'Snapshot gelöscht — die Vergangenheit vergisst du sowieso 😅', 'Weg damit — die aktuelle Version ist sowieso besser 💪'],
  linkDeleted:      ['Link vernichtet — spurlos verschwunden 💨', 'Dieser Link existiert nicht mehr. War er je da? 🤔', 'Link gelöscht — Schrödinger würde nicken 🐱'],

  // ── create ──
  linkCreated:      ['Frischer Link, direkt aus der Produktion 🔗', 'Teile ihn mit Headhuntern, Freunden, dem Hund 🎉', 'Dein Bewerbungslink ist lebendig und hungrig 🧟'],
  personCreated:    ['Neue Person, neues Glück! 🎭', 'Willkommen an Bord, neue Bewerberpersönlichkeit! 🚀', 'Alter Ego aktiviert — auf zur Traumstelle! 🦸'],
  resumeCreated:    ['Neue Mappe angelegt — der erste Schritt zur Traumstelle! 📁', 'Eine Mappe gebaut, der Job wartet schon! 🏆', 'Frisch gepresst: deine neue Bewerbungsmappe ☕'],
  applicationCreated: ['Neue Bewerbung eingetragen — Fingers crossed! 🤞', 'Jagdsaison eröffnet! 🏹', 'Ab in die Pipeline — Erfolg vorprogrammiert 📈'],

  // ── template & design ──
  templateChanged:  ['Neues Design aktiviert! Kleiderordnung eingehalten 👔', 'Stylish. Sehr stylish. 🎨', 'Der HR-Manager wird das sehen und denken: "Klasse!" 💅'],

  // ── rename ──
  renamed:          ['Umbenannt! Der neue Name klingt seriöser 🏷️', 'Name geändert — Rebranding abgeschlossen 🎯', 'Jetzt mit besserem Titel 👑'],

  // ── share link toggle ──
  linkEnabled:      ['Link ist jetzt live — bereit für die große Bühne 🎤', 'Vorhang auf! Dein CV ist öffentlich 🌐', 'Online und stolz darauf 🚀'],
  linkDisabled:     ['Link deaktiviert — niemand schaut jetzt hin 🙈', 'Vorhang zu, Disco vorbei 🎭', 'Privat geschaltet — wie Area 51 🔒'],

  // ── AI ──
  aiGenerated:      ['KI hat getippt wie ein Verrückter 🤖', 'Anschreiben generiert — besser als du erwartet hättest 💌', 'Der Algorithmus hat Gefühle reingeschrieben ✨'],
  aiImproved:       ['Text poliert bis er glänzt ✨', 'Upgraded! Jetzt klingt es nach echtem Profi 🎓', 'KI hat Hand angelegt — Ergebnis: deutlich besser 🔧'],
  aiError:          ['KI hatte heute einen Hänger 🤖💤', 'Der Bot streikt — kurze Pause, dann nochmal 🛠️', 'GPT-Moment. Nochmal versuchen! 🎰'],

  // ── translate ──
  translating:      ['Übersetzer an Bord — gib dem KI einen Moment ✈️', 'Wörter werden in andere Wörter verwandelt ✨', 'Sprachbarriere wird gerade eingerissen 🔨'],
  translated:       ['Übersetzt! Jetzt klingst du wie ein Einheimischer 🌍', 'Fertig übersetzt — hoff mal, es klingt noch gut 😅', 'Lingua franca: gefunden 🗺️'],

  // ── versions ──
  versionSaved:     ['Version eingefroren wie ein Mammut 🦣', 'Snapshot gemacht — die Vergangenheit bleibt bewahrt 📸', 'Checkpoint gesetzt! ☑️ Falls du es vermasselt hast, weißt du wo du zurück kannst'],
  versionRestored:  ['Zurück in der Zeit! Willkommen in Version X ⏰', 'Wiederhergestellt — Rückwärtsgang eingelegt 🔄', 'DeLorean auf 88 mph — Vergangenheit erreicht 🚗⚡'],

  // ── import / export ──
  imported:         ['Daten eingelesen — LinkedIn hat sein Bestes gegeben 🤝', 'Importiert! Wie ein digitaler Umzug 📦', 'Profildaten geklaut — äh, importiert 🕵️'],
  gdprExported:     ['Deine Daten, deine Macht 💪 Download läuft!', 'DSGVO-Export fertig — Orwell wäre stolz 📂', 'Alles raus: deine digitale Seele als JSON-Datei 🧬'],

  // ── auth ──
  signedOut:        ['Tschüss! Bis bald — die Bewerbungen warten 👋', 'Abgemeldet. Verdiente Pause! ☕', 'Logout erfolgreich — der Laptop darf jetzt auch schlafen 😴'],
  passwordResetSent:['E-Mail unterwegs — check deinen Posteingang! 📬', 'Reset-Link abgeschossen 🚀 Landung im Postfach in Kürze', 'Passwort-Rettung ist eingeleitet 🛟'],
  passwordUpdated:  ['Neues Passwort gesetzt — und diesmal aufschreiben! 📝', 'Passwort aktualisiert. "123456" war wirklich keine gute Wahl 😅', 'Sicherer als zuvor — gute Entscheidung! 🔐'],
  emailChanged:     ['E-Mail geändert — Postfach-Wechsel vollzogen ✉️', 'Neue Adresse, gleicher Mensch 📮', 'Update erfolgreich — bitte neue Adresse bestätigen 🔔'],
  emailSent:        ['Nachricht sicher angekommen! ✉️ Wir melden uns bald.', 'Abgeschickt! Die Bits sind unterwegs 📡', 'Gesendet — jetzt heißt es warten wie ein Profi 🕰️'],

  // ── errors ──
  errorGeneric:     ['Hoppla! Da hat was geknirscht 🙈', 'Mist! Bitte nochmal versuchen 🔧', 'Der Server hatte kurz einen schlechten Tag 😬', 'Fehler aufgetaucht — wir machen das schon! 💪'],
  errorNetwork:     ['Netzwerk streikt gerade ✊ Kurz warten und nochmal?', 'Die Verbindung hat sich verabschiedet 🏃', 'Kein Internet? Oder der Server schläft 💤'],
  errorPdf:         ['PDF wollte nicht. Manchmal sind Dateien einfach stur 😤', 'Export fehlgeschlagen — kurze Pause, dann nochmal! 🔄', 'Der PDF-Generator hat heute frei 🏖️'],
  errorLimit:       ['Limit erreicht! Upgrade = mehr Spaß 🚀', 'Da wäre mehr drin — mit Pro 💎', 'Hier endet die Free-Zone. Pro wartet! ⭐'],
  errorRateLimit:   ['Immer mit der Ruhe, Freund! 🐢 Kurze Pause bitte.', 'So schnell? Atemübung, dann nochmal 🧘', 'Du bist schneller als der Server — kurz warten 🏎️'],
  errorAi:          ['KI hatte heute einen Hänger 🤖💤', 'Der Bot streikt — kurze Pause, dann nochmal 🛠️', 'GPT-Moment. Nochmal versuchen! 🎰'],

  // ── info ──
  infoSyncing:      ['Synchronisiere mit der Cloud ☁️', 'Bits werden übertragen ⚡', 'Cloud-Sync läuft — kurz Geduld 🌥️'],
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

const TYPE_STYLE: Record<ToastType, { accent: string; bg: string; icon: React.ReactNode }> = {
  success: {
    accent: '#34C759',
    bg:     'rgba(18,28,18,0.97)',
    icon:   <CheckCircle size={16} style={{ color: '#34C759', flexShrink: 0 }} />,
  },
  error: {
    accent: '#FF3B30',
    bg:     'rgba(30,14,14,0.97)',
    icon:   <AlertCircle size={16} style={{ color: '#FF3B30', flexShrink: 0 }} />,
  },
  warning: {
    accent: '#FF9F0A',
    bg:     'rgba(30,24,10,0.97)',
    icon:   <AlertTriangle size={16} style={{ color: '#FF9F0A', flexShrink: 0 }} />,
  },
  info: {
    accent: '#007AFF',
    bg:     'rgba(10,20,38,0.97)',
    icon:   <Info size={16} style={{ color: '#007AFF', flexShrink: 0 }} />,
  },
};

function ToastItem({ item, onDismiss, mobile }: { item: ToastItem; onDismiss: () => void; mobile?: boolean }) {
  const s = TYPE_STYLE[item.type];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px 12px 0',
        background: s.bg,
        border: `1px solid ${s.accent}33`,
        borderLeft: `4px solid ${s.accent}`,
        borderRadius: mobile ? 14 : 12,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${s.accent}18`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        width: mobile ? '100%' : undefined,
        maxWidth: mobile ? undefined : 380,
        minWidth: mobile ? undefined : 260,
        overflow: 'hidden',
      }}
    >
      {/* Icon area with accent bg strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 40, flexShrink: 0,
      }}>
        {s.icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.4, flex: 1 }}>
        {item.message}
      </span>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: '4px 10px', flexShrink: 0, lineHeight: 0 }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Container — render once in AppShell ──────────────────────────────────────

export function ToastContainer() {
  const { items, dismiss } = useToastStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!document.getElementById('toast-anim-style')) {
      const s = document.createElement('style');
      s.id = 'toast-anim-style';
      s.textContent = `
        @keyframes toast-up   { from { opacity:0; transform:translateY(14px)  scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toast-down { from { opacity:0; transform:translateY(-14px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
      `;
      document.head.appendChild(s);
    }
  }, []);

  if (items.length === 0) return null;

  // Mobile: top of screen, full width, max 2 toasts, slide down
  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', top: 12, left: 12, right: 12,
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        pointerEvents: 'none',
      }}>
        {items.slice(-2).map((item) => (
          <div key={item.id} style={{ pointerEvents: 'auto', animation: 'toast-down 0.24s cubic-bezier(0.34,1.3,0.64,1)' }}>
            <ToastItem item={item} onDismiss={() => dismiss(item.id)} mobile />
          </div>
        ))}
      </div>
    );
  }

  // Desktop: bottom centre, max 4, slide up
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'none',
    }}>
      {items.slice(-4).map((item) => (
        <div key={item.id} style={{ pointerEvents: 'auto', animation: 'toast-up 0.24s cubic-bezier(0.34,1.3,0.64,1)' }}>
          <ToastItem item={item} onDismiss={() => dismiss(item.id)} />
        </div>
      ))}
    </div>
  );
}
