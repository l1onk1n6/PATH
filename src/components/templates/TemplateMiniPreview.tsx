import { TEMPLATE_VARIANTS } from './pdf/StandardPdf';
import type { TemplateId } from '../../types/resume';

interface Props {
  templateId: TemplateId;
  accent: string;
  height?: number;
}

/**
 * Miniatur-Vorschau eines Templates: realistisches HTML-Mockup des PDF-Layouts
 * (Sidebar links/rechts, Banner-Header, Akzent-Spuren). Kein echtes PDF-Rendering —
 * das waere zu teuer — aber visuell nahe am Export.
 */
export default function TemplateMiniPreview({ templateId, accent, height = 110 }: Props) {
  const variant = TEMPLATE_VARIANTS[templateId] ?? {};
  const sidebarMode = variant.sidebar ?? 'none';
  const sidebarBg   = variant.sidebarBg ?? '#f4f4f7';
  const sidebarFg   = variant.sidebarText ?? '#1c1c1e';
  const header      = variant.header ?? 'simple';
  const bannerBg    = variant.bannerBg ?? accent;
  const serif       = variant.serif ?? false;
  const sidebarW    = sidebarMode === 'none' ? 0 : 38;

  // Paper background is always light in the PDF export
  const paperBg = '#ffffff';
  const textBlock = '#d4d4d8';
  const accentBlock = accent;

  const fontFamily = serif ? "'Times New Roman', Georgia, serif" : "'Inter', system-ui, sans-serif";

  const HeaderBlock = () => {
    if (header === 'banner') {
      return (
        <div style={{
          background: bannerBg, padding: '6px 8px', color: '#fff',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{ width: '55%', height: 5, background: 'rgba(255,255,255,0.9)', borderRadius: 1 }} />
          <div style={{ width: '35%', height: 3, background: 'rgba(255,255,255,0.6)', borderRadius: 1 }} />
        </div>
      );
    }
    const centered = header === 'centered';
    return (
      <div style={{
        padding: '6px 8px 4px', display: 'flex', flexDirection: 'column',
        alignItems: centered ? 'center' : 'flex-start', gap: 2,
      }}>
        <div style={{ width: centered ? '45%' : '55%', height: 5, background: '#18181b', borderRadius: 1 }} />
        <div style={{ width: centered ? '30%' : '35%', height: 3, background: accent, borderRadius: 1 }} />
      </div>
    );
  };

  const BodyLines = ({ color = textBlock, count = 3 }: { color?: string; count?: number }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '3px 5px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: `${90 - i * 10}%`, height: 2.5, background: color, borderRadius: 1,
        }} />
      ))}
    </div>
  );

  const SidebarBlock = () => (
    <div style={{
      width: sidebarW, background: sidebarBg, flexShrink: 0,
      padding: '6px 4px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {/* Photo placeholder if template uses it */}
      {variant.photoInSidebar && (
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: sidebarFg === '#1c1c1e' ? accent : 'rgba(255,255,255,0.3)', margin: '0 auto 2px' }} />
      )}
      {/* Skills-Block */}
      <div style={{ width: '65%', height: 3, background: sidebarFg, opacity: 0.8, borderRadius: 1 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {[0.9, 0.7, 0.8, 0.6].map((w, i) => (
          <div key={i} style={{ width: `${w * 80}%`, height: 2, background: sidebarFg, opacity: 0.5, borderRadius: 1 }} />
        ))}
      </div>
      <div style={{ width: '65%', height: 3, background: sidebarFg, opacity: 0.8, borderRadius: 1, marginTop: 3 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {[0.7, 0.5].map((w, i) => (
          <div key={i} style={{ width: `${w * 80}%`, height: 2, background: sidebarFg, opacity: 0.5, borderRadius: 1 }} />
        ))}
      </div>
    </div>
  );

  const MainContent = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <HeaderBlock />
      <div style={{ flex: 1, padding: '3px 2px' }}>
        {/* Section 1 */}
        <div style={{ width: '30%', height: 3.5, background: accentBlock, borderRadius: 1, margin: '3px 5px 2px' }} />
        <BodyLines count={3} />
        {/* Section 2 */}
        <div style={{ width: '25%', height: 3.5, background: accentBlock, borderRadius: 1, margin: '5px 5px 2px' }} />
        <BodyLines count={2} />
      </div>
    </div>
  );

  return (
    <div style={{
      height, width: '100%', borderRadius: 6, overflow: 'hidden',
      background: paperBg, display: 'flex',
      fontFamily,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
    }}>
      {sidebarMode === 'left' && <SidebarBlock />}
      <MainContent />
      {sidebarMode === 'right' && <SidebarBlock />}
    </div>
  );
}
