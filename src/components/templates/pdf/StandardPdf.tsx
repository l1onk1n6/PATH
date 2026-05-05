/**
 * Parametrischer Vektor-Template-Generator.
 * Eine Code-Basis, die ueber StandardVariant-Config die meisten visuellen
 * Stile abdeckt (Sidebar-Layouts, Banner-Header, Typo-Varianten, Farbschemata).
 * Ausgesprochen distinkte Stile (Elegant, Executive, Timeline, Tech) haben
 * eigene Files unter pdf/*.tsx.
 *
 * Hinweis: Inner-Components (Header, Main, Sidebar, Sections) teilen sich
 * 10+ Variant-/Style-Closure-Variablen. Sie nach Modul-Scope zu lifen würde
 * jeden Helper mit massiver Prop-Liste aufblähen ohne Verhaltensgewinn.
 * Daher hier file-level disabled.
 */
/* eslint-disable react-hooks/static-components */
import { Document, Page, View, Text, Link, Image } from '@react-pdf/renderer';
import type { Resume } from '../../../types/resume';
import type { HeadingStyle } from './shared-utils';
import { alphaHex, readableOn, MUTED_COLOR, MUTED_DARK, groupSkillsByCategory, dateRange, ensureProtocol, displayUrl } from './shared-utils';
import { SectionHeading, Section, WorkEntry, EduEntry, SkillBar, SkillDots, SkillChips, LanguageRow, CertItem, DescriptionBlock } from './shared';
import { sortWorkExperience, sortEducation } from '../../../lib/sortByDate';

// ─────────────────────────────────────────────────────────────
//  Variant-API
// ─────────────────────────────────────────────────────────────

export interface StandardVariant {
  /** Seitenhintergrund (default #fff). */
  pageBg?: string;
  /** Haupt-Textfarbe (default #1c1c1e). */
  textColor?: string;
  /** Muted / Sekundaer (default MUTED_COLOR = #6e6e73, WCAG AA-safe). */
  mutedColor?: string;
  /** Akzent-Farbe; default = resume.accentColor. */
  accent?: string;

  /** Spalten-Layout. */
  sidebar?: 'none' | 'left' | 'right';
  /** Sidebar-Hintergrund (nur wenn sidebar != 'none'). */
  sidebarBg?: string;
  /** Sidebar-Textfarbe (default = textColor). */
  sidebarText?: string;
  /** Breite der Sidebar in Punkten (Default 170). */
  sidebarWidth?: number;
  /** Foto im Sidebar (oben zentriert) statt neben dem Namen. */
  photoInSidebar?: boolean;

  /** Serif-Look aktivieren. */
  serif?: boolean;

  /** Header-Variante. */
  header?: 'simple' | 'banner' | 'centered' | 'split';
  /** Banner-Hintergrundfarbe. Default = accent. */
  bannerBg?: string;
  /** Banner-Textfarbe. Default = #fff. */
  bannerText?: string;

  /** Stil der Section-Headings. */
  headingStyle?: HeadingStyle;

  /** Skill-Darstellung. */
  skillStyle?: 'bar' | 'dots' | 'chips';

  /** Groesse des Namens. */
  nameSize?: number;
  /** Letter-Spacing des Namens. */
  nameTracking?: number;
}

interface Props { resume: Resume; variant?: StandardVariant }

// ─────────────────────────────────────────────────────────────
//  Rendering
// ─────────────────────────────────────────────────────────────

