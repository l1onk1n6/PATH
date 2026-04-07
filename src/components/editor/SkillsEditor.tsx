import { Plus, Trash2, Zap, Globe } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import type { Language } from '../../types/resume';

const SKILL_LEVELS = [1, 2, 3, 4, 5];
const LEVEL_LABELS = ['Grundlagen', 'Grundkenntnisse', 'Fortgeschritten', 'Fachkundig', 'Experte'];
const LEVEL_COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF'];

const LANG_LEVELS: Language['level'][] = ['Grundkenntnisse', 'Fortgeschritten', 'Fließend', 'Muttersprache'];

export default function SkillsEditor() {
  const {
    getActiveResume,
    addSkill, updateSkill, removeSkill,
    addLanguage, updateLanguage, removeLanguage,
  } = useResumeStore();
  const resume = getActiveResume();
  if (!resume) return null;

  const { skills, languages } = resume;

  return (
    <div className="animate-fade-in">
      {/* Skills */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>
            <Zap size={10} style={{ display: 'inline', marginRight: 4 }} />
            Fähigkeiten ({skills.length})
          </div>
          <button className="btn-glass btn-primary btn-sm" onClick={() => addSkill(resume.id)}>
            <Plus size={13} /> Hinzufügen
          </button>
        </div>

        {skills.length === 0 && (
          <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            Noch keine Fähigkeiten eingetragen
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {skills.map((skill) => (
            <div key={skill.id} className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  className="input-glass"
                  placeholder="Fähigkeit (z.B. React, Python...)"
                  value={skill.name}
                  onChange={(e) => updateSkill(resume.id, skill.id, { name: e.target.value })}
                  style={{ flex: 2, fontSize: 13, padding: '8px 10px' }}
                />
                <input
                  className="input-glass"
                  placeholder="Kategorie"
                  value={skill.category}
                  onChange={(e) => updateSkill(resume.id, skill.id, { category: e.target.value })}
                  style={{ flex: 1, fontSize: 13, padding: '8px 10px' }}
                />
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {SKILL_LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => updateSkill(resume.id, skill.id, { level: lvl as 1|2|3|4|5 })}
                      title={LEVEL_LABELS[lvl - 1]}
                      style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: skill.level >= lvl ? LEVEL_COLORS[skill.level - 1] : 'rgba(255,255,255,0.15)',
                        border: 'none', cursor: 'pointer', transition: '0.2s',
                        transform: skill.level >= lvl ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', minWidth: 70 }}>
                  {LEVEL_LABELS[skill.level - 1]}
                </span>
                <button
                  className="btn-glass btn-danger btn-icon"
                  onClick={() => removeSkill(resume.id, skill.id)}
                  style={{ padding: 6, flexShrink: 0 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* Languages */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>
            <Globe size={10} style={{ display: 'inline', marginRight: 4 }} />
            Sprachen ({languages.length})
          </div>
          <button className="btn-glass btn-primary btn-sm" onClick={() => addLanguage(resume.id)}>
            <Plus size={13} /> Hinzufügen
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {languages.map((lang) => (
            <div key={lang.id} className="glass-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  className="input-glass"
                  placeholder="Sprache (z.B. Englisch)"
                  value={lang.name}
                  onChange={(e) => updateLanguage(resume.id, lang.id, { name: e.target.value })}
                  style={{ flex: 2, fontSize: 13, padding: '8px 10px' }}
                />
                <select
                  className="input-glass"
                  value={lang.level}
                  onChange={(e) => updateLanguage(resume.id, lang.id, { level: e.target.value as Language['level'] })}
                  style={{ flex: 1, fontSize: 13, padding: '8px 10px' }}
                >
                  {LANG_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
                <button
                  className="btn-glass btn-danger btn-icon"
                  onClick={() => removeLanguage(resume.id, lang.id)}
                  style={{ padding: 6, flexShrink: 0 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {languages.length === 0 && (
            <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Noch keine Sprachen eingetragen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
