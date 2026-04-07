import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Trash2, FileText, Image, ExternalLink } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import type { UploadedDocument } from '../../types/resume';

const CATEGORIES: { value: UploadedDocument['category']; label: string }[] = [
  { value: 'certificate', label: 'Zertifikat' },
  { value: 'reference', label: 'Referenz' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'other', label: 'Sonstiges' },
];

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image size={18} />;
  return <FileText size={18} />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentUpload() {
  const { getActiveResume, addDocument, removeDocument } = useResumeStore();
  const resume = getActiveResume();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!resume) return;
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        addDocument(resume.id, {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: reader.result as string,
          category: 'other',
        });
      };
      reader.readAsDataURL(file);
    });
  }, [resume, addDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (!resume) return null;

  const { documents } = resume;

  function updateCategory(docId: string, category: UploadedDocument['category']) {
    if (!resume) return;
    // Update category directly via store update
    const doc = resume.documents.find(d => d.id === docId);
    if (!doc) return;
    removeDocument(resume.id, docId);
    addDocument(resume.id, { ...doc, category });
  }

  return (
    <div className="animate-fade-in">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
        style={{ marginBottom: 20 }}
      >
        <input {...getInputProps()} />
        <Upload size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: isDragActive ? 1 : 0.5 }} />
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
          {isDragActive ? 'Dateien hier ablegen...' : 'Dokumente hochladen'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Dateien hierher ziehen oder klicken · PDF, Bilder, Word · max. 10 MB
        </div>
      </div>

      {/* Uploaded files */}
      {documents.length === 0 && (
        <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          <File size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>Noch keine Dokumente hochgeladen</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {documents.map((doc) => (
          <div key={doc.id} className="glass-card animate-scale-in" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(0,122,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: 'var(--ios-blue)',
              }}>
                <FileIcon type={doc.type} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {formatBytes(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
                </div>
              </div>

              <select
                className="input-glass"
                value={doc.category}
                onChange={(e) => updateCategory(doc.id, e.target.value as UploadedDocument['category'])}
                style={{ width: 120, fontSize: 12, padding: '6px 8px' }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              <a
                href={doc.dataUrl}
                download={doc.name}
                className="btn-glass btn-sm btn-icon"
                style={{ padding: 7, color: '#fff', display: 'flex', alignItems: 'center' }}
                title="Herunterladen"
              >
                <ExternalLink size={13} />
              </a>

              <button
                className="btn-glass btn-danger btn-icon"
                onClick={() => removeDocument(resume.id, doc.id)}
                style={{ padding: 7 }}
                title="Entfernen"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
