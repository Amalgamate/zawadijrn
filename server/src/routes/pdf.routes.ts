/**
 * PDF Routes
 * Legacy server-side PDF endpoints retained as authenticated 501 responses.
 * POST /api/pdf/generate  →  { html, options }  →  returns PDF binary
 */

import express, { Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth.middleware';
import { pdfService } from '../services/pdf.service';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = express.Router();

/**
 * POST /api/pdf/generate
 * Body: { html: string, options?: { format?, printBackground?, margin? } }
 * Returns: application/pdf binary stream
 */
router.post(
  '/generate',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }), // 30 PDFs/min per user
  async (req: AuthRequest, res: Response) => {
    try {
      const { html, options = {} } = req.body;

      if (!html || typeof html !== 'string') {
        return res.status(400).json({ success: false, message: 'html field is required and must be a string' });
      }

      if (html.length > 5_000_000) { // 5 MB HTML cap
        return res.status(413).json({ success: false, message: 'HTML payload too large (max 5 MB)' });
      }

      const pdfBuffer = await pdfService.generatePdf(html, {
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        ...options,
      });

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="report.pdf"',
        'Content-Length': pdfBuffer.length,
        'Cache-Control': 'no-store',
      });

      return res.end(pdfBuffer);
    } catch (err: any) {
      console.error('[PDF Route] Generation error:', err);
      return res.status(500).json({ success: false, message: err.message || 'PDF generation failed' });
    }
  }
);

router.post(
  '/screenshot',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { html, options = {} } = req.body;

      if (!html || typeof html !== 'string') {
        return res.status(400).json({ success: false, message: 'html field is required and must be a string' });
      }

      if (html.length > 5_000_000) {
        return res.status(413).json({ success: false, message: 'HTML payload too large (max 5 MB)' });
      }

      const imageBuffer = await pdfService.generateScreenshot(html, options);

      res.set({
        'Content-Type': options?.type === 'png' ? 'image/png' : 'image/jpeg',
        'Content-Disposition': `attachment; filename="report.${options?.type === 'png' ? 'png' : 'jpg'}"`,
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'no-store',
      });

      return res.end(imageBuffer);
    } catch (err: any) {
      console.error('[PDF Screenshot Route] Generation error:', err);
      return res.status(500).json({ success: false, message: err.message || 'Screenshot generation failed' });
    }
  }
);

export default router;
