/**
 * Parametrisches @react-pdf-Template, das alle 19 visuellen Varianten
 * durch Config abdeckt. Vorteil: eine Code-Basis, einheitliche Pflege,
 * alle Templates sofort in Vektor.
 *
 * Einschraenkungen gegenueber den HTML-Originalen:
 * - Keine backdrop-filter, keine komplexen Gradients (@react-pdf kann nur
 *   solide Farben und einzelne Linear-Gradients pro View).
 * - Layout: Flexbox, kein CSS-Grid.
 * Die Templates wirken dadurch etwas reduzierter, sind aber alle korrekt
 * und mit selektierbarem Text.
 */
import { Document, Page, View, Text, Link, Image } from '@react-pdf/renderer';
import type { Resume } from '../../../types/resume';
import {
  formatDate, dateRange, alphaHex,
  SectionHeading, WorkEntry, EduEntry,
} from './shared';

export interface StandardVariant {
  /** Seitenhintergrund (i. d. R. #fff fuer druckbare Ergebnisse). */
  pageBg?: string;
  textColor?: string;
  mutedColor?: string;
  /** Layout-Spalten. 'none' = Single-Column, 'left'/'right' = Sidebar. */
  sidebar?: 'none' | 'left' | 'right';
  sidebarBg?: string;
  sidebarTextColor?: string;
  /** Farbe der Accent-Elemente (Section-Lines, Skill-Bars); Default = resume.accentColor */
  accent?: string;
  /** Schriftwelt: sans (Helvetica) oder serif (Times-Roman) */
  serif?: boolean;
  /** Header-Variante */
  header?: 'left' | 'centered' | 'banner';
  /** Banner-Hintergrundfarbe wenn header='banner'; Default = accent */
  bannerBg?: string;
  /** Name-Grossschrift */
  nameSize?: number;
}

interface Props { resume: Resume; variant?: StandardVariant }

