import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/permissions.middleware';
import { rateLimit } from '../../middleware/enhanced-rateLimit.middleware';
import { auditLog } from '../../middleware/permissions.middleware';
import { Term, PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '../../config/database';
import multer from 'multer';
import { accountingService } from '../../services/accounting.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExcelJS: typeof import('exceljs') = require('exceljs');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function parseWorkbook(buffer: Buffer): Promise<Record<string, any>[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);

  const ws = wb.worksheets[0];
  if (!ws) return [];

  const rows: Record<string, any>[] = [];
  let headers: string[] = [];

  ws.eachRow((row: import('exceljs').Row, rowNumber: number) => {
    const values = (row.values as any[]).slice(1);
    if (rowNumber === 1 || rowNumber === 2) {
      if (headers.length === 0 || values.includes('Adm No') || values.includes('Admission Number')) {
        headers = values.map((v: any) => (v == null ? '' : String(v).trim()));
      }
    } else {
      const obj: Record<string, any> = {};
      headers.forEach((h: string, i: number) => {
        const cell = values[i];
        obj[h] = cell && typeof cell === 'object' && 'richText' in cell
          ? cell.richText.map((r: any) => r.text).join('')
          : cell ?? null;
      });
      rows.push(obj);
    }
  });

  return rows;
}

/**
 * POST /api/bulk/fees/upload-balances
 * Import Opening Balances (Cumulative Billed/Paid/Balance)
 */
router.post(
  '/upload-balances',
  upload.single('file'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('BULK_UPLOAD_FEE_BALANCES'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const { academicYear, term } = req.body;
      if (!academicYear || !term) {
        return res.status(400).json({ success: false, error: 'Academic year and term are required' });
      }

      const yearInt = parseInt(academicYear);
      const data = await parseWorkbook(req.file.buffer);

      const results = { updated: 0, created: 0, failed: 0, errors: [] as any[] };

      for (const [index, row] of data.entries()) {
        try {
          const admNo = String(row['Adm No'] ?? row['Admission Number'] ?? '').trim();
          if (!admNo || admNo === 'undefined') continue; // Skip empty rows

          const billedRaw = row['Billed'] ?? row['Total Amount'];
          const paidRaw = row['Paid'] ?? row['Paid Amount'];
          const balanceRaw = row['Balance'] ?? row['Balances'] ?? row['Outstanding'];

          if (billedRaw == null && paidRaw == null && balanceRaw == null) {
            continue;
          }

          const billed = parseFloat(String(billedRaw).replace(/,/g, '')) || 0;
          const paid = parseFloat(String(paidRaw).replace(/,/g, '')) || 0;
          const balance = parseFloat(String(balanceRaw).replace(/,/g, '')) || 0;

          const learner = await prisma.learner.findUnique({
            where: { admissionNumber: admNo }
          });

          if (!learner) {
            results.failed++;
            results.errors.push({ row: index + 3, admNo, error: 'Student not found' });
            continue;
          }

          // 1. Get or Create FeeInvoice for current term
          let invoice = await prisma.feeInvoice.findFirst({
            where: { learnerId: learner.id, term: term as Term, academicYear: yearInt, archived: false }
          });

          if (!invoice) {
            let mappedGrade = learner.grade;
            if (mappedGrade === 'GRADE_10') mappedGrade = 'FORM_1' as any;
            if (mappedGrade === 'GRADE_11') mappedGrade = 'FORM_2' as any;
            if (mappedGrade === 'GRADE_12') mappedGrade = 'FORM_3' as any;

            // Find appropriate fee structure
            const structure = await prisma.feeStructure.findFirst({
              where: { grade: mappedGrade as any, term: term as Term, academicYear: yearInt, archived: false }
            });

            if (!structure) {
              results.failed++;
              results.errors.push({ row: index + 3, admNo, error: `No fee structure found for grade ${learner.grade}` });
              continue;
            }

            invoice = await prisma.feeInvoice.create({
              data: {
                invoiceNumber: `INV-${admNo}-${term}-${Date.now().toString().slice(-4)}`,
                learnerId: learner.id,
                feeStructureId: structure.id,
                term: term as Term,
                academicYear: yearInt,
                dueDate: new Date(),
                totalAmount: billed,
                paidAmount: paid,
                balance: balance,
                status: balance < 0 ? 'OVERPAID' : balance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING',
                issuedBy: req.user!.userId
              }
            });
            results.created++;
          } else {
            // Update existing invoice
            invoice = await prisma.feeInvoice.update({
              where: { id: invoice.id },
              data: {
                totalAmount: billed,
                paidAmount: paid,
                balance: balance,
                status: balance < 0 ? 'OVERPAID' : balance === 0 ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING'
              }
            });
            results.updated++;
          }

          // 1.5 Sync with Accounting Ledger
          try {
            await accountingService.postFeeInvoiceToLedger(invoice);
          } catch (accErr) {
            console.error(`[BulkImport-Accounting] Failed to post invoice ledger: ${admNo}`, accErr);
          }

          // 2. If paid > 0, make sure there's an Opening Balance payment record
          if (paid > 0) {
            const existingPayment = await prisma.feePayment.findFirst({
              where: { invoiceId: invoice.id, paymentMethod: 'OTHER', notes: 'Opening Balance Import' }
            });

            if (existingPayment) {
              await prisma.feePayment.update({
                where: { id: existingPayment.id },
                data: { amount: paid }
              });
            } else {
              const payment = await prisma.feePayment.create({
                data: {
                  receiptNumber: `REC-${admNo}-OB-${Date.now().toString().slice(-4)}`,
                  invoiceId: invoice.id,
                  amount: paid,
                  paymentMethod: 'OTHER',
                  notes: 'Opening Balance Import',
                  paymentDate: new Date(),
                  recordedBy: req.user!.userId
                }
              });

              // Sync Payment with Accounting
              try {
                await accountingService.postFeePaymentToLedger(payment, 'OTHER');
              } catch (accErr) {
                console.error(`[BulkImport-Accounting] Failed to post payment ledger: ${admNo}`, accErr);
              }
            }
          }
        } catch (err: any) {
          results.failed++;
          results.errors.push({ row: index + 3, error: err.message });
        }
      }

      res.json({
        success: true,
        summary: { totalRows: data.length, ...results },
        errors: results.errors.slice(0, 50)
      });
    } catch (error: any) {
      console.error('Upload Balances Error:', error);
      res.status(500).json({ success: false, error: 'Failed to process import', details: error.message });
    }
  }
);

