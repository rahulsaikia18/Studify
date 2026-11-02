import { Request, Response } from 'express';
import multer from 'multer';
import { PDFService } from '../services/pdf.service';

// In-memory file buffer processing for complete privacy
export const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported'));
    }
  },
});

export class PDFController {
  static async merge(req: Request, res: Response) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length < 2) {
        return res.status(400).json({ success: false, message: 'Please upload at least 2 PDF files to merge.' });
      }

      const buffers = files.map((f) => f.buffer);
      const mergedBytes = await PDFService.mergePDFs(buffers);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="studify-merged.pdf"');
      return res.send(Buffer.from(mergedBytes));
    } catch (error: any) {
      console.error('PDF merge error:', error);
      return res.status(500).json({ success: false, message: 'Failed to merge PDF files', error: error.message });
    }
  }

  static async split(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF file to split.' });
      }

      let ranges: number[][] | undefined = undefined;
      if (req.body.ranges) {
        try {
          ranges = typeof req.body.ranges === 'string' ? JSON.parse(req.body.ranges) : req.body.ranges;
        } catch {
          ranges = undefined;
        }
      }

      const splitResults = await PDFService.splitPDF(file.buffer, ranges);

      // Return first split document or metadata array
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="studify-split-part1.pdf"');
      return res.send(Buffer.from(splitResults[0]));
    } catch (error: any) {
      console.error('PDF split error:', error);
      return res.status(500).json({ success: false, message: 'Failed to split PDF file', error: error.message });
    }
  }

  static async extract(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
      }

      let pageIndices: number[] = [0];
      if (req.body.pages) {
        try {
          const parsed = typeof req.body.pages === 'string' ? JSON.parse(req.body.pages) : req.body.pages;
          if (Array.isArray(parsed)) {
            pageIndices = parsed.map((p) => Number(p) - 1); // convert 1-based to 0-based
          }
        } catch {
          pageIndices = [0];
        }
      }

      const extractedBytes = await PDFService.extractPages(file.buffer, pageIndices);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="studify-extracted.pdf"');
      return res.send(Buffer.from(extractedBytes));
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to extract PDF pages', error: error.message });
    }
  }

  static async compress(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF file to compress.' });
      }

      const result = await PDFService.compressPDF(file.buffer);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('X-Original-Size', result.originalSize.toString());
      res.setHeader('X-Compressed-Size', result.newSize.toString());
      res.setHeader('X-Saved-Percentage', result.savedPercentage.toString());
      res.setHeader('Content-Disposition', 'attachment; filename="studify-compressed.pdf"');

      return res.send(Buffer.from(result.data));
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to compress PDF', error: error.message });
    }
  }

  static async preview(req: Request, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
      }

      const info = await PDFService.getPDFInfo(file.buffer);
      return res.json({ success: true, data: info });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: 'Failed to read PDF preview', error: error.message });
    }
  }
}
