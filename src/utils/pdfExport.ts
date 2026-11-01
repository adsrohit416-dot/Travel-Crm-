import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  filename?: string;
  onProgress?: (progress: number, statusText: string) => void;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  blobUrl?: string;
  error?: string;
}

/**
 * Direct file download trigger for Blobs.
 * Works across all modern desktop and mobile browsers.
 */
export function downloadBlobToSystem(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    setTimeout(() => {
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 500);
  }
}

/**
 * Fallback 1x1 transparent PNG to prevent external CORS image blocks
 * from interrupting the PDF rendering engine.
 */
const TRANSPARENT_PIXEL_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Main PDF generation and direct system export engine.
 * Uses html-to-image (SVG foreignObject browser engine) which natively supports
 * all modern CSS features including Tailwind CSS v4 oklch(), color-mix(), lab(),
 * high-DPI retina canvas rendering, and multi-page A4 splitting.
 */
export const exportElementToPdf = async (
  elementId: string,
  options?: ExportPdfOptions
): Promise<ExportResult> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found for PDF export.`);
  }

  const filename = options?.filename || 'NorthEastDestinations-Itinerary.pdf';
  options?.onProgress?.(15, 'Preparing document layout & destination imagery...');

  // Scroll to top to ensure accurate coordinates
  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  try {
    // Wait for fonts to ensure exact metric calculations
    if (document.fonts) {
      await document.fonts.ready;
    }

    // Identify all atomic sections and cards to prevent splitting through text
    const containerRect = element.getBoundingClientRect();

    let canvas: HTMLCanvasElement;
    try {
      canvas = await toCanvas(element, {
        quality: 0.98,
        pixelRatio: 2, // High-DPI crisp vector text & photos
        backgroundColor: '#ffffff',
        imagePlaceholder: TRANSPARENT_PIXEL_PLACEHOLDER,
        skipFonts: false, // Keep fonts properly rendered for exact glyph metrics
        filter: (domNode) => {
          if (domNode instanceof HTMLElement) {
            if (domNode.classList.contains('no-print')) {
              return false;
            }
          }
          return true;
        },
      });
    } catch (renderError) {
      console.warn('First render pass with embedded fonts failed, retrying with system fallback fonts:', renderError);
      canvas = await toCanvas(element, {
        quality: 0.95,
        pixelRatio: 1.8,
        backgroundColor: '#ffffff',
        imagePlaceholder: TRANSPARENT_PIXEL_PLACEHOLDER,
        skipFonts: true,
        cacheBust: false,
        filter: (domNode) => {
          if (domNode instanceof HTMLElement && domNode.classList.contains('no-print')) {
            return false;
          }
          return true;
        },
      });
    }

    options?.onProgress?.(55, 'Calculating clean page boundaries & avoiding text breaks...');

    const pdfWidthMm = 210; // A4 standard width
    const pdfPageHeightMm = 297; // A4 standard height

    const pxPerMm = canvas.width / pdfWidthMm;
    const fullPageHeightPx = Math.floor(pdfPageHeightMm * pxPerMm);
    const scaleY = canvas.height / containerRect.height;

    // Collect DOM block elements that should NOT be split across pages
    const atomicBlocks = Array.from(
      element.querySelectorAll<HTMLElement>(
        '[data-pdf-block="true"], .print-avoid-break, .day-card, .border, h3, h4, .shadow-xs'
      )
    );

    const blockBounds = atomicBlocks
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: Math.floor((r.top - containerRect.top) * scaleY),
          bottom: Math.ceil((r.bottom - containerRect.top) * scaleY),
        };
      })
      .filter((b) => b.bottom > b.top && b.bottom <= canvas.height)
      .sort((a, b) => a.top - b.top);

    // Smart Multi-Page Slicing: calculate clean split boundaries
    // Every page has breathing room and will NEVER slice across letters, lines of text, or card borders.
    const pageSlices: { startY: number; endY: number }[] = [];
    let currentY = 0;
    const maxPageHeight = Math.floor(fullPageHeightPx * 0.95); // 95% threshold for clean page bottom padding
    const minPageHeight = Math.floor(fullPageHeightPx * 0.60); // At least 60% full per page

    const canvasCtx = canvas.getContext('2d');

    while (currentY < canvas.height) {
      const remainingHeight = canvas.height - currentY;

      if (remainingHeight <= fullPageHeightPx) {
        // Fits entirely on the final page
        pageSlices.push({ startY: currentY, endY: canvas.height });
        break;
      }

      const targetBottom = currentY + maxPageHeight;
      let splitY = targetBottom;

      // 1. Check if a DOM card or section crosses the target bottom
      const crossingBlock = blockBounds.find(
        (b) => b.top < targetBottom && b.bottom > targetBottom
      );

      if (crossingBlock && crossingBlock.top >= currentY + minPageHeight) {
        // Split cleanly above this block so the entire card starts fresh on next page
        splitY = Math.max(currentY + minPageHeight, crossingBlock.top - Math.floor(10 * (canvas.width / 820)));
      } else if (canvasCtx) {
        // 2. Scan canvas pixel buffer for a white horizontal gap between text lines / paragraphs
        const scanStart = Math.max(currentY + minPageHeight, targetBottom - Math.floor(180 * (canvas.width / 820)));
        const scanEnd = targetBottom;
        let foundWhiteRow = false;

        try {
          const sampleWidth = Math.floor(canvas.width * 0.85);
          const startX = Math.floor(canvas.width * 0.075);

          for (let y = scanEnd; y >= scanStart; y -= 3) {
            const rowData = canvasCtx.getImageData(startX, y, sampleWidth, 1).data;
            let isWhite = true;
            for (let x = 0; x < rowData.length; x += 16) {
              const r = rowData[x];
              const g = rowData[x + 1];
              const b = rowData[x + 2];
              if (r < 248 || g < 248 || b < 248) {
                isWhite = false;
                break;
              }
            }
            if (isWhite) {
              splitY = y;
              foundWhiteRow = true;
              break;
            }
          }
        } catch {
          // If security prevents getImageData, keep targetBottom
        }

        if (!foundWhiteRow && crossingBlock) {
          splitY = crossingBlock.top > currentY + minPageHeight ? crossingBlock.top : targetBottom;
        }
      }

      // Safeguard against zero/infinite loops
      if (splitY <= currentY + minPageHeight) {
        splitY = targetBottom;
      }

      pageSlices.push({ startY: currentY, endY: splitY });
      currentY = splitY;
    }

    options?.onProgress?.(70, `Formatting ${pageSlices.length} clean A4 pages...`);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const totalPages = pageSlices.length;

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const { startY, endY } = pageSlices[pageIndex];
      const sliceHeightPx = endY - startY;

      // Create an individual full A4 canvas for this page to prevent multi-page bleed
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = fullPageHeightPx;
      const pageCtx = pageCanvas.getContext('2d');

      if (pageCtx) {
        // Pure white background
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Draw the exact slice from full canvas without any overlap
        pageCtx.drawImage(
          canvas,
          0,
          startY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        // Quality 0.94 JPEG for crisp text and compact file size
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.94);

        if (pageIndex > 0) {
          pdf.addPage('a4', 'portrait');
        }

        // Draw full A4 page (210mm x 297mm)
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidthMm, pdfPageHeightMm, undefined, 'FAST');
      }

      const progressVal = Math.min(92, 70 + Math.round(((pageIndex + 1) / totalPages) * 22));
      options?.onProgress?.(progressVal, `Processing page ${pageIndex + 1} of ${totalPages}...`);
    }

    options?.onProgress?.(95, 'Finalizing PDF file...');

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Save directly to the user's system
    downloadBlobToSystem(pdfBlob, filename);

    options?.onProgress?.(100, 'PDF Download Complete!');

    return {
      success: true,
      blob: pdfBlob,
      blobUrl,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('PDF generation failure:', err);
    throw new Error(errorMsg);
  } finally {
    window.scrollTo(0, originalScrollY);
  }
};

/**
 * Triggers native system print dialog (Save as PDF).
 * 100% vector, zero blur, native OS print dialog.
 */
export const triggerNativePrint = (): void => {
  window.print();
};

/**
 * Export standalone printable HTML document with embedded styles.
 */
export const exportStandAloneHtml = (elementId: string, filename: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${filename.replace('.html', '').replace('.pdf', '')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; padding: 24px 0; }
    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none !important; }
      @page { size: A4 portrait; margin: 10mm; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="max-width: 850px; margin: 0 auto 16px auto; display: flex; justify-content: flex-end; gap: 8px;">
    <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: #fff; font-weight: bold; border-radius: 8px; border: none; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>
  <div style="max-width: 850px; margin: 0 auto; background: #fff; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden;">
    ${element.innerHTML}
  </div>
</body>
</html>
  `.trim();

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  downloadBlobToSystem(blob, filename.replace('.pdf', '.html'));
};
