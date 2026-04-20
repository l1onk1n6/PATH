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

// ─────────────────────────────────────────────────────────────
//  Eintraege
// ─────────────────────────────────────────────────────────────

export function WorkEntry({
  job, color, textColor = '#1c1c1e', mutedColor = '#8e8e93', boldFont = 'Helvetica-Bold',
}: {
  job: WorkExperience;
  color: string;
  textColor?: string;
  mutedColor?: string;
  boldFont?: string;
}) {
  return (
    <View style={{ marginBottom: 12 }} wrap={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 11, fontFamily: boldFont, color: textColor }}>{job.position}</Text>
          {job.company ? (
            <Text style={{ fontSize: 10.5, color, marginTop: 1 }}>{job.company}</Text>
          ) : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9, color: mutedColor }}>{dateRange(job.startDate, job.endDate, job.current)}</Text>
          {job.location ? <Text style={{ fontSize: 9, color: mutedColor, marginTop: 1 }}>{job.location}</Text> : null}
        </View>
      </View>
      {job.description ? (
        <Text style={{ fontSize: 10, color: alphaHex(textColor, 0.75), marginTop: 4, lineHeight: 1.55 }}>
          {job.description}
        </Text>
      ) : null}
      {job.highlights && job.highlights.length > 0 ? (
        <View style={{ marginTop: 4 }}>
          {job.highlights.map((h, i) => (
            <View key={i} style={{ flexDirection: 'row', marginTop: 1 }}>
              <Text style={{ fontSize: 10, color, width: 10 }}>•</Text>
              <Text style={{ fontSize: 10, color: alphaHex(textColor, 0.75), flex: 1, lineHeight: 1.5 }}>{h}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function EduEntry({
  edu, color, textColor = '#1c1c1e', mutedColor = '#8e8e93', boldFont = 'Helvetica-Bold',
}: {
  edu: Education;
  color: string;
  textColor?: string;
  mutedColor?: string;
  boldFont?: string;
}) {
  return (
    <View style={{ marginBottom: 10 }} wrap={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 10.5, fontFamily: boldFont, color: textColor }}>{edu.degree}</Text>
          {edu.field ? <Text style={{ fontSize: 10, color: alphaHex(textColor, 0.75) }}>{edu.field}</Text> : null}
          {edu.institution ? <Text style={{ fontSize: 10, color, marginTop: 1 }}>{edu.institution}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9, color: mutedColor }}>{dateRange(edu.startDate, edu.endDate)}</Text>
          {edu.grade ? <Text style={{ fontSize: 9, color: mutedColor, marginTop: 1 }}>Note {edu.grade}</Text> : null}
        </View>
      </View>
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

// ─────────────────────────────────────────────────────────────
//  Languages + Certificates
// ─────────────────────────────────────────────────────────────

export function LanguageRow({ lang, textColor = '#1c1c1e' }: { lang: Language; textColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap' }}>
      <Text style={{ fontSize: 10, color: textColor }}>{lang.name}</Text>
      <Text style={{ fontSize: 9, color: alphaHex(textColor, 0.55) }}>{lang.level}</Text>
    </View>
  );
}

export function CertItem({
  cert, textColor = '#1c1c1e', boldFont = 'Helvetica-Bold',
}: {
  cert: Certificate;
  textColor?: string;
  boldFont?: string;
}) {
  return (
    <View style={{ marginBottom: 5 }} wrap={false}>
      <Text style={{ fontSize: 10, fontFamily: boldFont, color: textColor }}>{cert.name}</Text>
      <Text style={{ fontSize: 9, color: alphaHex(textColor, 0.55) }}>
        {cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}
      </Text>
    </View>
  );
}
