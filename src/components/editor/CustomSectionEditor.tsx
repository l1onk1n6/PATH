import { Plus, Trash2, GripVertical, X } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { usePlan } from '../../lib/plan';
import ProGate from '../ui/ProGate';

export default function CustomSectionEditor() {
  const { getActiveResume, addCustomSection, updateCustomSection, removeCustomSection, reorderCustomSections } = useResumeStore();
  const { limits } = usePlan();
  const resume = getActiveResume();
  if (!resume) return null;

  const sections = resume.customSections ?? [];
  const isLocked = limits.customSections === 0;

  const editor = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {sections.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
          Noch keine eigenen Sektionen.<br />
          Klicke auf „Sektion hinzufügen" um loszulegen.
        </div>
      )}

      {sections.map((section, sIdx) => (
        <div key={section.id} className="glass-card" style={{ padding: 16 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span title="Verschieben" style={{ display: 'flex', flexShrink: 0 }}>
              <GripVertical size={16} style={{ opacity: 0.3, cursor: 'grab' }} />
            </span>
            <input
              className="input-glass"
              placeholder="Titel der Sektion…"
              value={section.title} maxLength={100}
              onChange={(e) => updateCustomSection(resume.id, section.id, { title: e.target.value })}
              style={{ flex: 1, fontWeight: 600, fontSize: 14 }}
            />
            <button
              className="btn-glass btn-danger btn-icon"
              onClick={() => { if (confirm(`Sektion "${section.title}" löschen?`)) removeCustomSection(resume.id, section.id); }}
              style={{ padding: 6, flexShrink: 0 }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {section.items.map((item, iIdx) => (
              <div key={iIdx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <textarea
                  className="input-glass"
                  placeholder={`Eintrag ${iIdx + 1}…`}
                  value={item} maxLength={500}
                  rows={2}
                  onChange={(e) => {
                    const newItems = [...section.items];
                    newItems[iIdx] = e.target.value;
                    updateCustomSection(resume.id, section.id, { items: newItems });
                  }}
                  style={{ flex: 1, resize: 'vertical', fontSize: 13 }}
                />
                {section.items.length > 1 && (
                  <button
                    className="btn-glass btn-icon"
                    onClick={() => {
                      const newItems = section.items.filter((_, i) => i !== iIdx);
                      updateCustomSection(resume.id, section.id, { items: newItems });
                    }}
                    style={{ padding: 6, marginTop: 2, flexShrink: 0, opacity: 0.5 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add item */}
          <button
            className="btn-glass btn-sm"
            onClick={() => updateCustomSection(resume.id, section.id, { items: [...section.items, ''] })}
            style={{ marginTop: 8, fontSize: 12 }}
          >
            <Plus size={12} /> Eintrag hinzufügen
          </button>

          {/* Reorder buttons */}
          {sections.length > 1 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
              {sIdx > 0 && (
                <button className="btn-glass btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => reorderCustomSections(resume.id, sIdx, sIdx - 1)}>
                  ↑
                </button>
              )}
              {sIdx < sections.length - 1 && (
                <button className="btn-glass btn-sm" style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => reorderCustomSections(resume.id, sIdx, sIdx + 1)}>
                  ↓
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        className="btn-glass btn-primary"
        onClick={() => addCustomSection(resume.id)}
        style={{ width: '100%' }}
      >
        <Plus size={14} /> Sektion hinzufügen
      </button>
    </div>
  );

  if (isLocked) return <ProGate featureId="sections">{editor}</ProGate>;
  return editor;
}
