/**
 * Einzelnes Bild-Dokument (Zeugnis, Portfolio, etc.) als volle A4-Seite
 * im Mappen-Export. PDFs kommen weiter ueber pdf-lib direkt rein (ohne
 * Re-Render), nur Bilder gehen durch diesen Pfad.
 */
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import type { UploadedDocument } from '../../../types/resume';
import { tr } from '../../../lib/i18n';

const CATEGORY_LABEL: Record<UploadedDocument['category'], string> = {
  certificate: 'Zertifikat',
  reference:   'Zeugnis',
  portfolio:   'Portfolio',
  other:       'Dokument',
};

export default function DocumentImagePdf({ doc }: { doc: UploadedDocument }) {
  return (
    <Document>
      <Page size="A4" style={{ paddingTop: 32, paddingBottom: 32, paddingLeft: 40, paddingRight: 40, backgroundColor: '#fff', fontFamily: 'Helvetica' }}>
        <View style={{ marginBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#ddd', borderBottomStyle: 'solid', paddingBottom: 8 }}>
          <Text style={{ fontSize: 8, letterSpacing: 2, color: '#888', textTransform: 'uppercase' }}>
            {tr(CATEGORY_LABEL[doc.category] ?? 'Dokument')}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 3, color: '#111' }}>{doc.name}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image src={doc.dataUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </View>
      </Page>
    </Document>
  );
}
