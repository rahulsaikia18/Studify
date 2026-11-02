import { PDFDocument } from 'pdf-lib';

export class PDFService {
  /**
   * Merge multiple PDF buffers into a single document
   */
  static async mergePDFs(pdfBuffers: Buffer[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const buffer of pdfBuffers) {
      const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  /**
   * Split a PDF into individual pages or page ranges
   */
  static async splitPDF(
    pdfBuffer: Buffer,
    pageRanges?: number[][]
  ): Promise<Uint8Array[]> {
    const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();
    const results: Uint8Array[] = [];

    if (!pageRanges || pageRanges.length === 0) {
      // Split each page individually
      for (let i = 0; i < totalPages; i++) {
        const subDoc = await PDFDocument.create();
        const [page] = await subDoc.copyPages(sourcePdf, [i]);
        subDoc.addPage(page);
        results.push(await subDoc.save());
      }
    } else {
      // Split by custom ranges [[0, 1], [2, 4]]
      for (const range of pageRanges) {
        const subDoc = await PDFDocument.create();
        const validIndices = range.filter((idx) => idx >= 0 && idx < totalPages);
        if (validIndices.length > 0) {
          const pages = await subDoc.copyPages(sourcePdf, validIndices);
          pages.forEach((p) => subDoc.addPage(p));
          results.push(await subDoc.save());
        }
      }
    }

    return results;
  }

  /**
   * Extract specific page indices from PDF
   */
  static async extractPages(pdfBuffer: Buffer, pageIndices: number[]): Promise<Uint8Array> {
    const sourcePdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const newPdf = await PDFDocument.create();
    const totalPages = sourcePdf.getPageCount();

    const validIndices = pageIndices.filter((idx) => idx >= 0 && idx < totalPages);
    const pages = await newPdf.copyPages(sourcePdf, validIndices);
    pages.forEach((p) => newPdf.addPage(p));

    return await newPdf.save();
  }

  /**
   * Optimize / compress PDF by removing unused elements and objects
   */
  static async compressPDF(pdfBuffer: Buffer): Promise<{ data: Uint8Array; originalSize: number; newSize: number; savedPercentage: number }> {
    const originalSize = pdfBuffer.length;
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

    // pdf-lib optimizes structure upon re-saving with useObjectStreams
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    const newSize = compressedBytes.length;
    const savedBytes = Math.max(0, originalSize - newSize);
    const savedPercentage = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

    return {
      data: compressedBytes,
      originalSize,
      newSize,
      savedPercentage,
    };
  }

  /**
   * Get metadata and page count for preview
   */
  static async getPDFInfo(pdfBuffer: Buffer): Promise<{ pageCount: number; title?: string; author?: string; sizeBytes: number }> {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      sizeBytes: pdfBuffer.length,
    };
  }
}
