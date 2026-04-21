/**
 * Minimal — maximal reduziert, viel Weissraum, schlanke Typografie.
 * Single-Column mit Sidebar-Sektion rechts.
 */
import { Document, Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '../../../types/resume';
import {
  Section, WorkEntry, EduEntry, SkillBar, LanguageRow, CertItem, DescriptionBlock,
} from './shared';
import { sortWorkExperience, sortEducation } from '../../../lib/sortByDate';

export default function MinimalPdf({ resume }: { resume: Resume }) {
  const info = resume.personalInfo;
  const accent = resume.accentColor || '#007AFF';
  const name = [info.firstName, info.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  const contacts: Array<{ text: string; href?: string }> = [];
  if (info.email) contacts.push({ text: info.email, href: `mailto:${info.email}` });
  if (info.phone) contacts.push({ text: info.phone, href: `tel:${info.phone.replace(/\s/g, '')}` });
  const addr = [info.street, info.location].filter(Boolean).join(', ');
  if (addr) contacts.push({ text: addr });
  if (info.website) contacts.push({ text: info.website, href: ensureProtocol(info.website) });
  if (info.linkedin) contacts.push({ text: info.linkedin, href: ensureProtocol(info.linkedin) });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          {info.photo ? <Image src={info.photo} style={styles.photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            {info.title ? <Text style={{ ...styles.title, color: accent }}>{info.title}</Text> : null}
            <View style={styles.contactRow}>
              {contacts.map((c, i) => (
                c.href
                  ? <Link key={i} src={c.href}><Text style={styles.contact}>{c.text}</Text></Link>
                  : <Text key={i} style={styles.contact}>{c.text}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Accent divider */}
        <View style={{ height: 1.2, backgroundColor: accent, marginBottom: 18 }} />

        {info.summary ? (
          <Text style={styles.summary}>{info.summary}</Text>
        ) : null}

        {/* Two columns: main (wider) + side */}
        <View style={styles.columns}>
          <View style={styles.mainCol}>
            {resume.workExperience.length > 0 ? (
              <Section title="Berufserfahrung" color={accent} kind="line">
                {sortWorkExperience(resume.workExperience).map(job => (
                  <WorkEntry key={job.id} job={job} color={accent} />
                ))}
              </Section>
            ) : null}

            {resume.education.length > 0 ? (
              <Section title="Ausbildung" color={accent} kind="line">
                {sortEducation(resume.education).map(edu => (
                  <EduEntry key={edu.id} edu={edu} color={accent} />
                ))}
              </Section>
            ) : null}

            {(resume.projects ?? []).length > 0 ? (
              <Section title="Projekte" color={accent} kind="line">
                {resume.projects.map(p => (
                  <View key={p.id} wrap={false} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 10.5, fontFamily: 'Helvetica-Bold' }}>{p.name}</Text>
                    <DescriptionBlock text={p.description} color={accent} fontSize={10} marginTop={2} />
                  </View>
                ))}
              </Section>
            ) : null}
          </View>

          <View style={styles.sideCol}>
            {resume.skills.length > 0 ? (
              <Section title="Fähigkeiten" color={accent} kind="line">
                {resume.skills.map(s => <SkillBar key={s.id} skill={s} color={accent} />)}
              </Section>
            ) : null}
            {resume.languages.length > 0 ? (
              <Section title="Sprachen" color={accent} kind="line">
                {resume.languages.map(l => <LanguageRow key={l.id} lang={l} />)}
              </Section>
            ) : null}
            {(resume.certificates ?? []).length > 0 ? (
              <Section title="Zertifikate" color={accent} kind="line">
                {resume.certificates.map(c => <CertItem key={c.id} cert={c} />)}
              </Section>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

function ensureProtocol(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/+/, '')}`;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1c1c1e',
    paddingTop: 44,
    paddingBottom: 44,
    paddingLeft: 50,
    paddingRight: 50,
    lineHeight: 1.55,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  photo: { width: 72, height: 72, borderRadius: 4, marginRight: 18 },
  // lineHeight explizit, weil @react-pdf sonst die Page-lineHeight von 1.55
  // erbt und bei grossem fontSize Title ueber den Namen drueberklappt.
  name: { fontSize: 28, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5, color: '#1c1c1e', lineHeight: 1.15 },
  title: { fontSize: 12, marginTop: 6, lineHeight: 1.3 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 14 },
  contact: { fontSize: 9, color: '#6e6e73' },
  summary: { fontSize: 10.5, color: '#444', marginBottom: 16, lineHeight: 1.65, fontStyle: 'italic' },
  columns: { flexDirection: 'row', gap: 26 },
  mainCol: { flex: 1 },
  sideCol: { width: 150 },
});
