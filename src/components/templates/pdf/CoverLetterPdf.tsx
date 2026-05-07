/**
 * Anschreiben als Vektor-PDF (@react-pdf/renderer).
 * Deutsches Geschaeftsbrief-Layout: Absender rechts oben, Empfaenger links,
 * Datum rechts, Betreff fett, Fliesstext, Gruss + Name.
 *
 * Wichtig vs. dem HTML-Vorlaeufer in Preview.tsx:
 * - Text bleibt selektierbar & copy-paste-bar.
 * - E-Mail / Telefon im Absenderblock werden zu klickbaren Links.
 * - Seitenumbruch passiert automatisch durch @react-pdf, keine harte
 *   Seite-2-Markierung im PDF noetig.
 */
import { Document, Page, View, Text, Link } from '@react-pdf/renderer';
import type { Resume } from '../../../types/resume';
import { tr } from '../../../lib/i18n';

interface Props { resume: Resume }

export default function CoverLetterPdf({ resume }: Props) {
  const cl = resume.coverLetter ?? { recipient: '', subject: '', body: '', closing: 'Mit freundlichen Grüssen' };
  const pi = resume.personalInfo;
  const senderName = [pi.firstName, pi.lastName].filter(Boolean).join(' ');
  const dateStr = new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' });
  const locDate = pi.location ? `${pi.location}, ${dateStr}` : dateStr;

  // Empfaenger: leere Zeilen (z. B. fehlender Ansprechpartner) rausfiltern
  const recipientLines = (cl.recipient ?? '').split('\n').map(l => l.trim()).filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sender top-right */}
        <View style={styles.sender}>
          {senderName ? <Text style={styles.senderName}>{senderName}</Text> : null}
          {pi.title ? <Text>{pi.title}</Text> : null}
          {pi.location ? <Text>{pi.location}</Text> : null}
          {pi.email ? <Link src={`mailto:${pi.email}`}><Text style={styles.senderLink}>{pi.email}</Text></Link> : null}
          {pi.phone ? <Link src={`tel:${pi.phone.replace(/\s/g, '')}`}><Text style={styles.senderLink}>{pi.phone}</Text></Link> : null}
        </View>

        {/* Recipient */}
        {recipientLines.length > 0 ? (
          <View style={styles.recipient}>
            {recipientLines.map((l, i) => <Text key={i}>{l}</Text>)}
          </View>
        ) : null}

        {/* Date */}
        <View style={styles.dateRow}>
          <Text style={styles.dateText}>{locDate}</Text>
        </View>

        {/* Subject */}
        {cl.subject ? <Text style={styles.subject}>{cl.subject}</Text> : null}

        {/* Body */}
        {cl.body ? <Text style={styles.body}>{cl.body}</Text> : <Text style={styles.bodyEmpty}>{tr('Kein Anschreiben-Text vorhanden.')}</Text>}

        {/* Closing */}
        <View style={styles.closingBlock}>
          <Text>{cl.closing || 'Mit freundlichen Grüssen'}</Text>
          {senderName ? <Text style={styles.closingName}>{senderName}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}

const styles = {
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: '#111',
    paddingTop: 50,
    paddingLeft: 55,
    paddingRight: 55,
    paddingBottom: 45,
    lineHeight: 1.55,
  },
  sender: {
    textAlign: 'right' as const,
    marginBottom: 28,
    fontSize: 10,
    color: '#555',
  },
  senderName: { fontFamily: 'Times-Bold', fontSize: 12, color: '#111' },
  senderLink: { fontSize: 10, color: '#555' },
  recipient: { marginBottom: 22, fontSize: 11 },
  dateRow: { marginBottom: 20, alignItems: 'flex-end' as const },
  dateText: { fontSize: 10, color: '#555' },
  subject: { fontFamily: 'Times-Bold', fontSize: 12, marginBottom: 16 },
  body: { fontSize: 11, marginBottom: 28, lineHeight: 1.65 },
  bodyEmpty: { fontSize: 11, color: '#aaa', marginBottom: 28 },
  closingBlock: { marginTop: 10 },
  closingName: { fontFamily: 'Times-Bold', marginTop: 32 },
};