export function StandardPdf({ resume, variant = {} }: Props) {
  const info = resume.personalInfo;
  const accent = variant.accent ?? resume.accentColor ?? '#007AFF';
  const text = variant.textColor ?? '#1c1c1e';
  const muted = variant.mutedColor ?? MUTED_COLOR;
  const pageBg = variant.pageBg ?? '#fff';
  const fontFamily = variant.serif ? 'Times-Roman' : 'Helvetica';
  const boldFont = variant.serif ? 'Times-Bold' : 'Helvetica-Bold';
  const sidebarMode = variant.sidebar ?? 'none';
  const sidebarBg = variant.sidebarBg ?? alphaHex(accent, 0.08);
  const sidebarText = variant.sidebarText ?? text;
  const sidebarWidth = variant.sidebarWidth ?? 170;
  const photoInSidebar = variant.photoInSidebar ?? false;
  const headerMode = variant.header ?? 'simple';
  const headingStyle = variant.headingStyle ?? 'line';
  const skillStyle = variant.skillStyle ?? 'bar';
  const nameSize = variant.nameSize ?? 26;
  const nameTracking = variant.nameTracking ?? -0.8;
  const bannerBg = variant.bannerBg ?? accent;
  // Auto-Kontrast: wenn der Banner-Hintergrund hell ist, darf der Text nicht
  // weiss sein \xE2\x80\x94 sonst unleserlich. WCAG-konformer Fallback.
  const bannerText = variant.bannerText ?? readableOn(bannerBg);

  const name = [info.firstName, info.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  // ── Kontakt-Liste ────────────────────────────────────────
  const contacts = buildContacts(info);

  // ── Header (ueber beiden Spalten) ─────────────────────────
  // Kontakte werden im Header NUR gezeigt, wenn keine Sidebar existiert
  // (sonst sind sie in der Sidebar und wuerden doppelt erscheinen).
  const Header = ({ inverse = false }: { inverse?: boolean }) => {
    const color = inverse ? bannerText : text;
    const accentColor = inverse ? bannerText : accent;
    const subMuted = inverse ? alphaHex(bannerText, 0.8) : muted;
    const showPhoto = !photoInSidebar && !!info.photo;
    const showContacts = sidebarMode === 'none';

    if (headerMode === 'banner') {
      return (
        <View style={{ backgroundColor: bannerBg, paddingVertical: 24, paddingHorizontal: 40 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {showPhoto ? (
              <Image src={info.photo!} style={{ width: 66, height: 66, borderRadius: 33, marginRight: 16 }} />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: nameSize, fontFamily: boldFont, color: bannerText, letterSpacing: nameTracking, lineHeight: 1.15 }}>
                {name}
              </Text>
              {info.title ? (
                <Text style={{ fontSize: 12, color: alphaHex(bannerText, 0.85), marginTop: 5, lineHeight: 1.3 }}>{info.title}</Text>
              ) : null}
            </View>
          </View>
          {showContacts ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {contacts.map((c, i) => <ContactChip key={i} c={c} color={alphaHex(bannerText, 0.9)} />)}
            </View>
          ) : null}
        </View>
      );
    }

    const centered = headerMode === 'centered';
    return (
      <View style={{
        flexDirection: 'row',
        alignItems: centered ? 'center' : 'flex-start',
        justifyContent: centered ? 'center' : 'flex-start',
        marginBottom: 18,
      }}>
        {showPhoto ? (
          <Image src={info.photo!} style={{ width: 64, height: 64, borderRadius: 4, marginRight: 16 }} />
        ) : null}
        <View style={{ flex: centered ? undefined : 1, alignItems: centered ? 'center' : 'flex-start' }}>
          <Text style={{ fontSize: nameSize, fontFamily: boldFont, color, letterSpacing: nameTracking, lineHeight: 1.15 }}>{name}</Text>
          {info.title ? (
            <Text style={{ fontSize: 12, color: accentColor, marginTop: 5, lineHeight: 1.3 }}>{info.title}</Text>
          ) : null}
          {showContacts ? (
            <View style={{
              flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 14,
              justifyContent: centered ? 'center' : 'flex-start',
            }}>
              {contacts.map((c, i) => <ContactInline key={i} c={c} color={subMuted} />)}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  // ── Main Column ──────────────────────────────────────────
  const Summary = () => info.summary ? (
    <View style={{
      marginBottom: 16, paddingLeft: 12,
      borderLeftWidth: 2, borderLeftColor: accent, borderLeftStyle: 'solid',
    }}>
      <Text style={{ fontSize: 10.5, color: alphaHex(text, 0.8), lineHeight: 1.6, fontStyle: 'italic' }}>
        {info.summary}
      </Text>
    </View>
  ) : null;

  const WorkSection = () => resume.workExperience.length > 0 ? (
    <Section title="Berufserfahrung" color={accent} kind={headingStyle}>
      {sortWorkExperience(resume.workExperience).map(job => (
        <WorkEntry key={job.id} job={job} color={accent} textColor={text} mutedColor={muted} boldFont={boldFont} />
      ))}
    </Section>
  ) : null;

  const EduSection = () => resume.education.length > 0 ? (
    <Section title="Ausbildung" color={accent} kind={headingStyle}>
      {sortEducation(resume.education).map(edu => (
        <EduEntry key={edu.id} edu={edu} color={accent} textColor={text} mutedColor={muted} boldFont={boldFont} />
      ))}
    </Section>
  ) : null;

  const ProjectsSection = () => (resume.projects ?? []).length > 0 ? (
    <Section title="Projekte" color={accent} kind={headingStyle}>
      {resume.projects.map(p => (
        <View key={p.id} wrap={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={{ fontSize: 10.5, fontFamily: boldFont, color: text }}>{p.name}</Text>
              {p.url ? (
                <Link src={ensureProtocol(p.url)}>
                  <Text style={{ fontSize: 9, color: accent }}>{p.url}</Text>
                </Link>
              ) : null}
            </View>
            <Text style={{ fontSize: 9, color: muted }}>{dateRange(p.startDate, p.endDate)}</Text>
          </View>
          <DescriptionBlock text={p.description} color={accent} textColor={text} fontSize={10} marginTop={2} />
          {p.technologies?.length ? (
            <Text style={{ fontSize: 9, color: muted, marginTop: 3 }}>{p.technologies.join(' · ')}</Text>
          ) : null}
        </View>
      ))}
    </Section>
  ) : null;

  const CustomSections = () => (
    <>
      {(resume.customSections ?? []).map(cs => cs.items?.length ? (
        <Section key={cs.id} title={cs.title} color={accent} kind={headingStyle}>
          {cs.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }} wrap={false}>
              <Text style={{ fontSize: 10, color: accent, width: 12 }}>•</Text>
              <Text style={{ fontSize: 10, color: alphaHex(text, 0.82), flex: 1, lineHeight: 1.55 }}>{it}</Text>
            </View>
          ))}
        </Section>
      ) : null)}
    </>
  );

  // ── Sidebar Sections ─────────────────────────────────────
  const SidePhoto = () => photoInSidebar && info.photo ? (
    <View style={{ alignItems: 'center', marginBottom: 16 }}>
      <Image src={info.photo} style={{ width: 100, height: 100, borderRadius: 50 }} />
    </View>
  ) : null;

  const ContactBlock = ({ inverse = false }: { inverse?: boolean }) => {
    if (!contacts.length) return null;
    const color = inverse ? sidebarText : text;
    return (
      <View style={{ marginBottom: 14 }}>
        <SectionHeading color={inverse ? sidebarText : accent} kind={headingStyle}>Kontakt</SectionHeading>
        {contacts.map((c, i) => (
          <View key={i} style={{ marginBottom: 5 }}>
            {c.href
              ? <Link src={c.href}><Text style={{ fontSize: 9, color: alphaHex(color, 0.85) }}>{c.text}</Text></Link>
              : <Text style={{ fontSize: 9, color: alphaHex(color, 0.85) }}>{c.text}</Text>}
          </View>
        ))}
      </View>
    );
  };

  const SkillsSection = ({ inverse = false }: { inverse?: boolean }) => {
    if (resume.skills.length === 0) return null;
    const sText = inverse ? sidebarText : text;
    const sMuted = inverse ? alphaHex(sidebarText, 0.7) : muted;
    // Nach Kategorie gruppieren, wenn welche gepflegt sind \xE2\x80\x94 moderner Stil.
    const groups = groupSkillsByCategory(resume.skills);
    const renderGroup = (skills: typeof resume.skills) => {
      if (skillStyle === 'chips') return <SkillChips skills={skills} color={accent} textColor={sText} />;
      if (skillStyle === 'dots')  return <>{skills.map(s => <SkillDots key={s.id} skill={s} color={accent} textColor={sText} />)}</>;
      return <>{skills.map(s => <SkillBar key={s.id} skill={s} color={accent} textColor={sText} trackColor={alphaHex(sText, 0.12)} />)}</>;
    };
    return (
      <Section title="Fähigkeiten" color={inverse ? sidebarText : accent} kind={headingStyle}>
        {groups.map((g, i) => (
          <View key={i} wrap={false} style={{ marginBottom: i < groups.length - 1 ? 8 : 0 }}>
            {g.category ? (
              <Text style={{ fontSize: 9, fontFamily: boldFont, color: sMuted, marginBottom: 4, letterSpacing: 0.5 }}>
                {g.category}
              </Text>
            ) : null}
            {renderGroup(g.skills)}
          </View>
        ))}
      </Section>
    );
  };

  const LanguagesSection = ({ inverse = false }: { inverse?: boolean }) => {
    if (resume.languages.length === 0) return null;
    const sText = inverse ? sidebarText : text;
    const sMuted = inverse ? alphaHex(sidebarText, 0.7) : muted;
    return (
      <Section title="Sprachen" color={inverse ? sidebarText : accent} kind={headingStyle}>
        {resume.languages.map(l => <LanguageRow key={l.id} lang={l} textColor={sText} mutedColor={sMuted} />)}
      </Section>
    );
  };

  const CertsSection = ({ inverse = false }: { inverse?: boolean }) => {
    if ((resume.certificates ?? []).length === 0) return null;
    const sText = inverse ? sidebarText : text;
    const sMuted = inverse ? alphaHex(sidebarText, 0.7) : MUTED_DARK;
    return (
      <Section title="Zertifikate" color={inverse ? sidebarText : accent} kind={headingStyle}>
        {resume.certificates.map(c => <CertItem key={c.id} cert={c} textColor={sText} mutedColor={sMuted} boldFont={boldFont} linkColor={inverse ? sidebarText : accent} />)}
      </Section>
    );
  };

  // ── Gesamt-Layout ────────────────────────────────────────
  const sidebarInverse = sidebarBg !== '#fff' && sidebarBg !== pageBg;

  const Sidebar = () => (
    <View style={{ backgroundColor: sidebarBg, padding: 16, width: sidebarWidth, minHeight: '100%' }}>
      <SidePhoto />
      <ContactBlock inverse={sidebarInverse} />
      <SkillsSection inverse={sidebarInverse} />
      <LanguagesSection inverse={sidebarInverse} />
      <CertsSection inverse={sidebarInverse} />
    </View>
  );

  const Main = () => (
    <View>
      <Summary />
      <WorkSection />
      <EduSection />
      <ProjectsSection />
      <CustomSections />
      {sidebarMode === 'none' ? (
        <>
          <SkillsSection />
          <LanguagesSection />
          <CertsSection />
        </>
      ) : null}
    </View>
  );

  // Wichtig: paddingTop/Bottom auf der Page, nicht auf Inner-Views — nur
  // so bekommt JEDE Seite (auch Folgeseiten bei Umbruch) Abstand zum Rand.
  const PAGE_VERTICAL = 40;
  const pageStyle = { fontFamily, fontSize: 10, color: text, backgroundColor: pageBg, lineHeight: 1.5, paddingTop: PAGE_VERTICAL, paddingBottom: PAGE_VERTICAL };

  // Sidebar-Hintergrund als fixed-Layer, damit er auf JEDER Seite voll
  // bis zum Blattrand reicht. Negative Offsets, um die Page-Padding-Zone
  // zu "escapen" (sonst bliebe oben/unten ein weisser Streifen).
  const SidebarBackground = () => (
    sidebarMode === 'none' ? null : (
      <View
        fixed
        style={{
          position: 'absolute',
          top: -PAGE_VERTICAL, bottom: -PAGE_VERTICAL,
          [sidebarMode === 'left' ? 'left' : 'right']: 0,
          width: sidebarWidth,
          backgroundColor: sidebarBg,
        }}
      />
    )
  );

  // Banner-Header: volle Breite; Sidebar/Main darunter.
  if (headerMode === 'banner') {
    return (
      <Document>
        <Page size="A4" style={pageStyle}>
          <SidebarBackground />
          <Header inverse />
          {sidebarMode === 'none' ? (
            <View style={{ paddingHorizontal: 40, paddingTop: 20 }}><Main /></View>
          ) : (
            <View style={{ flexDirection: sidebarMode === 'left' ? 'row' : 'row-reverse' }}>
              <Sidebar />
              <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20 }}><Main /></View>
            </View>
          )}
        </Page>
      </Document>
    );
  }

  // Non-banner: einheitliches Layout mit Header oben, dann Spalten oder single-col.
  return (
    <Document>
      <Page size="A4" style={pageStyle}>
        <SidebarBackground />
        {sidebarMode === 'none' ? (
          <View style={{ paddingHorizontal: 46 }}>
            <Header />
            <Main />
          </View>
        ) : (
          <View style={{ flexDirection: sidebarMode === 'left' ? 'row' : 'row-reverse' }}>
            <Sidebar />
            <View style={{ flex: 1, paddingHorizontal: 26 }}>
              <Header />
              <Main />
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────
//  Helper
// ─────────────────────────────────────────────────────────────

function buildContacts(info: Resume['personalInfo']) {
  const parts: Array<{ text: string; href?: string }> = [];
  if (info.email) parts.push({ text: info.email, href: `mailto:${info.email}` });
  if (info.phone) parts.push({ text: info.phone, href: `tel:${info.phone.replace(/\s/g, '')}` });
  const addr = [info.street, info.location].filter(Boolean).join(', ');
  if (addr) parts.push({ text: addr });
  if (info.website) parts.push({ text: displayUrl(info.website), href: ensureProtocol(info.website) });
  if (info.linkedin) parts.push({ text: displayUrl(info.linkedin), href: ensureProtocol(info.linkedin) });
  return parts;
}

function ContactInline({ c, color }: { c: { text: string; href?: string }; color: string }) {
  const t = <Text style={{ fontSize: 9, color }}>{c.text}</Text>;
  return c.href ? <Link src={c.href}>{t}</Link> : t;
}

function ContactChip({ c, color }: { c: { text: string; href?: string }; color: string }) {
  const t = (
    <Text style={{ fontSize: 9, color }}>
      {c.text}
    </Text>
  );
  return c.href ? <Link src={c.href}>{t}</Link> : t;
}

