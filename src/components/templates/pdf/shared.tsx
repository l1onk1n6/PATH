/**
 * Shared @react-pdf/renderer-Primitive und Formatter fuer alle Templates.
 * Ziel: selektierbarer Vektortext, klickbare Links, saubere Typografie,
 * konsistente Datums-/Label-Spalte, 3-5x kleinere Dateien als der alte
 * html2canvas-Raster-Ansatz.
 */
import { Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { WorkExperience, Education, Skill, Language, Certificate } from '../../../types/resume';

// ─────────────────────────────────────────────────────────────
//  Formatierung
// ─────────────────────────────────────────────────────────────

export function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function dateRange(start: string, end: string, current?: boolean) {
  const s = formatDate(start);
  const e = current ? 'heute' : formatDate(end);
  if (!s && !e) return '';
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

/** Alpha-Hex Helper: #RRGGBB + Alpha 0..1 → #RRGGBBAA */
export function alphaHex(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

/** Relative Luminanz nach WCAG (0 = dunkel, 1 = hell). */
function luminance(hex: string): number {
  const h = hex.replace('#', '').slice(0, 6);
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const toLin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/** Waehlt schwarz oder weiss fuer besten Kontrast auf dem gegebenen Hintergrund. */
export function readableOn(bgHex: string): string {
  return luminance(bgHex) > 0.5 ? '#1c1c1e' : '#ffffff';
}

/**
 * Standard-Muted-Farbe fuer Datums- und Meta-Text. #6e6e73 ergibt auf Weiss
 * ~5.4:1 Kontrast \xE2\x80\x94 WCAG AA (4.5:1) fuer normale Textgroessen erfuellt.
 * Davor hatten wir #8e8e93 mit ~3.8:1, was durchgefallen waere.
 */
export const MUTED_COLOR = '#6e6e73';
export const MUTED_DARK = '#4a4a4f';   // fuer kleineren Text (Cert-Issuer etc.)

// ─────────────────────────────────────────────────────────────
//  Section-Header (verschiedene Stile via Variant)
// ─────────────────────────────────────────────────────────────

export type HeadingStyle =
  | 'line'       // Text + duenne Akzentlinie rechts daneben (Minimal-Stil)
  | 'underline'  // Text ueber einer Akzentlinie
  | 'bar'        // Text links neben einer kurzen, dicken Akzent-Box
  | 'block';     // Text auf einer Akzent-Hintergrundleiste (fuer Sidebars)

export function SectionHeading({
  color, children, style, kind = 'line',
}: {
  color: string;
  children: string;
  style?: Style;
  kind?: HeadingStyle;
}) {
  const label = String(children).toUpperCase();
  const common = { fontSize: 8.5, fontWeight: 700, letterSpacing: 1.8, color };

  if (kind === 'underline') {
    return (
      <View style={{ marginBottom: 10, ...style }}>
        <Text style={{ ...common, marginBottom: 4 }}>{label}</Text>
        <View style={{ height: 1.2, backgroundColor: color }} />
      </View>
    );
  }
  if (kind === 'bar') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, ...style }}>
        <View style={{ width: 16, height: 3, backgroundColor: color, marginRight: 8 }} />
        <Text style={common}>{label}</Text>
      </View>
    );
  }
  if (kind === 'block') {
    return (
      <View style={{
        marginBottom: 10, paddingVertical: 4, paddingHorizontal: 8,
        backgroundColor: alphaHex(color, 0.18), ...style,
      }}>
        <Text style={{ ...common, color }}>{label}</Text>
      </View>
    );
  }
  // 'line' default
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, ...style }}>
      <Text style={common}>{label}</Text>
      <View style={{ flex: 1, height: 0.8, backgroundColor: alphaHex(color, 0.3), marginLeft: 10 }} />
    </View>
  );
}

/**
 * Section-Wrapper, der das Heading mit dem ersten Inhalts-Eintrag zusammen-
 * haelt. Verhindert Witwen: ein Section-Header alleine am Seitenende, Inhalt
 * erst auf der naechsten Seite.
 *
 * @param children ein oder mehrere Eintrags-Views (z. B. WorkEntry). Der
 *   erste wird zusammen mit dem Heading in einen wrap={false}-Block gepackt.
 */
