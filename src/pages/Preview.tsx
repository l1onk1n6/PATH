import { useNavigate } from 'react-router-dom';
import { AlertCircle, Download, ZoomIn, ZoomOut, Loader2, Layers, X, FolderDown, Lock, Share2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useResumeStore } from '../store/resumeStore';
import ProGate from '../components/ui/ProGate';
import ResumePreview from '../components/templates/ResumePreview';
import ShareLinksPanel from '../components/editor/ShareLinksPanel';
import { TEMPLATES } from '../components/templates/templateConfig';
import { TemplateThumbnail } from '../components/templates/TemplateSelector';
import { useIsMobile } from '../hooks/useBreakpoint';
import { usePlan, FREE_TEMPLATE_IDS } from '../lib/plan';
import { canExportPdf, incrementPdfExport, getPdfExportCount } from '../lib/pdfExports';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Resume, UploadedDocument } from '../types/resume';

const CATEGORY_LABELS: Record<UploadedDocument['category'], string> = {
  certificate: 'Zertifikat',
  reference: 'Referenz',
  portfolio: 'Portfolio',
  other: 'Beilage',
};

/** Renders a single attached document inline (PDF or image). */
function DocumentPreviewCard({ doc }: { doc: UploadedDocument }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (doc.type !== 'application/pdf' || !doc.dataUrl) return;
    if (!doc.dataUrl.startsWith('data:')) {
      // HTTPS (Supabase Storage) — use directly
      setPdfUrl(doc.dataUrl);
      return;
    }
    // data: URI — convert to blob URL (Chrome blocks data: URIs in iframes)
    try {
      const bytes = Uint8Array.from(atob(doc.dataUrl.split(',')[1]), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  }, [doc.dataUrl, doc.type]);

  if (!doc.dataUrl) {
    return (
      <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', color: '#aaa', fontSize: 12 }}>
        Vorschau nach Neuladen verfügbar
      </div>
    );
  }
  if (doc.type.startsWith('image/')) {
    return <img src={doc.dataUrl} alt={doc.name} style={{ width: '100%', display: 'block' }} />;
  }
  if (doc.type === 'application/pdf') {
    if (!pdfUrl) return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', color: '#aaa', fontSize: 12 }}>
        Lade Vorschau…
      </div>
    );
    return <iframe src={pdfUrl} style={{ width: '100%', height: 1123, border: 'none', display: 'block' }} title={doc.name} />;
  }
  return (
    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9f9', color: '#aaa', fontSize: 12 }}>
      Keine Vorschau verfügbar
    </div>
  );
}

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

// Renders an HTML element to jsPDF pages, returns the doc
async function renderElementToPdfDoc(
  element: HTMLElement,
  quality = 0.92,
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  await document.fonts.ready;

  // Clone element outside any CSS transforms so html2canvas captures correctly.
  // Wrap in a 794px container so layout is correct and scrollHeight is reliable.
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'absolute', left: '-9999px', top: '0',
    width: '794px', overflow: 'visible', pointerEvents: 'none', zIndex: '-1',
  });
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = '794px';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  // Force layout so scrollHeight is accurate before capture
  void wrapper.offsetHeight;

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(clone, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', width: 794,
      logging: false,
    });
  } finally {
    document.body.removeChild(wrapper);
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();   // 210 mm
  const pdfH = pdf.internal.pageSize.getHeight();  // 297 mm

  // canvas pixels per mm (canvas is 2x scaled)
  const pxPerMm = canvas.width / pdfW;
  const pageHeightPx = pdfH * pxPerMm; // canvas pixels per A4 page

  /**
   * Find the last row containing any non-white pixel.
   * Templates use minHeight: 297mm which leaves trailing white space — without
   * this trim a single-page CV would always generate an extra blank page.
   */
  function findContentHeight(): number {
    const ctx = canvas.getContext('2d')!;
    for (let y = canvas.height - 1; y > 0; y--) {
      const { data } = ctx.getImageData(0, y, canvas.width, 1);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return y + 1;
      }
    }
    return canvas.height;
  }

  /**
   * Scan upward from targetY to find a nearly-blank row (whitespace between
   * paragraphs). Cuts there instead of mid-line. Falls back to targetY if no
   * good break is found within the search window (8% of page height).
   */
  function findBreakPoint(targetY: number, limit: number): number {
    const ctx = canvas.getContext('2d')!;
    const searchPx = Math.round(pageHeightPx * 0.08);
    const start = Math.min(Math.round(targetY), limit - 1);
    for (let y = start; y > start - searchPx; y--) {
      if (y <= 0) break;
      const { data } = ctx.getImageData(0, y, canvas.width, 1);
      let dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) dark++;
      }
      if (dark < canvas.width * 0.03) return y; // >97% white → good break
    }
    return start; // no whitespace found, cut at original boundary
  }

  // Use content height instead of full canvas height to avoid trailing blank pages
  const contentHeight = findContentHeight();

  let srcY = 0;
  let pageCount = 0;

  while (srcY < contentHeight) {
    if (pageCount > 0) pdf.addPage();

    const isLastPage = srcY + pageHeightPx >= contentHeight;
    const breakY = isLastPage
      ? contentHeight
      : findBreakPoint(srcY + pageHeightPx, contentHeight);

    const srcH = Math.round(breakY - srcY);
    if (srcH <= 0) break; // safety guard

    const pg = document.createElement('canvas');
    pg.width = canvas.width;
    pg.height = srcH;
    pg.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

    const imgH = srcH / pxPerMm; // mm height for this chunk
    pdf.addImage(pg.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, pdfW, imgH);

    srcY = Math.round(breakY);
    pageCount++;
  }

  return { pdfBytes: pdf.output('arraybuffer') as unknown as Uint8Array, pageCount };
}

