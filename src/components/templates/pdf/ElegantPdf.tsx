/**
 * Elegant — klassisches Serif-Layout mit zentriertem Kopfbereich und
 * dezenten Zierlinien. Fuer konservative Branchen (Recht, Finanz, Kultur).
 */
import { Document, Page, View, Text, Link, Image, StyleSheet } from '@react-pdf/renderer';
import type { Resume } from '../../../types/resume';
import { alphaHex, dateRange, formatDate, DescriptionBlock } from './shared';
import { sortWorkExperience, sortEducation } from '../../../lib/sortByDate';

export default function ElegantPdf({ resume }: { resume: Resume }) {
  const info = resume.personalInfo;
  const accent = resume.accentColor || '#1a1a2e';
  const name = [info.firstName, info.lastName].filter(Boolean).join(' ') || 'Ihr Name';

  const contacts: string[] = [];
  if (info.email) contacts.push(info.email);
  if (info.phone) contacts.push(info.phone);
  const addr = [info.street, info.location].filter(Boolean).join(', ');
  if (addr) contacts.push(addr);
  if (info.website) contacts.push(info.website);

  const SH = ({ children }: { children: string }) => (
    <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 10 }}>
      <Text style={{
        fontFamily: 'Times-Bold', fontSize: 11, letterSpacing: 3, color: accent, textTransform: 'uppercase',
      }}>
        {children}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <View style={{ width: 24, height: 0.6, backgroundColor: alphaHex(accent, 0.4) }} />
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: accent, marginHorizontal: 4 }} />
        <View style={{ width: 24, height: 0.6, backgroundColor: alphaHex(accent, 0.4) }} />
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Kopf zentriert */}
        <View style={styles.header}>
          {info.photo ? (
            <Image src={info.photo} style={styles.photo} />
          ) : null}
          <Text style={styles.name}>{name}</Text>
          {info.title ? <Text style={{ ...styles.title, color: accent }}>{info.title}</Text> : null}
          <View style={styles.topRule} />
          <Text style={styles.contacts}>{contacts.join('  ·  ')}</Text>
          {info.linkedin
            ? <Link src={ensureProtocol(info.linkedin)}><Text style={styles.linkLine}>{info.linkedin}</Text></Link>
            : null}
        </View>

        {info.summary ? (
          <Text style={styles.summary}>{info.summary}</Text>
        ) : null}

        {resume.workExperience.length > 0 ? (
          <>
            <SH>Berufserfahrung</SH>
            {sortWorkExperience(resume.workExperience).map(job => (
              <View key={job.id} style={{ marginBottom: 14 }}>
                <View wrap={false} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontFamily: 'Times-Bold', fontSize: 12 }}>{job.position}</Text>
                    {job.company ? <Text style={{ fontSize: 11, color: accent, fontStyle: 'italic' }}>{job.company}{job.location ? `, ${job.location}` : ''}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 10, color: '#555' }}>{dateRange(job.startDate, job.endDate, job.current)}</Text>
                </View>
                <DescriptionBlock text={job.description} color={accent} textColor="#333" fontSize={10.5} />

              </View>
            ))}
          </>
        ) : null}

        {resume.education.length > 0 ? (
          <>
            <SH>Ausbildung</SH>
            {sortEducation(resume.education).map(edu => (
              <View key={edu.id} style={{ marginBottom: 8 }} wrap={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ fontFamily: 'Times-Bold', fontSize: 11 }}>{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</Text>
                    {edu.institution ? <Text style={{ fontSize: 10.5, color: accent, fontStyle: 'italic' }}>{edu.institution}</Text> : null}
                  </View>
                  <Text style={{ fontSize: 10, color: '#555' }}>{dateRange(edu.startDate, edu.endDate)}</Text>
                </View>
              </View>
            ))}
          </>
        ) : null}

        {/* Zweispaltiger Footer: Skills/Sprachen links, Zertifikate rechts */}
        {(resume.skills.length + resume.languages.length + (resume.certificates?.length ?? 0)) > 0 ? (
          <View style={{ flexDirection: 'row', gap: 30, marginTop: 16 }}>
            <View style={{ flex: 1 }}>
              {resume.skills.length > 0 ? (
                <>
                  <SH>Fähigkeiten</SH>
                  <Text style={{ fontSize: 10.5, lineHeight: 1.7, textAlign: 'center' }}>
                    {resume.skills.map(s => s.name).join('  ·  ')}
                  </Text>
                </>
              ) : null}
              {resume.languages.length > 0 ? (
                <>
                  <SH>Sprachen</SH>
                  <View style={{ alignItems: 'center' }}>
                    {resume.languages.map(l => (
                      <Text key={l.id} style={{ fontSize: 10.5, marginBottom: 2 }}>
                        <Text style={{ fontFamily: 'Times-Bold' }}>{l.name}</Text> — {l.level}
                      </Text>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
            {(resume.certificates ?? []).length > 0 ? (
              <View style={{ flex: 1 }}>
                <SH>Zertifikate</SH>
                <View style={{ alignItems: 'center' }}>
                  {resume.certificates.map(c => (
                    <View key={c.id} style={{ marginBottom: 4, alignItems: 'center' }}>
                      <Text style={{ fontSize: 10.5, fontFamily: 'Times-Bold' }}>{c.name}</Text>
                      <Text style={{ fontSize: 10, color: '#555' }}>
                        {c.issuer}{c.date ? ` — ${formatDate(c.date)}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
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
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    color: '#1c1c1e',
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.55,
  },
  header: { alignItems: 'center', marginBottom: 6 },
  photo: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  name: { fontFamily: 'Times-Bold', fontSize: 30, letterSpacing: 1, textAlign: 'center', lineHeight: 1.15 },
  title: { fontSize: 13, marginTop: 6, fontStyle: 'italic', lineHeight: 1.3 },
  topRule: { width: 60, height: 0.6, backgroundColor: '#999', marginTop: 10, marginBottom: 8 },
  contacts: { fontSize: 10, color: '#555', textAlign: 'center' },
  linkLine: { fontSize: 10, color: '#555', marginTop: 2 },
  summary: { fontSize: 11, marginTop: 18, marginBottom: 4, textAlign: 'center', fontStyle: 'italic', color: '#444', lineHeight: 1.7 },
});