export function Section({
  title, color, kind = 'line', children, style,
}: {
  title: string;
  color: string;
  kind?: HeadingStyle;
  children: React.ReactNode;
  style?: Style;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const [first, ...rest] = arr.filter(Boolean);
  return (
    <View style={{ marginBottom: 14, ...style }}>
      <View wrap={false} minPresenceAhead={30}>
        <SectionHeading color={color} kind={kind}>{title}</SectionHeading>
        {first}
      </View>
      {rest}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  Eintraege
// ─────────────────────────────────────────────────────────────

/**
 * Zerlegt einen freien Beschreibungstext in Bullet-Zeilen.
 * - teilt an Zeilenumbruechen
 * - strippt User-typische Prefixe (•, -, –, *, ·, > plus Whitespace)
 * - filtert leere Zeilen
 * So bekommt der Nutzer konsistent formatierte Aufzaehlungen, egal ob er
 * "- foo", "* foo", "• foo" oder nur "foo" tippt.
 */
export function parseBulletLines(text: string | undefined | null): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[•\-*–·>]+\s*/, '').trim())
    .filter(line => line.length > 0);
}

/**
 * Rendert einen Beschreibungs-Block:
 *  - leer  → nichts
 *  - 1 Zeile → Fliesstext
 *  - n Zeilen → Bullet-Liste
 * Einheitlicher Stil ueber alle Templates.
 */