// Merge multiple PDFs (as Uint8Array/ArrayBuffer) using pdf-lib
async function mergePdfs(parts: Uint8Array[]): Promise<Uint8Array> {
  const { PDFDocument } = await import('pdf-lib');
  const merged = await PDFDocument.create();

  for (const part of parts) {
    try {
      const src = await PDFDocument.load(part, { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => merged.addPage(p));
    } catch { /* skip corrupt/encrypted pages */ }
  }

  return merged.save();
}

/**
 * Fetch raw bytes from a data: URI or an HTTPS URL (Supabase Storage).
 * Returns bytes + mime type, or null on failure.
 */
async function fetchBytes(url: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try {
    if (url.startsWith('data:')) {
      const mime = url.split(';')[0].split(':')[1];
      const bytes = Uint8Array.from(atob(url.split(',')[1]), c => c.charCodeAt(0));
      return { bytes, mime };
    }
    // HTTPS (Supabase Storage signed URL or public URL)
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const mime = resp.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream';
    return { bytes: new Uint8Array(await resp.arrayBuffer()), mime };
  } catch { return null; }
}

// Embed an image (data: URI or HTTPS) as a full A4 page in a new PDF
async function imageToPdfBytes(url: string): Promise<Uint8Array | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const fetched = await fetchBytes(url);
    if (!fetched) return null;
    const doc = await PDFDocument.create();
    const isJpeg = fetched.mime.includes('jpeg') || fetched.mime.includes('jpg');
    const img = isJpeg ? await doc.embedJpg(fetched.bytes) : await doc.embedPng(fetched.bytes);
    const a4w = 595.28, a4h = 841.89; // pts
    const scale = Math.min(a4w / img.width, a4h / img.height);
    const w = img.width * scale, h = img.height * scale;
    const page = doc.addPage([a4w, a4h]);
    page.drawImage(img, { x: (a4w - w) / 2, y: (a4h - h) / 2, width: w, height: h });
    return doc.save();
  } catch { return null; }
}

// Adaptive quality: reduce JPEG quality until under MAX_PDF_BYTES
async function exportAdaptive(
  parts: HTMLElement[],
  docDataUrls: { dataUrl: string; type: string }[],
): Promise<Uint8Array> {
  let quality = 0.92;

  for (let attempt = 0; attempt < 4; attempt++) {
    const pdfParts: Uint8Array[] = [];

    for (const el of parts) {
      const { pdfBytes } = await renderElementToPdfDoc(el, quality);
      pdfParts.push(pdfBytes);
    }

    for (const { dataUrl, type } of docDataUrls) {
      if (!dataUrl) continue; // no URL yet (freshly uploaded, not yet synced)
      const isPdf = type === 'application/pdf' || dataUrl.startsWith('data:application/pdf');
      if (isPdf) {
        // Works for both data: URIs and HTTPS (Supabase Storage)
        const fetched = await fetchBytes(dataUrl);
        if (fetched) pdfParts.push(fetched.bytes);
      } else if (type.startsWith('image/') || dataUrl.startsWith('data:image/')) {
        const imgPdf = await imageToPdfBytes(dataUrl);
        if (imgPdf) pdfParts.push(imgPdf);
      }
      // Word/other file types: silently skip (can't render client-side)
    }

    const merged = await mergePdfs(pdfParts);
    if (merged.length <= MAX_PDF_BYTES || quality <= 0.55) return merged;
    quality -= 0.12;
  }

  // Fallback – merge with lowest quality
  const pdfParts: Uint8Array[] = [];
  for (const el of parts) {
    const { pdfBytes } = await renderElementToPdfDoc(el, 0.55);
    pdfParts.push(pdfBytes);
  }
  return mergePdfs(pdfParts);
}

function buildFilename(resume: Resume): string {
  const first = resume.personalInfo.firstName || '';
  const last = resume.personalInfo.lastName || '';
  const name = [first, last].filter(Boolean).join('_') || 'Bewerbung';
  return `${name}_Bewerbungsmappe.pdf`;
}

