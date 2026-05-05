/**
 * Timeline — Berufserfahrung + Ausbildung als echte vertikale Timeline
 * (Akzentlinie mit Punkten links, Inhalte rechts). Fokus-Skills und
 * Sprachen am Ende in einer dichten Pill-Wolke.
 */
import { Document, Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '../../../types/resume';
import { alphaHex, dateRange } from './shared-utils';
import { DescriptionBlock } from './shared';
import { sortWorkExperience, sortEducation } from '../../../lib/sortByDate';

export default function TimelinePdf({ resume }: { resume: Resume }) {
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

  const SectionTitle = ({ children }: { children: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 12 }}>
      <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, color: accent, letterSpacing: 2 }}>
        {children.toUpperCase()}
      </Text>
      <View style={{ flex: 1, height: 0.8, backgroundColor: alphaHex(accent, 0.3), marginLeft: 10 }} />
    </View>
  );

  const TimelineItem = ({ year, title, sub, body }: { year: string; title: string; sub?: string; body?: string }) => (
    <View style={{ flexDirection: 'row', marginBottom: 14 }} wrap={false}>
      {/* Linke Spalte: Jahr + Punkt + vertikale Linie */}
      <View style={{ width: 70, alignItems: 'flex-end', paddingRight: 12 }}>
        <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: accent, marginTop: 1 }}>{year}</Text>
      </View>
      <View style={{ width: 14, alignItems: 'center' }}>
        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: accent, marginTop: 2 }} />
        <View style={{ width: 1.2, flex: 1, backgroundColor: alphaHex(accent, 0.3), marginTop: 2 }} />
      </View>
      <View style={{ flex: 1, paddingLeft: 10, paddingBottom: 4 }}>
        <Text style={{ fontSize: 11.5, fontFamily: 'Helvetica-Bold' }}>{title}</Text>
        {sub ? <Text style={{ fontSize: 10.5, color: accent, marginTop: 1 }}>{sub}</Text> : null}
        <DescriptionBlock text={body} color={accent} textColor="#444" fontSize={10} marginTop={4} />
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Kopf */}
        <View style={styles.headerRow}>
          {info.photo ? <Image src={info.photo} style={styles.photo} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{name}</Text>
            {info.title ? <Text style={{ ...styles.title, color: accent }}>{info.title}</Text> : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 14 }}>
              {contacts.map((c, i) => (
                c.href
                  ? <Link key={i} src={c.href}><Text style={styles.contact}>{c.text}</Text></Link>
                  : <Text key={i} style={styles.contact}>{c.text}</Text>
              ))}
            </View>
          </View>
        </View>

        {info.summary ? <Text style={styles.summary}>{info.summary}</Text> : null}

        {resume.workExperience.length > 0 ? (
          <>
            <SectionTitle>Berufserfahrung</SectionTitle>
            {sortWorkExperience(resume.workExperience).map(job => (
              <TimelineItem
                key={job.id}
                year={dateRange(job.startDate, job.endDate, job.current) || '—'}
                title={job.position}
                sub={[job.company, job.location].filter(Boolean).join(' · ')}
                body={job.description}
              />
            ))}
          </>
        ) : null}

        {resume.education.length > 0 ? (
          <>
            <SectionTitle>Ausbildung</SectionTitle>
            {sortEducation(resume.education).map(edu => (
              <TimelineItem
                key={edu.id}
                year={dateRange(edu.startDate, edu.endDate) || '—'}
                title={edu.degree + (edu.field ? ` · ${edu.field}` : '')}
                sub={[edu.institution, edu.grade ? `Note ${edu.grade}` : ''].filter(Boolean).join(' · ')}
              />
            ))}
          </>
        ) : null}

        {/* Skills als Pills */}
        {resume.skills.length > 0 ? (
          <>
            <SectionTitle>Fähigkeiten</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {resume.skills.map(s => (
                <View key={s.id} style={{
                  paddingVertical: 3, paddingHorizontal: 9,
                  backgroundColor: alphaHex(accent, 0.1),
                  borderWidth: 0.5, borderColor: alphaHex(accent, 0.3), borderStyle: 'solid',
                  borderRadius: 10,
                }}>
                  <Text style={{ fontSize: 9.5, color: accent }}>{s.name}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* Sprachen + Zertifikate nebeneinander */}
        {(resume.languages.length + (resume.certificates?.length ?? 0)) > 0 ? (
          <View style={{ flexDirection: 'row', gap: 28, marginTop: 4 }}>
            {resume.languages.length > 0 ? (
              <View style={{ flex: 1 }}>
                <SectionTitle>Sprachen</SectionTitle>
                {resume.languages.map(l => (
                  <View key={l.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={{ fontSize: 10 }}>{l.name}</Text>
                    <Text style={{ fontSize: 9.5, color: '#6e6e73' }}>{l.level}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {(resume.certificates ?? []).length > 0 ? (
              <View style={{ flex: 1 }}>
                <SectionTitle>Zertifikate</SectionTitle>
                {resume.certificates.map(c => (
                  <View key={c.id} style={{ marginBottom: 4 }} wrap={false}>
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{c.name}</Text>
                    <Text style={{ fontSize: 9.5, color: '#6e6e73' }}>{c.issuer}</Text>
                    {c.url ? (
                      <Link src={c.url} style={{ fontSize: 8.5, color: accent, textDecoration: 'underline', marginTop: 1 }}>
                        {c.url}
                      </Link>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
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
    paddingLeft: 46,
    paddingRight: 46,
    lineHeight: 1.5,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  photo: { width: 70, height: 70, borderRadius: 35, marginRight: 16 },
  name: { fontSize: 26, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5, lineHeight: 1.15 },
  title: { fontSize: 12, marginTop: 5, lineHeight: 1.3 },
  contact: { fontSize: 9, color: '#6e6e73' },
  dot: { fontSize: 9, color: '#c7c7cc', marginHorizontal: 5 },
  summary: { fontSize: 10.5, color: '#444', marginTop: 12, lineHeight: 1.6, fontStyle: 'italic' },
});
