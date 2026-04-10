import { useState, useCallback } from 'react';
import {
  ExternalLink, Pencil, Check, X, Calendar, Link2,
  CheckCircle2, Circle, Bell, Loader2, Sparkles, Mail, AlertCircle, Share2,
} from 'lucide-react';
import ShareLinksPanel from './ShareLinksPanel';
import ProGate from '../ui/ProGate';

function safeUrl(url: string) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function looksLikeUrl(url: string) {
  if (!url) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    return u.hostname.includes('.');
  } catch {
    return false;
  }
}
import { useResumeStore } from '../../store/resumeStore';
import { useAuthStore } from '../../store/authStore';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { usePlan } from '../../lib/plan';
import { useIsMobile } from '../../hooks/useBreakpoint';
import { APPLICATION_STATUS_LABELS } from '../../types/resume';
import type { EditorSection } from '../../types/resume';

const REMINDER_OPTS = [
  { days: 1,  label: '1 Tag' },
  { days: 3,  label: '3 Tage' },
  { days: 7,  label: '7 Tage' },
  { days: 14, label: '2 Wochen' },
];

function ReminderSection({ resumeId, deadline, reminderDays, personEmail }: {
  resumeId: string;
  deadline: string;
  reminderDays: number[];
  personEmail: string;
}) {
  const { updateResume } = useResumeStore();
  const { session } = useAuthStore();
  const { isPro } = usePlan();
  const accountEmail: string = (session?.user?.email as string) ?? '';
  const recipientEmail = personEmail || accountEmail;
  const isUsingFallback = !personEmail && !!accountEmail;
  const [selected, setSelected] = useState<number[]>(reminderDays ?? []);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState('');

  const deadlineDate = deadline ? new Date(deadline) : null;
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86_400_000)
    : null;
  const deadlineColor =
    daysLeft === null ? undefined
    : daysLeft < 0 ? 'var(--ios-red)'
    : daysLeft <= 7 ? '#FF9F0A'
    : 'var(--ios-green)';

  const save = useCallback(async (next: number[]) => {
    updateResume(resumeId, { reminderDays: next });
    if (!isSupabaseConfigured() || !session?.access_token) return;
    setSaving(true); setError('');
    try {
      const resumeName = useResumeStore.getState().resumes.find(r => r.id === resumeId)?.name ?? '';
      const { error: fnErr } = await getSupabase().functions.invoke('upsert-deadline-reminders', {
        body: {
          resume_id: resumeId,
          deadline,
          reminder_days: next,
          resume_name: resumeName,
          recipient_email: recipientEmail || undefined,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (fnErr) setError('Sync fehlgeschlagen.');
      else setSavedAt(Date.now());
    } catch { setError('Sync fehlgeschlagen.'); }
    setSaving(false);
  }, [resumeId, deadline, session, updateResume]);

  function toggle(days: number) {
    const next = selected.includes(days)
      ? selected.filter(d => d !== days)
      : [...selected, days];
    setSelected(next);
    save(next);
  }

  if (!deadline) {
    return (
      <div style={{
        marginTop: 10, padding: '10px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Bell size={13} style={{ opacity: 0.35, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Bewerbungsfrist setzen um Erinnerungen zu aktivieren
        </span>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: 10, padding: '14px 16px', borderRadius: 12,
      background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.18)',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: 'rgba(0,122,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bell size={13} style={{ color: 'var(--ios-blue)' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>E-Mail Erinnerungen</span>
          {!isPro && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
              background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', color: '#fff',
            }}>PRO</span>
          )}
        </div>

        {/* Status feedback */}
        <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
          {saving && <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite', color: 'var(--ios-blue)' }} /> <span style={{ color: 'var(--text-muted)' }}>Speichert…</span></>}
          {!saving && savedAt && !error && <><Check size={11} style={{ color: 'var(--ios-green)' }} /> <span style={{ color: 'var(--ios-green)' }}>Gespeichert</span></>}
          {error && <span style={{ color: 'var(--ios-red)' }}>{error}</span>}
        </div>
      </div>

      {/* Deadline badge */}
      {deadlineDate && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 20, marginBottom: 12,
          background: `color-mix(in srgb, ${deadlineColor} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${deadlineColor} 35%, transparent)`,
          fontSize: 12, color: deadlineColor,
        }}>
          <Calendar size={11} />
          {daysLeft! < 0
            ? 'Frist abgelaufen'
            : daysLeft === 0
            ? 'Frist heute'
            : `Noch ${daysLeft} Tag${daysLeft === 1 ? '' : 'e'}`}
        </div>
      )}

      {/* Pill toggles */}
      {isPro ? (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {REMINDER_OPTS.map(({ days, label }) => {
            const active = selected.includes(days);
            const disabled = daysLeft !== null && days > daysLeft;
            return (
              <button
                key={days}
                onClick={() => !disabled && toggle(days)}
                disabled={disabled}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s',
                  background: active ? 'linear-gradient(135deg, rgba(0,122,255,0.35), rgba(88,86,214,0.3))' : 'rgba(255,255,255,0.07)',
                  border: active ? '1px solid rgba(0,122,255,0.55)' : '1px solid rgba(255,255,255,0.12)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  opacity: disabled ? 0.35 : 1,
                  boxShadow: active ? '0 2px 8px rgba(0,122,255,0.25)' : 'none',
                }}
              >
                {active && <Check size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
                {label} vorher
              </button>
            );
          })}
        </div>
      ) : (
        <ProGate featureId="reminder">
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {REMINDER_OPTS.map(({ days, label }) => (
              <button
                key={days}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-secondary)', cursor: 'default' }}
              >
                {label} vorher
              </button>
            ))}
          </div>
        </ProGate>
      )}

      {/* Email recipient info / warning */}
      {isPro && (
        recipientEmail ? (
          <div style={{
            marginTop: 10, padding: '8px 12px', borderRadius: 8,
            background: isUsingFallback ? 'rgba(255,159,10,0.08)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isUsingFallback ? 'rgba(255,159,10,0.25)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'flex-start', gap: 7,
          }}>
            <Mail size={11} style={{ flexShrink: 0, marginTop: 1, color: isUsingFallback ? '#FF9F0A' : 'var(--text-muted)', opacity: isUsingFallback ? 1 : 0.6 }} />
            <div style={{ fontSize: 11, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Erinnerung wird gesendet an </span>
              <strong style={{ color: 'var(--text-secondary)' }}>{recipientEmail}</strong>
              {isUsingFallback && (
                <div style={{ color: '#FF9F0A', marginTop: 2 }}>
                  Konto-E-Mail wird verwendet — hinterlege eine E-Mail in den persönlichen Daten für diese Person.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px',
            borderRadius: 8, background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)',
            fontSize: 11, color: '#FF3B30',
          }}>
            <AlertCircle size={12} style={{ flexShrink: 0 }} />
            Keine E-Mail-Adresse gefunden. Hinterlege eine Mail in den persönlichen Daten oder am Konto.
          </div>
        )
      )}
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

export default function ResumeOverview() {
  const { getActiveResume, getActivePerson, renameResume, updateResume, setActiveSection } = useResumeStore();
  const resume = getActiveResume();
  const person = getActivePerson();
  const isMobile = useIsMobile();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  if (!resume || !person) return null;

  const info = resume.personalInfo;

  function startRename() {
    setNameValue(resume!.name || '');
    setEditingName(true);
  }
  function commitRename() {
    if (nameValue.trim()) renameResume(resume!.id, nameValue.trim());
    setEditingName(false);
  }

  const sections: { label: string; section: EditorSection; done: boolean; hint: string }[] = [
    {
      label: 'Persönliche Daten',
      section: 'personal',
      done: !!(info.firstName && info.lastName && info.email),
      hint: 'Name & Kontakt',
    },
    {
      label: 'Berufserfahrung',
      section: 'experience',
      done: resume.workExperience.length > 0,
      hint: `${resume.workExperience.length} Einträge`,
    },
    {
      label: 'Ausbildung',
      section: 'education',
      done: resume.education.length > 0,
      hint: `${resume.education.length} Einträge`,
    },
    {
      label: 'Fähigkeiten',
      section: 'skills',
      done: resume.skills.length > 0,
      hint: `${resume.skills.length} Skills`,
    },
    {
      label: 'Motivationsschreiben',
      section: 'cover-letter',
      done: resume.coverLetter.body.length > 50,
      hint: resume.coverLetter.body.length > 0 ? `${resume.coverLetter.body.length} Zeichen` : 'Nicht ausgefüllt',
    },
  ];

  const doneCount = sections.filter(s => s.done).length;
  const percent = Math.round((doneCount / sections.length) * 100);

  return (
    <div className="animate-fade-in">

      {/* ── Header: name + person ───────────────────────────── */}
      <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {editingName ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              className="input-glass"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingName(false); }}
              autoFocus maxLength={80}
              style={{ fontSize: 20, fontWeight: 700, flex: 1, padding: '8px 12px' }}
            />
            <button className="btn-glass btn-sm" onClick={commitRename} style={{ padding: '8px 10px' }}><Check size={14} /></button>
            <button className="btn-glass btn-sm" onClick={() => setEditingName(false)} style={{ padding: '8px 10px' }}><X size={14} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, flex: 1 }}>
              {resume.name || 'Bewerbungsmappe'}
            </h2>
            <button className="btn-glass btn-sm" onClick={startRename} title="Umbenennen"
              style={{ padding: '6px 8px', opacity: 0.55 }}>
              <Pencil size={13} />
            </button>
          </div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          Bewerbungsmappe von {person.name}
        </div>
      </div>

      {/* ── Two-column grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20, marginBottom: 24, alignItems: 'start' }}>

        {/* Left: Status + Job URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="section-label">Status</label>
            <select
              className="input-glass"
              value={resume.status}
              onChange={e => updateResume(resume.id, { status: e.target.value as typeof resume.status })}
              style={{ width: '100%' }}
            >
              {Object.entries(APPLICATION_STATUS_LABELS).map(([v, label]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="section-label">
              <Link2 size={9} style={{ display: 'inline', marginRight: 4 }} />Stellenausschreibung
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-glass"
                type="url"
                placeholder="https://example.com/jobs/..."
                value={resume.jobUrl}
                onChange={e => updateResume(resume.id, { jobUrl: e.target.value })}
                style={{ flex: 1 }}
              />
              {looksLikeUrl(resume.jobUrl) && (
                <a
                  href={safeUrl(resume.jobUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-glass btn-sm"
                  style={{ textDecoration: 'none', color: 'inherit', padding: '0 12px', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
                >
                  <ExternalLink size={13} /> Öffnen
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right: Deadline + Reminders */}
        <div>
          <label className="section-label">
            <Calendar size={9} style={{ display: 'inline', marginRight: 4 }} />Bewerbungsfrist
          </label>
          <input
            className="input-glass"
            type="date"
            value={resume.deadline}
            onChange={e => updateResume(resume.id, { deadline: e.target.value })}
            style={{ width: '100%' }}
          />
          <ReminderSection
            resumeId={resume.id}
            deadline={resume.deadline}
            reminderDays={resume.reminderDays ?? []}
            personEmail={info.email ?? ''}
          />
        </div>
      </div>

      {/* ── Completeness ────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>Vollständigkeit</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: percent === 100 ? 'var(--ios-green)' : 'var(--text-muted)' }}>
            {doneCount}/{sections.length}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 14, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2, transition: 'width 0.4s ease',
            width: `${percent}%`,
            background: percent === 100 ? 'var(--ios-green)' : 'var(--ios-blue)',
          }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
          {sections.map(({ label, section, done, hint }) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                color: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {done
                ? <CheckCircle2 size={15} style={{ color: 'var(--ios-green)', flexShrink: 0 }} />
                : <Circle size={15} style={{ opacity: 0.35, flexShrink: 0 }} />
              }
              <span style={{ flex: 1, fontSize: 13, opacity: done ? 1 : 0.65 }}>{label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Share Links & Analytics */}
      <div className="glass-card" style={{ padding: 16 }}>
        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <Share2 size={11} /> Link-Analytics
        </div>
        <ShareLinksPanel resumeId={resume.id} readOnly />
      </div>
    </div>
  );
}