export default function Preview() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { getActiveResume, setTemplate } = useResumeStore();
  const { limits, isPro } = usePlan();
  const resume = getActiveResume();
  const [zoom, setZoom] = useState(isMobile ? 0.42 : 1.0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [showPasswordSoon, setShowPasswordSoon] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const resumePageRef = useRef<HTMLDivElement>(null);
  const coverLetterRef = useRef<HTMLDivElement>(null);

  if (!resume) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '48px 32px', textAlign: 'center', margin: 'auto' }}>
        <AlertCircle size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Kein Lebenslauf ausgewählt</h3>
        <button className="btn-glass btn-primary" onClick={() => navigate('/')}>Zum Dashboard</button>
      </div>
    );
  }

  // Export CV only
  const handleExport = async () => {
    if (!resumePageRef.current || exporting) return;
    if (!canExportPdf(limits.pdfExportsPerMonth)) {
      setExportError(`PDF-Export-Limit erreicht (${limits.pdfExportsPerMonth}/Monat). Upgrade auf Pro für mehr Exporte.`);
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const { pdfBytes } = await renderElementToPdfDoc(resumePageRef.current);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      const first = resume.personalInfo.firstName || 'Lebenslauf';
      const last = resume.personalInfo.lastName ? '_' + resume.personalInfo.lastName : '';
      a.download = `${first}${last}_CV.pdf`;
      a.click(); URL.revokeObjectURL(url);
      await incrementPdfExport();
    } catch (err) { console.error('PDF export failed:', err); }
    finally { setExporting(false); }
  };

  // Export full Bewerbungsmappe: cover letter + resume + documents
  const handleExportMappe = async () => {
    if (exporting) return;
    if (!canExportPdf(limits.pdfExportsPerMonth)) {
      setExportError(`PDF-Export-Limit erreicht (${limits.pdfExportsPerMonth}/Monat). Upgrade auf Pro für mehr Exporte.`);
      return;
    }
    setExporting(true);
    setExportError(null);
    try {
      const elements: HTMLElement[] = [];

      // 1. Cover letter (if content exists)
      if (hasContent && coverLetterRef.current) {
        elements.push(coverLetterRef.current);
      }

      // 2. Resume (always)
      const resumeEl = resumePageRef.current;
      if (resumeEl) elements.push(resumeEl);

      const docs = (resume.documents ?? []).map(d => ({ dataUrl: d.dataUrl, type: d.type }));
      const merged = await exportAdaptive(elements, docs);

      const blob = new Blob([merged.buffer as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = buildFilename(resume);
      a.click(); URL.revokeObjectURL(url);
      await incrementPdfExport();
    } catch (err) { console.error('Mappe export failed:', err); }
    finally { setExporting(false); }
  };

  const cl = resume.coverLetter ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' };
  const pi = resume.personalInfo;
  const senderName = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
  const hasContent = !!(cl?.body || cl?.subject || cl?.recipient);

  const PageSeparator = ({ label }: { label: string }) => (
    <div data-html2canvas-ignore="true" style={{
      padding: '5px 12px', background: 'rgba(0,0,0,0.35)',
      fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'sans-serif',
      letterSpacing: '0.04em', textAlign: 'center',
    }}>
      {label}
    </div>
  );

  const clAccent = resume.accentColor || '#333';
  const clDate = (pi.location ? pi.location + ', ' : '') +
    new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Cover letter: one unique design per template ─────────

  const sansFontFace = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
  const serifFontFace = 'Georgia, "Times New Roman", serif';
  const monoFontFace = '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace';
  const tid = resume.templateId;

  const PageBreakHint = () => (
    <div data-html2canvas-ignore="true" style={{
      position: 'absolute', top: 1123, left: 0, right: 0, pointerEvents: 'none',
      borderTop: '1.5px dashed rgba(180,180,220,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 9, color: 'rgba(100,100,180,0.7)', background: 'inherit', padding: '0 8px', letterSpacing: '0.05em', fontFamily: 'sans-serif' }}>— Seite 2 —</span>
    </div>
  );

  // Shared letter body: recipient → date → subject → body → closing
  const CLBody = ({
    subjectStyle, dateStyle, recipientStyle, bodyColor,
  }: {
    subjectStyle?: React.CSSProperties;
    dateStyle?: React.CSSProperties;
    recipientStyle?: React.CSSProperties;
    bodyColor?: string;
  }) => (
    <>
      {cl.recipient && (
        <div style={{ marginBottom: 32, whiteSpace: 'pre-line', fontSize: 13, ...recipientStyle }}>
          {cl.recipient}
        </div>
      )}
      <div style={{ textAlign: 'right', marginBottom: 28, color: '#777', fontSize: 12, ...dateStyle }}>{clDate}</div>
      {cl.subject && (
        <div style={{ fontWeight: 700, marginBottom: 24, fontSize: 14, ...subjectStyle }}>
          {cl.subject}
        </div>
      )}
      <div style={{ whiteSpace: 'pre-wrap', marginBottom: 40, color: bodyColor }}>
        {cl.body || <span style={{ opacity: 0.35 }}>Kein Anschreiben-Text vorhanden.</span>}
      </div>
      <div>
        <div style={{ marginBottom: 48, whiteSpace: 'pre-wrap' }}>{cl.closing || 'Mit freundlichen Grüssen'}</div>
        {senderName && <div style={{ fontWeight: 700 }}>{senderName}</div>}
      </div>
    </>
  );

  const CoverLetterPage = () => {
    const W: React.CSSProperties = { width: 794, minHeight: 1123, background: '#fff', color: '#222', fontFamily: sansFontFace, fontSize: 13, lineHeight: 1.75, boxSizing: 'border-box', position: 'relative' };
    const serif: React.CSSProperties = { fontFamily: serifFontFace };
    const pad = '44px 80px 60px';

    // ── 1. minimal ────────────────────────────────────────────
    // Ultra-clean: text-only header, short accent rule, uppercase subject
    if (tid === 'minimal') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ padding: '60px 80px 60px' }}>
          <div style={{ marginBottom: 10 }}>
            {senderName && <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.2px' }}>{senderName}</div>}
            {pi.title && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{pi.title}</div>}
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              {[pi.email, pi.phone, pi.location].filter(Boolean).join(' · ')}
            </div>
          </div>
          <div style={{ width: 36, height: 2, background: clAccent, marginBottom: 44 }} />
          <CLBody
            subjectStyle={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11, fontWeight: 700, color: clAccent, display: 'block' }}
            dateStyle={{ color: '#aaa' }}
          />
        </div>
      </div>
    );

    // ── 2. executive ──────────────────────────────────────────
    // Dark navy left sidebar with sender info, white right content
    if (tid === 'executive') return (
      <div style={{ ...W, display: 'flex', ...serif }}>
        <PageBreakHint />
        <div style={{ width: 220, background: '#1a1a2e', flexShrink: 0, padding: '52px 28px 60px', display: 'flex', flexDirection: 'column' }}>
          {senderName && <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3 }}>{senderName}</div>}
          {pi.title && <div style={{ color: `${clAccent}cc`, fontSize: 11, marginBottom: 16, fontStyle: 'italic' }}>{pi.title}</div>}
          <div style={{ height: 2, background: clAccent, marginBottom: 16, width: 32 }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>
            {pi.street && <div>{pi.street}</div>}
            {pi.location && <div>{pi.location}</div>}
            {pi.email && <div style={{ wordBreak: 'break-all' }}>{pi.email}</div>}
            {pi.phone && <div>{pi.phone}</div>}
          </div>
        </div>
        <div style={{ flex: 1, padding: pad }}>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 700, borderLeft: `3px solid ${clAccent}`, paddingLeft: 10 }} />
        </div>
      </div>
    );

    // ── 3. creative ───────────────────────────────────────────
    // Full diagonal gradient header, large bold name, vibrant
    if (tid === 'creative') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ background: `linear-gradient(135deg, ${clAccent} 0%, ${clAccent}aa 100%)`, padding: '40px 80px 36px' }}>
          {senderName && <div style={{ color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', marginBottom: 10 }}>{senderName}</div>}
          <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'rgba(255,255,255,0.85)', flexWrap: 'wrap' }}>
            {pi.title && <span>{pi.title}</span>}
            {[pi.street, pi.location].filter(Boolean).join(', ') && <span>{[pi.street, pi.location].filter(Boolean).join(', ')}</span>}
            {pi.email && <span>{pi.email}</span>}
            {pi.phone && <span>{pi.phone}</span>}
          </div>
        </div>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${clAccent}, transparent)` }} />
        <div style={{ padding: pad }}>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 700, fontSize: 15 }} />
        </div>
      </div>
    );

    // ── 4. nordic ─────────────────────────────────────────────
    // Pastel-tinted top strip, airy Scandinavian minimal
    if (tid === 'nordic') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ background: `${clAccent}14`, padding: '32px 80px', borderBottom: `1px solid ${clAccent}28` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {senderName && <div style={{ fontWeight: 600, fontSize: 18, color: '#111', letterSpacing: '-0.2px' }}>{senderName}</div>}
              {pi.title && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{pi.title}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#999', lineHeight: 1.7 }}>
              {pi.street && <div>{pi.street}</div>}
              {pi.location && <div>{pi.location}</div>}
              {pi.email && <div>{pi.email}</div>}
              {pi.phone && <div>{pi.phone}</div>}
            </div>
          </div>
        </div>
        <div style={{ padding: pad }}>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 600, fontSize: 14 }} />
        </div>
      </div>
    );

    // ── 5. corporate ──────────────────────────────────────────
    // Formal serif: black + accent double-rule, right-aligned sender block
    if (tid === 'corporate') return (
      <div style={{ ...W, ...serif }}>
        <PageBreakHint />
        <div style={{ height: 2, background: '#111' }} />
        <div style={{ height: 5, background: clAccent }} />
        <div style={{ padding: '52px 80px 60px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 36, paddingBottom: 20, borderBottom: '1px solid #ddd' }}>
            <div style={{ textAlign: 'right', fontSize: 12, color: '#555', lineHeight: 1.65 }}>
              {senderName && <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 2 }}>{senderName}</div>}
              {pi.title && <div style={{ fontStyle: 'italic' }}>{pi.title}</div>}
              {pi.street && <div>{pi.street}</div>}
              {pi.location && <div>{pi.location}</div>}
              {pi.email && <div>{pi.email}</div>}
              {pi.phone && <div>{pi.phone}</div>}
            </div>
          </div>
          <CLBody subjectStyle={{ borderLeft: `3px solid ${clAccent}`, paddingLeft: 10 }} />
        </div>
      </div>
    );

    // ── 6. tech ───────────────────────────────────────────────
    // GitHub-dark header #0d1117, monospace name, 2px accent underline
    if (tid === 'tech') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ background: '#0d1117', padding: '28px 80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {senderName && <div style={{ color: clAccent, fontWeight: 700, fontSize: 16, fontFamily: monoFontFace, letterSpacing: '0.04em' }}>{senderName}</div>}
              {pi.title && <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 4, fontFamily: monoFontFace }}>{pi.title}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.8, fontFamily: monoFontFace }}>
              {pi.location && <div>{pi.location}</div>}
              {pi.email && <div>{pi.email}</div>}
              {pi.phone && <div>{pi.phone}</div>}
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: clAccent }} />
        <div style={{ padding: pad }}>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 700, fontFamily: monoFontFace, borderBottom: `1px solid ${clAccent}33`, paddingBottom: 8, display: 'block' }} />
        </div>
      </div>
    );

    // ── 7. elegant ────────────────────────────────────────────
    // Cream bg, right-border sender block, ornamental ··· divider
    if (tid === 'elegant') return (
      <div style={{ ...W, background: '#fdfcf9', ...serif }}>
        <PageBreakHint />
        <div style={{ height: 1, background: clAccent, opacity: 0.6 }} />
        <div style={{ padding: '52px 80px 60px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
            <div style={{ textAlign: 'right', paddingRight: 16, borderRight: `2px solid ${clAccent}`, fontSize: 12, color: '#666', lineHeight: 1.7 }}>
              {senderName && <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.04em', color: '#111', marginBottom: 3 }}>{senderName}</div>}
              {pi.title && <div style={{ fontStyle: 'italic', color: '#888' }}>{pi.title}</div>}
              {pi.street && <div>{pi.street}</div>}
              {pi.location && <div>{pi.location}</div>}
              {pi.email && <div>{pi.email}</div>}
              {pi.phone && <div>{pi.phone}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 32, color: clAccent, fontSize: 16, letterSpacing: 8, opacity: 0.65 }}>· · ·</div>
          <CLBody subjectStyle={{ fontStyle: 'italic', fontSize: 15, color: clAccent }} />
        </div>
      </div>
    );

    // ── 8. bold ───────────────────────────────────────────────
    // Full black page, white text, accent top stripe, uppercase headers
    if (tid === 'bold') return (
      <div style={{ ...W, background: '#000', color: '#fff' }}>
        <PageBreakHint />
        <div style={{ height: 6, background: clAccent }} />
        <div style={{ padding: '52px 80px 60px' }}>
          <div style={{ marginBottom: 36, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
            {senderName && <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-0.3px', marginBottom: 4 }}>{senderName}</div>}
            <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'rgba(255,255,255,0.45)', flexWrap: 'wrap' }}>
              {pi.title && <span>{pi.title}</span>}
              {pi.location && <span>{pi.location}</span>}
              {pi.email && <span>{pi.email}</span>}
              {pi.phone && <span>{pi.phone}</span>}
            </div>
          </div>
          <CLBody
            subjectStyle={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 900, fontSize: 12, color: clAccent, display: 'block', marginBottom: 28 }}
            dateStyle={{ color: 'rgba(255,255,255,0.35)' }}
            recipientStyle={{ color: 'rgba(255,255,255,0.7)' }}
            bodyColor='rgba(255,255,255,0.85)'
          />
        </div>
      </div>
    );

    // ── 9. academic ───────────────────────────────────────────
    // Times New Roman, centered name between two horizontal rules
    if (tid === 'academic') return (
      <div style={{ ...W, fontFamily: '"Times New Roman", Georgia, serif' }}>
        <PageBreakHint />
        <div style={{ padding: '52px 80px 60px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ height: 1, background: '#999', marginBottom: 18 }} />
            {senderName && <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.05em', color: '#111', marginBottom: 5 }}>{senderName}</div>}
            {pi.title && <div style={{ fontSize: 12, color: '#777', fontStyle: 'italic', marginBottom: 6 }}>{pi.title}</div>}
            <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.03em' }}>
              {[pi.email, pi.phone, pi.location].filter(Boolean).join('  ·  ')}
            </div>
            <div style={{ height: 1, background: '#999', marginTop: 18 }} />
          </div>
          <CLBody subjectStyle={{ fontStyle: 'italic', fontSize: 14, color: clAccent, borderBottom: '1px solid #ddd', paddingBottom: 10, display: 'block' }} />
        </div>
      </div>
    );

    // ── 10. startup ───────────────────────────────────────────
    // Gradient top bar (accent → lighter), rounded contact pills, arrow subject
    if (tid === 'startup') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ background: `linear-gradient(135deg, ${clAccent}, ${clAccent}cc)`, padding: '28px 80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {senderName && <div style={{ color: '#fff', fontWeight: 700, fontSize: 19, letterSpacing: '-0.3px' }}>{senderName}</div>}
              {pi.title && <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>{pi.title}</div>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', maxWidth: 260 }}>
              {[pi.location, pi.email, pi.phone].filter(Boolean).map((v, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#fff' }}>{v}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: pad }}>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 700 }} />
        </div>
      </div>
    );

    // ── 11. modern ────────────────────────────────────────────
    // Dark #1a1a2e sidebar (33%), vertical bar section accents
    if (tid === 'modern') return (
      <div style={{ ...W, display: 'flex' }}>
        <PageBreakHint />
        <div style={{ width: 260, background: '#1a1a2e', flexShrink: 0, padding: '52px 28px 60px' }}>
          {senderName && <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 6, lineHeight: 1.3, letterSpacing: '0.02em' }}>{senderName}</div>}
          {pi.title && <div style={{ color: `${clAccent}bb`, fontSize: 11, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{pi.title}</div>}
          <div style={{ width: 3, height: 20, background: clAccent, marginBottom: 16 }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.9 }}>
            {pi.street && <div>{pi.street}</div>}
            {pi.location && <div>{pi.location}</div>}
            {pi.email && <div style={{ wordBreak: 'break-all' }}>{pi.email}</div>}
            {pi.phone && <div>{pi.phone}</div>}
          </div>
        </div>
        <div style={{ flex: 1, padding: pad }}>
          <CLBody subjectStyle={{ borderLeft: `3px solid ${clAccent}`, paddingLeft: 12, color: '#1a1a2e', fontWeight: 700 }} />
        </div>
      </div>
    );

    // ── 12. vibrant ───────────────────────────────────────────
    // Diagonal clip-path accent header, badge-style contact row
    if (tid === 'vibrant') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ background: clAccent, clipPath: 'polygon(0 0, 100% 0, 100% 75%, 0 100%)', padding: '36px 80px 56px' }}>
          {senderName && <div style={{ color: '#fff', fontWeight: 800, fontSize: 24, letterSpacing: '-0.4px', marginBottom: 10 }}>{senderName}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[pi.title, pi.location, pi.email, pi.phone].filter(Boolean).map((v, i) => (
              <span key={i} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '3px 10px', fontSize: 11, color: '#fff' }}>{v}</span>
            ))}
          </div>
        </div>
        <div style={{ padding: '8px 80px 60px' }}>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 700, fontSize: 14 }} />
        </div>
      </div>
    );

    // ── 13. vintage ───────────────────────────────────────────
    // Cream/tan bg #faf7f2, ornamental ✦ symbols, double borders
    if (tid === 'vintage') return (
      <div style={{ ...W, background: '#faf7f2', fontFamily: 'Georgia, "Palatino Linotype", serif' }}>
        <PageBreakHint />
        <div style={{ borderTop: `3px double #bbb`, borderBottom: `3px double #bbb`, padding: '20px 80px', textAlign: 'center', margin: '36px 40px 0' }}>
          {senderName && <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.08em', color: '#333', marginBottom: 4 }}>
            <span style={{ color: clAccent, marginRight: 10 }}>✦</span>{senderName}<span style={{ color: clAccent, marginLeft: 10 }}>✦</span>
          </div>}
          {pi.title && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#888', marginBottom: 6 }}>{pi.title}</div>}
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '0.04em' }}>
            {[pi.email, pi.phone, pi.location].filter(Boolean).join('   ·   ')}
          </div>
        </div>
        <div style={{ padding: '36px 80px 60px' }}>
          <CLBody subjectStyle={{ fontStyle: 'italic', fontSize: 14, color: clAccent }} dateStyle={{ color: '#999' }} />
        </div>
      </div>
    );

    // ── 14. magazine ──────────────────────────────────────────
    // Split header: dark #1a1a1a left + accent right, bold typography
    if (tid === 'magazine') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ display: 'flex', height: 116 }}>
          <div style={{ flex: 1.4, background: '#1a1a1a', padding: '24px 40px 24px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {senderName && <div style={{ color: '#fff', fontWeight: 900, fontSize: 19, letterSpacing: '-0.3px', lineHeight: 1.15 }}>{senderName}</div>}
            {pi.title && <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 10, marginTop: 5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{pi.title}</div>}
          </div>
          <div style={{ flex: 1, background: clAccent, padding: '24px 80px 24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, textAlign: 'right' }}>
              {pi.street && <div>{pi.street}</div>}
              {pi.location && <div>{pi.location}</div>}
              {pi.email && <div>{pi.email}</div>}
              {pi.phone && <div>{pi.phone}</div>}
            </div>
          </div>
        </div>
        <div style={{ padding: pad }}>
          <CLBody subjectStyle={{ fontWeight: 900, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1a1a1a', borderBottom: `3px solid ${clAccent}`, paddingBottom: 8, display: 'block' }} />
        </div>
      </div>
    );

    // ── 15. timeline ──────────────────────────────────────────
    // Vertical accent line on left, timeline dot at date marker
    if (tid === 'timeline') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ padding: '52px 80px 60px', paddingLeft: 110, position: 'relative' }}>
          {/* Vertical timeline line */}
          <div style={{ position: 'absolute', left: 72, top: 0, bottom: 0, width: 2, background: `${clAccent}30` }} />
          {/* Sender block */}
          <div style={{ position: 'relative', marginBottom: 36, paddingBottom: 24, borderBottom: `1px solid #eee` }}>
            <div style={{ position: 'absolute', left: -46, top: 4, width: 12, height: 12, borderRadius: '50%', background: clAccent, border: '3px solid #fff', boxShadow: `0 0 0 2px ${clAccent}` }} />
            {senderName && <div style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 3 }}>{senderName}</div>}
            {pi.title && <div style={{ fontSize: 12, color: '#888' }}>{pi.title}</div>}
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
              {[pi.street, pi.location, pi.email, pi.phone].filter(Boolean).join(' · ')}
            </div>
          </div>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 600 }} dateStyle={{ color: '#999' }} />
        </div>
      </div>
    );

    // ── 16. compact ───────────────────────────────────────────
    // Arial Narrow condensed, dense inline header, tight spacing
    if (tid === 'compact') return (
      <div style={{ ...W, fontFamily: '"Arial Narrow", "Arial", sans-serif', fontSize: 12, lineHeight: 1.6 }}>
        <PageBreakHint />
        <div style={{ borderBottom: `2px solid ${clAccent}`, padding: '14px 80px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              {senderName && <span style={{ fontWeight: 700, fontSize: 15 }}>{senderName}</span>}
              {pi.title && <span style={{ fontSize: 11, color: '#777', marginLeft: 10 }}>{pi.title}</span>}
            </div>
            <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>
              {[pi.email, pi.phone, pi.location].filter(Boolean).join(' | ')}
            </div>
          </div>
        </div>
        <div style={{ padding: '28px 80px 48px' }}>
          <CLBody
            subjectStyle={{ fontWeight: 700, color: clAccent, borderBottom: `1px solid ${clAccent}44`, paddingBottom: 4, display: 'block', marginBottom: 16 }}
            dateStyle={{ color: '#aaa' }}
          />
        </div>
      </div>
    );

    // ── 17. pastel ────────────────────────────────────────────
    // Soft #fdfcff bg, rounded-corner boxes, circle decorators
    if (tid === 'pastel') return (
      <div style={{ ...W, background: '#fdfcff' }}>
        <PageBreakHint />
        <div style={{ background: `${clAccent}14`, borderRadius: '0 0 20px 20px', padding: '32px 80px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {senderName && <div style={{ fontWeight: 700, fontSize: 18, color: '#111', marginBottom: 4 }}>{senderName}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[pi.title, pi.location].filter(Boolean).map((v, i) => (
                  <span key={i} style={{ fontSize: 11, color: '#888', background: `${clAccent}20`, borderRadius: 20, padding: '2px 10px' }}>{v}</span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#aaa', lineHeight: 1.8 }}>
              {pi.email && <div>{pi.email}</div>}
              {pi.phone && <div>{pi.phone}</div>}
            </div>
          </div>
        </div>
        <div style={{ padding: pad }}>
          <CLBody
            subjectStyle={{ background: `${clAccent}14`, padding: '8px 16px', borderRadius: 10, display: 'block', fontWeight: 600, color: clAccent, marginBottom: 24 }}
            dateStyle={{ color: '#bbb' }}
          />
        </div>
      </div>
    );

    // ── 18. geometric ─────────────────────────────────────────
    // Accent header with ghost rotated square, diamond pointer divider
    if (tid === 'geometric') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ background: clAccent, padding: '32px 80px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 40, top: -30, width: 140, height: 140, background: 'rgba(255,255,255,0.07)', transform: 'rotate(45deg)', borderRadius: 10 }} />
          <div style={{ position: 'absolute', right: 100, top: 10, width: 70, height: 70, background: 'rgba(255,255,255,0.05)', transform: 'rotate(30deg)', borderRadius: 6 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
            <div>
              {senderName && <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: '-0.3px' }}>{senderName}</div>}
              {pi.title && <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 11, marginTop: 5 }}>{pi.title}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
              {pi.street && <div>{pi.street}</div>}
              {pi.location && <div>{pi.location}</div>}
              {pi.email && <div>{pi.email}</div>}
              {pi.phone && <div>{pi.phone}</div>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -10, marginBottom: 20 }}>
          <div style={{ width: 20, height: 20, background: clAccent, transform: 'rotate(45deg)' }} />
        </div>
        <div style={{ padding: '0 80px 60px' }}>
          <CLBody subjectStyle={{ background: `${clAccent}12`, padding: '8px 14px', borderRadius: 4, display: 'block', fontWeight: 600 }} />
        </div>
      </div>
    );

    // ── 19. freelancer ────────────────────────────────────────
    // Dark #0f0f0f header, neon accent, vertical separator lines
    if (tid === 'freelancer') return (
      <div style={W}>
        <PageBreakHint />
        <div style={{ background: '#0f0f0f', padding: '32px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <div style={{ flex: 1, paddingRight: 24, borderRight: `1px solid rgba(255,255,255,0.1)` }}>
              {senderName && <div style={{ color: clAccent, fontWeight: 700, fontSize: 17, letterSpacing: '0.02em' }}>{senderName}</div>}
              {pi.title && <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, marginTop: 4 }}>{pi.title}</div>}
            </div>
            <div style={{ display: 'flex', gap: 0, marginLeft: 0 }}>
              {[pi.location, pi.email, pi.phone].filter(Boolean).map((v, i) => (
                <div key={i} style={{ paddingLeft: 24, paddingRight: 24, borderRight: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none', fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.5 }}>{v}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${clAccent}, transparent)` }} />
        <div style={{ padding: pad }}>
          <CLBody subjectStyle={{ color: clAccent, fontWeight: 700, borderBottom: `1px solid ${clAccent}33`, paddingBottom: 8, display: 'block' }} />
        </div>
      </div>
    );

    // ── 20. international ─────────────────────────────────────
    // Georgia serif, light gradient header, symbol contact decorators
    return (
      <div style={{ ...W, ...serif }}>
        <PageBreakHint />
        <div style={{ background: `linear-gradient(to right, ${clAccent}18, transparent)`, padding: '36px 80px 24px', borderBottom: `2px solid ${clAccent}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              {senderName && <div style={{ fontWeight: 700, fontSize: 20, color: '#111', marginBottom: 4 }}>{senderName}</div>}
              {pi.title && <div style={{ fontSize: 12, fontStyle: 'italic', color: '#777' }}>{pi.title}</div>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#777', lineHeight: 1.9 }}>
              {pi.street && <div>⌂ {pi.street}</div>}
              {pi.location && <div>  {pi.location}</div>}
              {pi.email && <div>✉ {pi.email}</div>}
              {pi.phone && <div>✆ {pi.phone}</div>}
            </div>
          </div>
        </div>
        <div style={{ padding: pad }}>
          <CLBody subjectStyle={{ borderLeft: `3px solid ${clAccent}`, paddingLeft: 10, fontWeight: 700 }} />
        </div>
      </div>
    );
  };

  const TemplatePicker = () => (
    <>
      {TEMPLATES.map((tmpl) => {
        const isSelected = resume.templateId === tmpl.id;
        const isFreeTemplate = (FREE_TEMPLATE_IDS as readonly string[]).includes(tmpl.id);
        const locked = !isPro && !isFreeTemplate;

        const card = (
          <div
            className="glass-card"
            style={{ padding: 10, border: isSelected ? `2px solid ${resume.accentColor}` : '1px solid rgba(255,255,255,0.12)', opacity: locked ? 0.55 : 1, position: 'relative' }}
          >
            <div style={{ height: 50, borderRadius: 6, marginBottom: 6, overflow: 'hidden' }}>
              <TemplateThumbnail id={tmpl.id} preview={tmpl.preview} accent={resume.accentColor} />
            </div>
            <div style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
              {tmpl.name}
              {locked && <span style={{ fontSize: 8, fontWeight: 800, padding: '1px 4px', borderRadius: 3, background: 'linear-gradient(135deg, #FF9F0A, #FF375F)', color: '#fff' }}>PRO</span>}
            </div>
          </div>
        );

        if (locked) {
          return (
            <ProGate key={tmpl.id} featureId="templates">
              {card}
            </ProGate>
          );
        }

        return (
          <button
            key={tmpl.id}
            onClick={() => { setTemplate(resume.id, tmpl.id); if (isMobile) setTemplatePickerOpen(false); }}
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 6 }}
          >
            {card}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: 16, height: '100%', overflow: 'hidden', position: 'relative' }}>
      {/* ── Desktop: template sidebar ── */}
      {!isMobile && (
        <aside style={{ width: 160, flexShrink: 0, overflow: 'auto' }}>
          <div className="section-label" style={{ marginBottom: 8 }}>Templates</div>
          <TemplatePicker />
        </aside>
      )}

      {/* ── Preview area ── */}
      <div
        className="glass"
        style={{ flex: 1, borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '8px 12px' : '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Mobile: template picker toggle */}
            {isMobile && (
              <button
                className="btn-glass btn-sm btn-icon"
                onClick={() => setTemplatePickerOpen(true)}
                style={{ padding: 7 }}
                title="Templates"
              >
                <Layers size={14} />
              </button>
            )}
            <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.max(0.25, zoom - 0.1))} style={{ padding: 7 }}>
              <ZoomOut size={13} />
            </button>
            <span style={{ fontSize: 11, minWidth: 36, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="btn-glass btn-sm btn-icon" onClick={() => setZoom(Math.min(1.2, zoom + 0.1))} style={{ padding: 7 }}>
              <ZoomIn size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!isMobile && limits.pdfExportsPerMonth !== Infinity && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                {getPdfExportCount()}/{limits.pdfExportsPerMonth} PDF
              </span>
            )}
            <button
              className="btn-glass btn-sm"
              onClick={handleExport}
              disabled={exporting}
              title="Nur Lebenslauf exportieren"
              style={{ opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {exporting
                ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                : <Download size={13} />
              }
              {!isMobile && ' PDF'}
            </button>
            <ProGate featureId="password" badge>
              <button className="btn-glass btn-sm" onClick={() => setShowPasswordSoon(true)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Lock size={13} />{!isMobile && ' Passwort'}
              </button>
            </ProGate>
            {isSupabaseConfigured() && (
              <button
                className="btn-glass btn-sm"
                onClick={() => setShowSharePanel(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: showSharePanel ? 'rgba(0,122,255,0.2)' : undefined }}
              >
                <Share2 size={13} />{!isMobile && ' Teilen'}
              </button>
            )}

            {showPasswordSoon && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
                onClick={() => setShowPasswordSoon(false)}>
                <div className="glass-card animate-scale-in" style={{ padding: '24px 28px', maxWidth: 320, textAlign: 'center', background: 'var(--modal-bg)' }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>PDF-Passwortschutz — bald verfügbar</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.55 }}>
                    Schütze dein PDF mit einem Passwort, bevor du es versendest. Dieses Feature ist in Entwicklung.
                  </div>
                  <button className="btn-glass btn-primary btn-sm" onClick={() => setShowPasswordSoon(false)}>Schliessen</button>
                </div>
              </div>
            )}
            <button
              className="btn-glass btn-primary btn-sm"
              onClick={handleExportMappe}
              disabled={exporting}
              title="Ganze Bewerbungsmappe exportieren (Anschreiben + CV + Dokumente)"
              style={{ opacity: exporting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 5 }}
            >
              {exporting
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />{!isMobile && ' Exportiere…'}</>
                : <><FolderDown size={13} />{!isMobile && ' Ganze Mappe'}</>
              }
            </button>
          </div>
        </div>

        {/* Preview scroll area */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? 12 : 24, background: '#555' }}>
          <div style={{
            width: 794,
            margin: '0 auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            transformOrigin: 'top center',
            transform: `scale(${zoom})`,
            marginBottom: `calc((${zoom} - 1) * -100%)`,
          }}>
            {/* 1. Cover letter — always visible if content exists */}
            {hasContent && (
              <>
                <div ref={coverLetterRef}>
                  <CoverLetterPage />
                </div>
                <PageSeparator label="Lebenslauf" />
              </>
            )}

            {/* 2. CV — always visible */}
            <div ref={resumePageRef}>
              <ResumePreview resume={resume} />
            </div>

            {/* 3. Attached documents */}
            {resume.documents.map((doc) => (
              <div key={doc.id} data-html2canvas-ignore="true">
                <PageSeparator label={`${doc.name} · ${CATEGORY_LABELS[doc.category]}`} />
                <div style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                  <DocumentPreviewCard doc={doc} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile: template picker modal ── */}
      {isMobile && templatePickerOpen && (
        <>
          <div
            onClick={() => setTemplatePickerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 51,
            maxHeight: '70vh', display: 'flex', flexDirection: 'column',
          }}>
            <div className="glass" style={{ borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '70vh' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Templates</span>
                <button className="btn-glass btn-icon btn-sm" onClick={() => setTemplatePickerOpen(false)} style={{ padding: 6 }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ overflowY: 'auto', padding: '12px 16px 24px', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
                <TemplatePicker />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Share Links Panel ── */}
      {showSharePanel && (
        <>
          <div
            onClick={() => setShowSharePanel(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61,
            width: isMobile ? '100vw' : 380,
            display: 'flex', flexDirection: 'column',
            background: 'var(--modal-bg, rgba(15,25,40,0.98))',
            backdropFilter: 'blur(24px)',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={15} style={{ opacity: 0.7 }} /> Teilen
              </div>
              <button className="btn-glass btn-icon btn-sm" onClick={() => setShowSharePanel(false)} style={{ padding: 6 }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <ShareLinksPanel resumeId={resume.id} />
            </div>
          </div>
        </>
      )}

      {/* Export error toast */}
      {exportError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 300, padding: '12px 20px', borderRadius: 12,
          background: 'rgba(255,59,48,0.95)', backdropFilter: 'blur(12px)',
          color: '#fff', fontSize: 13, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          maxWidth: '90vw',
        }}>
          <span>{exportError}</span>
          <button onClick={() => setExportError(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, padding: 2 }}>
            <X size={14} />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
