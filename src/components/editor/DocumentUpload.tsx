import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Trash2, FileText, Image, Download, AlertCircle, Loader } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';
import { usePlan } from '../../lib/plan';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabase';
import { uploadDocument, getDocumentSignedUrl, downloadFile } from '../../lib/storage';
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

const MAX_FILE_MB = 3;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export default function DocumentUpload() {
  const { getActiveResume, addDocument, removeDocument, resumes } = useResumeStore();
  const resume = getActiveResume();
  const { limits } = usePlan();
  const [sizeError, setSizeError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Total used across ALL resumes (documents are per-user, not per-resume)
  const totalUsedBytes = resumes.reduce((sum, r) =>
    sum + r.documents.reduce((s, d) => s + d.size, 0), 0);
  const totalLimitBytes = limits.documentsMb * 1024 * 1024;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!resume) return;
    setSizeError('');

    const newBytes = acceptedFiles.reduce((s, f) => s + f.size, 0);
    if (totalUsedBytes + newBytes > totalLimitBytes) {
      const remaining = Math.max(0, totalLimitBytes - totalUsedBytes);
      setSizeError(
        `Speicher voll — noch ${formatBytes(remaining)} von ${limits.documentsMb} MB verfügbar.`
      );
      return;
    }

    setUploading(true);

    // Resolve user ID for Supabase Storage paths
    let uid: string | null = null;
    if (isSupabaseConfigured()) {
      try {
        const { data } = await getSupabase().auth.getUser();
        uid = data.user?.id ?? null;
      } catch { /* offline */ }
    }

    for (const file of acceptedFiles) {
      const docId = crypto.randomUUID();
      let storagePath: string | undefined;
      let dataUrl = '';

      if (uid) {
        const path = await uploadDocument(uid, docId, file);
        if (path) storagePath = path;
      }

      if (!storagePath) {
        // Fallback: base64 encoding (offline / Supabase not configured)
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      addDocument(resume.id, {
        id: docId,
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        storagePath,
        category: 'other',
      });
    }

    setUploading(false);
  }, [resume, addDocument, totalUsedBytes, totalLimitBytes, limits.documentsMb]);

  const onDropRejected = useCallback((rejections: { file: File; errors: { code: string }[] }[]) => {
    const tooBig = rejections.some(r => r.errors.some(e => e.code === 'file-too-large'));
    const wrongType = rejections.some(r => r.errors.some(e => e.code === 'file-invalid-type'));
    if (tooBig) setSizeError(`Datei zu gross — max. ${MAX_FILE_MB} MB pro Datei erlaubt.`);
    else if (wrongType) setSizeError('Nicht unterstütztes Format — nur PDF, JPG, PNG und WebP erlaubt.');
    else setSizeError('Datei konnte nicht hinzugefügt werden.');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: true,
    maxSize: MAX_FILE_BYTES,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
  });

  if (!resume) return null;

  const { documents } = resume;
  const storageFullPct = totalUsedBytes / totalLimitBytes;
  const storageFull = totalUsedBytes >= totalLimitBytes;

  function updateCategory(docId: string, category: UploadedDocument['category']) {
    if (!resume) return;
    const doc = resume.documents.find(d => d.id === docId);
    if (!doc) return;
    removeDocument(resume.id, docId);
    addDocument(resume.id, { ...doc, category });
  }

  async function handleDownload(doc: UploadedDocument) {
    setDownloadingId(doc.id);
    try {
      let url = doc.dataUrl;
      // If we only have a storagePath but no cached URL (fresh upload before reload), fetch a signed URL
      if (!url && doc.storagePath) {
        url = await getDocumentSignedUrl(doc.storagePath) ?? '';
      }
      if (url) await downloadFile(url, doc.name);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Storage bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
          <span>Speicher</span>
          <span style={{ color: storageFullPct >= 1 ? 'var(--ios-red)' : storageFullPct >= 0.8 ? '#FF9F0A' : 'var(--text-muted)' }}>
            {formatBytes(totalUsedBytes)} / {limits.documentsMb} MB
          </span>
        </div>
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, storageFullPct * 100)}%`,
            borderRadius: 2,
            background: storageFullPct >= 1 ? 'var(--ios-red)' : storageFullPct >= 0.8 ? '#FF9F0A' : 'var(--ios-green)',
            transition: 'width 0.3s',
          }} />
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${storageFull || uploading ? 'disabled' : ''}`}
        style={{ marginBottom: 20, opacity: storageFull || uploading ? 0.45 : 1, pointerEvents: storageFull || uploading ? 'none' : undefined }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7, animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Wird hochgeladen…</div>
          </>
        ) : (
          <>
            <Upload size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: isDragActive ? 1 : 0.5 }} />
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>
              {storageFull ? 'Speicher voll' : isDragActive ? 'Dateien hier ablegen...' : 'Dokumente hochladen'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {storageFull
                ? `Limit von ${limits.documentsMb} MB erreicht — Dateien löschen um Platz zu schaffen`
                : `Dateien hierher ziehen oder klicken · PDF, JPG, PNG, WebP · max. ${MAX_FILE_MB} MB`}
            </div>
          </>
        )}
      </div>

      {sizeError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ios-red)', marginBottom: 12 }}>
          <AlertCircle size={13} /> {sizeError}
        </div>
      )}

      {/* Uploaded files */}
      {documents.length === 0 && (
        <div className="glass-card" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
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
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
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

              <button
                className="btn-glass btn-sm btn-icon"
                onClick={() => handleDownload(doc)}
                disabled={downloadingId === doc.id}
                style={{ padding: 7, color: '#fff', display: 'flex', alignItems: 'center' }}
                title="Herunterladen"
              >
                {downloadingId === doc.id
                  ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Download size={13} />}
              </button>

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

      {/* Used MB info across all resumes */}
      {resumes.length > 1 && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          Speicher gilt für alle {resumes.length} Mappen zusammen
        </div>
      )}
    </div>
  );
}