export function DescriptionBlock({
  text, color, textColor = '#1c1c1e', fontSize = 10, marginTop = 4,
}: {
  text: string | undefined | null;
  color: string;
  textColor?: string;
  fontSize?: number;
  marginTop?: number;
}) {
  const lines = parseBulletLines(text);
  if (lines.length === 0) return null;
  const bodyColor = alphaHex(textColor, 0.78);

  if (lines.length === 1) {
    return (
      <Text style={{ fontSize, color: bodyColor, lineHeight: 1.6, marginTop }}>
        {lines[0]}
      </Text>
    );
  }
  return (
    <View style={{ marginTop }}>
      {lines.map((l, i) => (
        <View key={i} style={{ flexDirection: 'row', marginTop: i === 0 ? 0 : 3 }}>
          <Text style={{ fontSize, color, width: 10, lineHeight: 1.55 }}>•</Text>
          <Text style={{ fontSize, color: bodyColor, flex: 1, lineHeight: 1.55 }}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

export function WorkEntry({
  job, color, textColor = '#1c1c1e', mutedColor = MUTED_COLOR, boldFont = 'Helvetica-Bold',
}: {
  job: WorkExperience;
  color: string;
  textColor?: string;
  mutedColor?: string;
  boldFont?: string;
}) {
  const meta = [job.company, job.location].filter(Boolean).join(' · ');
  return (
    <View wrap={false} style={{ marginBottom: 14 }}>
      {/* Layout: Position links, Datum rechts (beide einzeilig).
          Firma + Ort auf einer eigenen Subzeile links, voll ausnutzbar.
          Beschreibung darunter — keine Kollision mehr mit der Datums-Spalte. */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <Text style={{ fontSize: 11, fontFamily: boldFont, color: textColor, flex: 1, marginRight: 10 }}>
          {job.position}
        </Text>
        <Text style={{ fontSize: 9, color: mutedColor, flexShrink: 0 }}>
          {dateRange(job.startDate, job.endDate, job.current)}
        </Text>
      </View>
      {meta ? (
        <Text style={{ fontSize: 10, color, marginBottom: 4 }}>{meta}</Text>
      ) : null}
      <DescriptionBlock text={job.description} color={color} textColor={textColor} marginTop={meta ? 2 : 4} />
      {job.highlights && job.highlights.length > 0 ? (
        <View style={{ marginTop: 4 }}>
          {job.highlights.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', marginTop: 2 }}>
              <Text style={{ fontSize: 10, color, width: 10 }}>•</Text>
              <Text style={{ fontSize: 10, color: alphaHex(textColor, 0.78), flex: 1, lineHeight: 1.55 }}>{h}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function EduEntry({
  edu, color, textColor = '#1c1c1e', mutedColor = MUTED_COLOR, boldFont = 'Helvetica-Bold',
}: {
  edu: Education;
  color: string;
  textColor?: string;
  mutedColor?: string;
  boldFont?: string;
}) {
  const hasBody = parseBulletLines(edu.description).length > 0;
  const titleLine = [edu.degree, edu.field].filter(Boolean).join(' · ');
  const metaRight = [dateRange(edu.startDate, edu.endDate), edu.grade ? `Note ${edu.grade}` : ''].filter(Boolean).join(' · ');
  return (
    <View wrap={false} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <Text style={{ fontSize: 10.5, fontFamily: boldFont, color: textColor, flex: 1, marginRight: 10 }}>
          {titleLine}
        </Text>
        {metaRight ? (
          <Text style={{ fontSize: 9, color: mutedColor, flexShrink: 0 }}>{metaRight}</Text>
        ) : null}
      </View>
      {edu.institution ? (
        <Text style={{ fontSize: 10, color, marginBottom: hasBody ? 4 : 0 }}>{edu.institution}</Text>
      ) : null}
      {hasBody && <DescriptionBlock text={edu.description} color={color} textColor={textColor} marginTop={edu.institution ? 2 : 4} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  Skills: Bars oder Dots
// ─────────────────────────────────────────────────────────────

export function SkillBar({
  skill, color, textColor = '#1c1c1e', trackColor,
}: {
  skill: Skill;
  color: string;
  textColor?: string;
  trackColor?: string;
}) {
  const track = trackColor ?? alphaHex(textColor, 0.1);
  return (
    <View style={{ marginBottom: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 9.5, color: textColor }}>{skill.name}</Text>
      </View>
      <View style={{ height: 3, backgroundColor: track, borderRadius: 1.5 }}>
        <View style={{ height: 3, width: `${skill.level * 20}%`, backgroundColor: color, borderRadius: 1.5 }} />
      </View>
    </View>
  );
}

export function SkillDots({
  skill, color, textColor = '#1c1c1e',
}: {
  skill: Skill;
  color: string;
  textColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
      <Text style={{ fontSize: 9.5, color: textColor }}>{skill.name}</Text>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={{
              width: 5, height: 5, borderRadius: 2.5,
              backgroundColor: skill.level >= i ? color : alphaHex(textColor, 0.15),
            }}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * Skills als Pill-Chips (moderner Look, keine Level-Visualisierung).
 * Erwartet ein ganzes Array — Gruppierung nach Kategorie wird vom Aufrufer
 * gemacht, falls gewuenscht (SkillChips rendert die uebergebene Liste flach).
 */
export function SkillChips({
  skills, color, textColor = '#1c1c1e',
}: {
  skills: Skill[];
  color: string;
  textColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {skills.map(s => (
        <View
          key={s.id}
          style={{
            paddingTop: 4, paddingBottom: 4, paddingLeft: 9, paddingRight: 9,
            backgroundColor: alphaHex(color, 0.14),
            borderWidth: 0.7, borderStyle: 'solid', borderColor: alphaHex(color, 0.42),
            borderRadius: 3,
          }}
        >
          <Text style={{ fontSize: 9, color: textColor, lineHeight: 1.2 }}>{s.name}</Text>
        </View>
      ))}
    </View>
  );
}

/** Gruppiert Skills nach Kategorie; wenn alle in einer Standardkategorie
 *  liegen oder keine Kategorie gepflegt ist, liefert es [{category:'', skills:[...]}].
 */
export function groupSkillsByCategory(skills: Skill[]): Array<{ category: string; skills: Skill[] }> {
  const map = new Map<string, Skill[]>();
  for (const s of skills) {
    const key = (s.category ?? '').trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  // Wenn nur eine Kategorie (oder alle leer), keine Gruppierung.
  if (map.size <= 1) return [{ category: '', skills }];
  return [...map.entries()].map(([category, skills]) => ({ category, skills }));
}

// ─────────────────────────────────────────────────────────────
//  Languages + Certificates
// ─────────────────────────────────────────────────────────────

export function LanguageRow({
  lang, textColor = '#1c1c1e', mutedColor = MUTED_COLOR,
}: {
  lang: Language;
  textColor?: string;
  mutedColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap' }}>
      <Text style={{ fontSize: 10, color: textColor }}>{lang.name}</Text>
      <Text style={{ fontSize: 9, color: mutedColor }}>{lang.level}</Text>
    </View>
  );
}

export function CertItem({
  cert, textColor = '#1c1c1e', mutedColor = MUTED_DARK, boldFont = 'Helvetica-Bold',
}: {
  cert: Certificate;
  textColor?: string;
  mutedColor?: string;
  boldFont?: string;
}) {
  return (
    <View style={{ marginBottom: 7 }} wrap={false}>
      <Text style={{ fontSize: 10, fontFamily: boldFont, color: textColor }}>{cert.name}</Text>
      <Text style={{ fontSize: 9, color: mutedColor, marginTop: 1 }}>
        {cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}
      </Text>
    </View>
  );
}