export function StandardPdf({ resume, variant = {} }: Props) {
  const info = resume.personalInfo;
  const accent = variant.accent ?? resume.accentColor ?? '#007AFF';
  const text = variant.textColor ?? '#1c1c1e';
  const muted = variant.mutedColor ?? '#6e6e73';
  const pageBg = variant.pageBg ?? '#fff';
  const fontFamily = variant.serif ? 'Times-Roman' : 'Helvetica';
  const fontFamilyBold = variant.serif ? 'Times-Bold' : 'Helvetica-Bold';
  const sidebarMode = variant.sidebar ?? 'none';
  const sidebarBg = variant.sidebarBg ?? alphaHex(accent, 0.08);
  const sidebarText = variant.sidebarTextColor ?? text;

  const name = [info.firstName, info.lastName].filter(Boolean).join(' ') || 'Ihr Name';
  const headerMode = variant.header ?? 'left';
  const bannerBg = variant.bannerBg ?? accent;
  const nameSize = variant.nameSize ?? 22;

  // ── Header ───────────────────────────────────────────────
  const Header = () => {
    const contacts = buildContacts(info);
    if (headerMode === 'banner') {
      return (
        <View style={{ backgroundColor: bannerBg, padding: 20, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {info.photo ? <Image src={info.photo} style={{ width: 60, height: 60, borderRadius: 4 }} /> : null}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: nameSize, fontFamily: fontFamilyBold, color: '#fff' }}>{name}</Text>
              {info.title ? <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{info.title}</Text> : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {contacts.map((c, i) => (
              <ContactNode key={i} c={c} color="rgba(255,255,255,0.9)" />
            ))}
          </View>
        </View>
      );
    }
    const centered = headerMode === 'centered';
    return (
      <View style={{
        flexDirection: centered ? 'column' : 'row',
        alignItems: centered ? 'center' : 'flex-start',
        gap: 14,
        marginBottom: 12,
      }}>
        {info.photo ? <Image src={info.photo} style={{ width: 60, height: 60, borderRadius: 4 }} /> : null}
        <View style={{ flex: centered ? undefined : 1, alignItems: centered ? 'center' : 'flex-start' }}>
          <Text style={{ fontSize: nameSize, fontFamily: fontFamilyBold, color: text, letterSpacing: -0.5 }}>{name}</Text>
          {info.title ? <Text style={{ fontSize: 11, color: accent, marginTop: 2 }}>{info.title}</Text> : null}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 4,
            marginTop: 6,
            justifyContent: centered ? 'center' : 'flex-start',
          }}>
            {contacts.map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {i > 0 ? <Text style={{ fontSize: 9, color: '#c7c7cc', marginHorizontal: 4 }}>·</Text> : null}
                <ContactNode c={c} color={muted} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ── Main-Sections (Erfahrung, Ausbildung, Zusammenfassung) ──
  const MainCol = () => (
    <View style={{ flex: 1 }}>
      {info.summary ? (
        <View style={{ marginBottom: 14, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: accent }}>
          <Text style={{ fontSize: 10, color: '#444', lineHeight: 1.6 }}>{info.summary}</Text>
        </View>
      ) : null}

      {resume.workExperience.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <SectionHeading color={accent}>Berufserfahrung</SectionHeading>
          {resume.workExperience.map(job => <WorkEntry key={job.id} job={job} color={accent} />)}
        </View>
      ) : null}

      {resume.education.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <SectionHeading color={accent}>Ausbildung</SectionHeading>
          {resume.education.map(edu => <EduEntry key={edu.id} edu={edu} color={accent} />)}
        </View>
      ) : null}

      {(resume.projects ?? []).length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <SectionHeading color={accent}>Projekte</SectionHeading>
          {resume.projects.map(p => (
            <View key={p.id} style={{ marginBottom: 8 }} wrap={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 10.5, fontFamily: fontFamilyBold }}>{p.name}</Text>
                <Text style={{ fontSize: 9, color: muted }}>{dateRange(p.startDate, p.endDate)}</Text>
              </View>
              {p.description ? <Text style={{ fontSize: 10, color: '#444', marginTop: 2, lineHeight: 1.5 }}>{p.description}</Text> : null}
              {p.technologies?.length ? (
                <Text style={{ fontSize: 9, color: muted, marginTop: 2 }}>{p.technologies.join(' · ')}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {(resume.customSections ?? []).map(cs => cs.items?.length ? (
        <View key={cs.id} style={{ marginBottom: 12 }}>
          <SectionHeading color={accent}>{cs.title}</SectionHeading>
          {cs.items.map((it, i) => (
            <Text key={i} style={{ fontSize: 10, marginBottom: 3, color: '#444' }}>• {it}</Text>
          ))}
        </View>
      ) : null)}
    </View>
  );

  // ── Side-Sections (Skills, Sprachen, Zertifikate) ──
  const SideCol = ({ wide = false, inverse = false }: { wide?: boolean; inverse?: boolean }) => {
    const sColor = inverse ? sidebarText : text;
    const sAccent = accent;
    return (
      <View style={{ width: wide ? undefined : 145, flex: wide ? 1 : undefined }}>
        {resume.skills.length > 0 ? (
          <View style={{ marginBottom: 14 }}>
            <SectionHeading color={sAccent}>Faehigkeiten</SectionHeading>
            {resume.skills.map(s => (
              <View key={s.id} style={{ marginBottom: 5 }}>
                <Text style={{ fontSize: 10, color: sColor, marginBottom: 2 }}>{s.name}</Text>
                <View style={{ height: 3, backgroundColor: alphaHex(sColor, 0.12), borderRadius: 2 }}>
                  <View style={{ height: 3, width: `${s.level * 20}%`, backgroundColor: sAccent, borderRadius: 2 }} />
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {resume.languages.length > 0 ? (
          <View style={{ marginBottom: 14 }}>
            <SectionHeading color={sAccent}>Sprachen</SectionHeading>
            {resume.languages.map(l => (
              <View key={l.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 10, color: sColor }}>{l.name}</Text>
                <Text style={{ fontSize: 9, color: alphaHex(sColor, 0.55) }}>{l.level}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {(resume.certificates ?? []).length > 0 ? (
          <View>
            <SectionHeading color={sAccent}>Zertifikate</SectionHeading>
            {resume.certificates.map(c => (
              <View key={c.id} style={{ marginBottom: 5 }} wrap={false}>
                <Text style={{ fontSize: 10, fontFamily: fontFamilyBold, color: sColor }}>{c.name}</Text>
                <Text style={{ fontSize: 9, color: alphaHex(sColor, 0.55) }}>
                  {c.issuer}{c.date ? ` · ${formatDate(c.date)}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Document>
      <Page size="A4" style={{ fontFamily, fontSize: 10, color: text, backgroundColor: pageBg, lineHeight: 1.5 }}>
        {headerMode === 'banner' ? <Header /> : (
          <View style={{ paddingTop: 34, paddingLeft: 40, paddingRight: 40 }}><Header /></View>
        )}

        {sidebarMode === 'none' ? (
          <View style={{ paddingLeft: 40, paddingRight: 40, paddingBottom: 40 }}><MainCol /><SideCol wide /></View>
        ) : (
          <View style={{
            flexDirection: sidebarMode === 'left' ? 'row' : 'row-reverse',
            paddingLeft: 40, paddingRight: 40, paddingBottom: 40, gap: 20,
          }}>
            <View style={{ backgroundColor: sidebarBg, padding: 14, width: 160 }}>
              <SideCol inverse={sidebarBg !== '#fff' && sidebarBg !== alphaHex(accent, 0.08)} />
            </View>
            <MainCol />
          </View>
        )}
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────────────────

function buildContacts(info: Resume['personalInfo']) {
  const parts: Array<{ text: string; href?: string }> = [];
  if (info.email) parts.push({ text: info.email, href: `mailto:${info.email}` });
  if (info.phone) parts.push({ text: info.phone, href: `tel:${info.phone.replace(/\s/g, '')}` });
  const addr = [info.street, info.location].filter(Boolean).join(', ');
  if (addr) parts.push({ text: addr });
  if (info.website) parts.push({ text: info.website, href: ensureProtocol(info.website) });
  if (info.linkedin) parts.push({ text: info.linkedin, href: ensureProtocol(info.linkedin) });
  return parts;
}

function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
}

function ContactNode({ c, color }: { c: { text: string; href?: string }; color: string }) {
  if (c.href) return <Link src={c.href} style={{ fontSize: 9, color }}>{c.text}</Link>;
  return <Text style={{ fontSize: 9, color }}>{c.text}</Text>;
}

// ─────────────────────────────────────────────────────────
//  Variant-Factories pro Template-ID
// ─────────────────────────────────────────────────────────

export const TEMPLATE_VARIANTS: Record<string, StandardVariant> = {
  executive:     { sidebar: 'left', header: 'banner', nameSize: 24 },
  creative:      { sidebar: 'left', header: 'banner' },
  nordic:        { sidebar: 'right', sidebarBg: '#f6f9fb' },
  corporate:     { sidebar: 'left', header: 'banner' },
  tech:          { sidebar: 'left', sidebarBg: '#0f1923', sidebarTextColor: '#e5e7eb' },
  elegant:       { sidebar: 'none', serif: true, header: 'centered', nameSize: 26 },
  bold:          { sidebar: 'left', header: 'banner', nameSize: 26 },
  academic:      { sidebar: 'none', serif: true, header: 'left' },
  startup:       { sidebar: 'right' },
  modern:        { sidebar: 'left' },
  vibrant:       { sidebar: 'right', header: 'banner' },
  vintage:       { sidebar: 'none', serif: true, header: 'centered' },
  magazine:      { sidebar: 'left', sidebarBg: '#1a1a1a', sidebarTextColor: '#f3f3f3' },
  timeline:      { sidebar: 'none' },
  compact:       { sidebar: 'right' },
  pastel:        { sidebar: 'right', sidebarBg: '#fdf2f8' },
  geometric:     { sidebar: 'left' },
  freelancer:    { sidebar: 'right' },
  international: { sidebar: 'left', header: 'centered' },
};
