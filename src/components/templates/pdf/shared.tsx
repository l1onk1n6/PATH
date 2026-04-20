/**
 * Shared @react-pdf/renderer-Primitive und Formatter fuer die PDF-Templates.
 * Ziel: selektierbarer Vektortext, klickbare Links, 3-5x kleinere Dateien
 * gegenueber dem bisherigen html2canvas-pro-Raster-Ansatz.
 */
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type { WorkExperience, Education, Skill, Language, Certificate } from '../../../types/resume';

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

/** Alpha-Hex Helper: erzeugt #RRGGBBAA aus einem Basisfarb-#RRGGBB und 0..1. */
export function alphaHex(hex: string, alpha: number) {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** Abschnittsueberschrift mit Linie (klassischer Minimal-Look). */
export function SectionHeading({ color, children, style }: { color: string; children: string; style?: Style }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, ...style }}>
      <Text style={{ fontSize: 8, fontWeight: 700, color, letterSpacing: 1.6, textTransform: 'uppercase' }}>{children}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: alphaHex(color, 0.2), marginLeft: 8 }} />
    </View>
  );
}

export function WorkEntry({ job, color }: { job: WorkExperience; color: string }) {
  return (
    <View style={styles.entry} wrap={false}>
      <View style={styles.entryHeader}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>
            {job.position}
            {job.company ? <Text style={{ fontWeight: 600, color }}> · {job.company}</Text> : null}
          </Text>
          {job.location ? <Text style={styles.meta}>{job.location}</Text> : null}
        </View>
        <Text style={styles.dateRight}>{dateRange(job.startDate, job.endDate, job.current)}</Text>
      </View>
      {job.description ? <Text style={styles.body}>{job.description}</Text> : null}
    </View>
  );
}

export function EduEntry({ edu, color }: { edu: Education; color: string }) {
  return (
    <View style={styles.entry} wrap={false}>
      <View style={styles.entryHeader}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, fontWeight: 700 }}>
            {edu.degree}
            {edu.field ? <Text style={{ fontWeight: 400, color: '#555' }}> – {edu.field}</Text> : null}
          </Text>
          {edu.institution ? <Text style={{ fontSize: 10, color, fontWeight: 600 }}>{edu.institution}</Text> : null}
          {edu.grade ? <Text style={styles.meta}>Note: {edu.grade}</Text> : null}
        </View>
        <Text style={styles.dateRight}>{dateRange(edu.startDate, edu.endDate)}</Text>
      </View>
    </View>
  );
}

export function SkillBar({ skill, color }: { skill: Skill; color: string }) {
  return (
    <View style={{ marginBottom: 5 }}>
      <Text style={{ fontSize: 10, marginBottom: 2 }}>{skill.name}</Text>
      <View style={{ height: 3, backgroundColor: '#f0f0f0', borderRadius: 2 }}>
        <View style={{ height: 3, width: `${skill.level * 20}%`, backgroundColor: color, borderRadius: 2 }} />
      </View>
    </View>
  );
}

export function LanguageRow({ lang }: { lang: Language }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap' }}>
      <Text style={{ fontSize: 10, fontWeight: 500 }}>{lang.name}</Text>
      <Text style={{ fontSize: 9, color: '#8e8e93' }}>{lang.level}</Text>
    </View>
  );
}

export function CertItem({ cert }: { cert: Certificate }) {
  return (
    <View style={{ marginBottom: 5 }} wrap={false}>
      <Text style={{ fontSize: 10, fontWeight: 600 }}>{cert.name}</Text>
      <Text style={{ fontSize: 9, color: '#8e8e93' }}>
        {cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  entry: { marginBottom: 10 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  dateRight: { fontSize: 9, color: '#8e8e93', marginLeft: 8 },
  meta: { fontSize: 9, color: '#8e8e93', marginTop: 1 },
  body: { fontSize: 10, color: '#444', marginTop: 3, lineHeight: 1.5 },
});
