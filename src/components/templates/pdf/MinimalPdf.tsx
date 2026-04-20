/**
 * Minimal-Template als @react-pdf/renderer-Dokument.
 * Portierung von src/components/templates/renders/MinimalTemplate.tsx:
 * gleiche Struktur und Farbakzente, aber echte Vektorprimitive — der Text
 * ist im exportierten PDF selektierbar, E-Mail/Web-Felder sind klickbar.
 *
 * Einheit: Punkte (72 pt = 1 inch). A4 = 595 x 842 pt. Rand ~40 pt.
 */
import { Document, Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '../../../types/resume';
import {
  SectionHeading, WorkEntry, EduEntry, SkillBar, LanguageRow, CertItem, alphaHex,
} from './shared';

export default function MinimalPdf({ resume }: { resume: Resume }) {
  const info = resume.personalInfo;
  const color = resume.accentColor || '#007AFF';
  const name = [info.firstName, info.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  const contactParts: Array<{ text: string; href?: string }> = [];
  if (info.email) contactParts.push({ text: info.email, href: `mailto:${info.email}` });
  if (info.phone) contactParts.push({ text: info.phone, href: `tel:${info.phone.replace(/\s/g, '')}` });
  const addr = [info.street, info.location].filter(Boolean).join(', ');
  if (addr) contactParts.push({ text: addr });
  if (info.website) contactParts.push({ text: info.website, href: ensureProtocol(info.website) });
  if (info.linkedin) contactParts.push({ text: info.linkedin, href: ensureProtocol(info.linkedin) });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {info.photo ? <Image src={info.photo} style={styles.photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            {info.title ? <Text style={{ ...styles.title, color }}>{info.title}</Text> : null}
            <View style={styles.contactRow}>
              {contactParts.map((c, i) => {
                const node = c.href
                  ? <Link src={c.href} style={styles.contact}>{c.text}</Link>
                  : <Text style={styles.contact}>{c.text}</Text>;
                return (
                  <View key={i} style={{ flexDirection: 'row' }}>
                    {i > 0 ? <Text style={styles.contactSep}>·</Text> : null}
                    {node}
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        {info.summary ? (
          <Text style={{ ...styles.summary, borderLeftColor: color }}>{info.summary}</Text>
        ) : null}

        <View style={styles.columns}>
          {/* Main column */}
          <View style={styles.mainCol}>
            {resume.workExperience.length > 0 ? (
              <View style={{ marginBottom: 14 }}>
                <SectionHeading color={color}>Berufserfahrung</SectionHeading>
                {resume.workExperience.map(job => (
                  <WorkEntry key={job.id} job={job} color={color} />
                ))}
              </View>
            ) : null}

            {resume.education.length > 0 ? (
              <View>
                <SectionHeading color={color}>Ausbildung</SectionHeading>
                {resume.education.map(edu => (
                  <EduEntry key={edu.id} edu={edu} color={color} />
                ))}
              </View>
            ) : null}
          </View>

          {/* Side column */}
          <View style={styles.sideCol}>
            {resume.skills.length > 0 ? (
              <View style={{ marginBottom: 14 }}>
                <SectionHeading color={color}>Faehigkeiten</SectionHeading>
                {resume.skills.map(s => <SkillBar key={s.id} skill={s} color={color} />)}
              </View>
            ) : null}

            {resume.languages.length > 0 ? (
              <View style={{ marginBottom: 14 }}>
                <SectionHeading color={color}>Sprachen</SectionHeading>
                {resume.languages.map(l => <LanguageRow key={l.id} lang={l} />)}
              </View>
            ) : null}

            {(resume.certificates ?? []).length > 0 ? (
              <View>
                <SectionHeading color={color}>Zertifikate</SectionHeading>
                {resume.certificates.map(c => <CertItem key={c.id} cert={c} />)}
              </View>
            ) : null}
          </View>
        </View>

        {/* Footer: unsichtbar im Druck, hilft Screenreadern/Accessibility */}
        <View style={{ marginTop: 'auto', paddingTop: 10, borderTopWidth: 0.5, borderTopStyle: 'solid', borderTopColor: alphaHex(color, 0.15) }}>
          <Text style={{ fontSize: 7, color: '#bbb', textAlign: 'center' }}>
            Erstellt mit PATH — path.pixmatic.ch
          </Text>
        </View>
      </Page>
    </Document>
  );
}

function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (/^(www\.|linkedin|github)/i.test(url)) return `https://${url}`;
  return url;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1c1c1e',
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 46,
    paddingRight: 46,
    lineHeight: 1.5,
  },
  headerRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 8 },
  photo: { width: 60, height: 60, borderRadius: 4, objectFit: 'cover' },
  name: { fontSize: 22, fontWeight: 800, letterSpacing: -0.6, marginBottom: 2 },
  title: { fontSize: 11, fontWeight: 500, marginBottom: 6 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  contact: { fontSize: 9, color: '#6e6e73' },
  contactSep: { fontSize: 9, color: '#c7c7cc', marginHorizontal: 4 },
  summary: {
    marginTop: 10, marginBottom: 16, paddingLeft: 10, borderLeftWidth: 2,
    fontSize: 10, color: '#444', lineHeight: 1.6,
  },
  columns: { flexDirection: 'row', gap: 22 },
  mainCol: { flex: 1 },
  sideCol: { width: 150 },
});