/**
 * POST /api/bulk/fees/upload-payments
 * Import Daily Bank Payments (Transaction rows)
 */
router.post(
  '/upload-payments',
  upload.single('file'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('BULK_UPLOAD_FEE_PAYMENTS'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      // Expected columns: Adm No, Date, Amount, Reference, Method
      const { academicYear, term } = req.body;
      const data = await parseWorkbook(req.file.buffer);

      const results = { processed: 0, failed: 0, errors: [] as any[] };

      for (const [index, row] of data.entries()) {
        try {
          const admNo = String(row['Adm No'] ?? row['Admission Number'] ?? '').trim();
          if (!admNo || admNo === 'undefined') continue;

          const amountRaw = row['Amount'] ?? row['Paid'];
          const dateRaw = row['Date'] ?? row['Payment Date'];
          const refRaw = row['Reference'] ?? row['Ref No'];
          
          if (!amountRaw) continue;

          const amount = parseFloat(String(amountRaw).replace(/,/g, ''));
          if (isNaN(amount) || amount <= 0) continue;

          const learner = await prisma.learner.findUnique({ where: { admissionNumber: admNo } });
          if (!learner) {
            results.failed++;
            results.errors.push({ row: index + 2, admNo, error: 'Student not found' });
            continue;
          }

          // Use active invoice
          const invoice = await prisma.feeInvoice.findFirst({
            where: { learnerId: learner.id, term: term as Term, academicYear: parseInt(academicYear), archived: false },
            orderBy: { createdAt: 'desc' }
          });

          if (!invoice) {
            results.failed++;
            results.errors.push({ row: index + 2, admNo, error: `No active invoice for ${term} found` });
            continue;
          }

          // Generate a unique receipt number
          const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
          const receiptNumber = `RCP-${Date.now().toString().slice(-4)}${randStr}`;

          // Create payment
          const payment = await prisma.$transaction(async (tx) => {
            const createdPayment = await tx.feePayment.create({
              data: {
                receiptNumber,
                invoiceId: invoice.id,
                amount: amount,
                paymentMethod: 'CASH', // default to cash if mapping isn't precise
                referenceNumber: refRaw ? String(refRaw) : undefined,
                paymentDate: dateRaw ? new Date(dateRaw) : new Date(),
                notes: 'Bulk imported payment',
                recordedBy: req.user!.userId
              }
            });

            const newPaid = Number(invoice.paidAmount) + amount;
            const newBalance = Number(invoice.totalAmount) - newPaid;

            await tx.feeInvoice.update({
              where: { id: invoice.id },
              data: {
                paidAmount: newPaid,
                balance: newBalance,
                status: newBalance <= 0 ? 'PAID' : 'PARTIAL'
              }
            });

            return createdPayment;
          });

          // Sync Daily Payment with Accounting
          try {
            await accountingService.postFeePaymentToLedger(payment, 'CASH');
          } catch (accErr) {
            console.error(`[BulkPayment-Accounting] Failed to post payment ledger: ${admNo}`, accErr);
          }

          results.processed++;
        } catch (err: any) {
          results.failed++;
          results.errors.push({ row: index + 2, error: err.message });
        }
      }

      res.json({
        success: true,
        summary: { totalRows: data.length, ...results },
        errors: results.errors.slice(0, 50)
      });
    } catch (error: any) {
      console.error('Upload Payments Error:', error);
      res.status(500).json({ success: false, error: 'Failed to process import', details: error.message });
    }
  }
);

export default router;
