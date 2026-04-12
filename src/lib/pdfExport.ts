/**
 * Renders an HTML element to a multi-page A4 PDF using html2canvas + jsPDF.
 * Shared between Preview.tsx (app) and SharedResumePage.tsx (public share link).
 */
export async function renderElementToPdfDoc(
  element: HTMLElement,
  quality = 0.92,
): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  await document.fonts.ready;

  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    position: 'absolute', left: '-9999px', top: '0',
    width: '794px', overflow: 'visible', pointerEvents: 'none', zIndex: '-1',
  });
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.transform = 'none';
  clone.style.width = '794px';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);
  void wrapper.offsetHeight;

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(clone, {
      scale: 2, useCORS: true, allowTaint: true,
      backgroundColor: '#ffffff', width: 794, logging: false,
    });
  } finally {
    document.body.removeChild(wrapper);
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const pxPerMm = canvas.width / pdfW;
  const pageHeightPx = pdfH * pxPerMm;

  function findContentHeight(): number {
    const ctx = canvas.getContext('2d')!;
    for (let y = canvas.height - 1; y > 0; y--) {
      const { data } = ctx.getImageData(0, y, canvas.width, 1);
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return y + 1;
      }
    }
    return canvas.height;
  }

  function findBreakPoint(targetY: number, limit: number): number {
    const ctx = canvas.getContext('2d')!;
    const searchPx = Math.round(pageHeightPx * 0.08);
    const start = Math.min(Math.round(targetY), limit - 1);
    for (let y = start; y > start - searchPx; y--) {
      if (y <= 0) break;
      const { data } = ctx.getImageData(0, y, canvas.width, 1);
      let dark = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) dark++;
      }
      if (dark < canvas.width * 0.03) return y;
    }
    return start;
  }

  const contentHeight = findContentHeight();
  let srcY = 0;
  let pageCount = 0;

  while (srcY < contentHeight) {
    if (pageCount > 0) pdf.addPage();
    const isLastPage = srcY + pageHeightPx >= contentHeight;
    const breakY = isLastPage ? contentHeight : findBreakPoint(srcY + pageHeightPx, contentHeight);
    const srcH = Math.round(breakY - srcY);
    if (srcH <= 0) break;

    const pg = document.createElement('canvas');
    pg.width = canvas.width;
    pg.height = srcH;
    pg.getContext('2d')!.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
    const imgH = srcH / pxPerMm;
    pdf.addImage(pg.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, pdfW, imgH);

    srcY = Math.round(breakY);
    pageCount++;
  }

  return { pdfBytes: pdf.output('arraybuffer') as unknown as Uint8Array, pageCount };
}
