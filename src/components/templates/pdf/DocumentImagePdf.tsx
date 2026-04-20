/**
 * Einzelnes Bild-Dokument (Zeugnis, Portfolio, etc.) als volle A4-Seite
 * im Mappen-Export. PDFs kommen weiter ueber pdf-lib direkt rein (ohne
 * Re-Render), nur Bilder gehen durch diesen Pfad.
 */
import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import type { UploadedDocument } from '../../../types/resume';

const CATEGORY_LABEL: Record<UploadedDocument['category'], string> = {
  certificate: 'Zertifikat',
  reference:   'Zeugnis',
  portfolio:   'Portfolio',
  other:       'Dokument',
};

export default function DocumentImagePdf({ doc }: { doc: UploadedDocument }) {
  return (
    <Document>
      <Page size="A4" style={{ padding: '32pt 40pt', backgroundColor: '#fff', fontFamily: 'Helvetica' }}>
        <View style={{ marginBottom: 12, borderBottom: '0.5pt solid #ddd', paddingBottom: 8 }}>
          <Text style={{ fontSize: 8, letterSpacing: 2, color: '#888', textTransform: 'uppercase' }}>
            {CATEGORY_LABEL[doc.category] ?? 'Dokument'}
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
