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

      // Set headers for streaming NDJSON
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const results = { updated: 0, created: 0, failed: 0, errors: [] as any[] };

      // [CANCELLATION SUPPORT] Monitor for client disconnect
      let isAborted = false;
      req.on('close', () => {
        if (!res.writableEnded) {
          isAborted = true;
          console.log('[BulkImport] Client disconnected. Aborting balance import...');
        }
      });

      // Helper to send progress
      const sendStatus = (type: string, payload: any) => {
        res.write(JSON.stringify({ type, ...payload }) + '\n');
      };

      // [OPTIMIZATION] 1. Pre-fetch and Cache Accounting Lookups
      sendStatus('info', { message: 'Initializing accounting cache...' });
      try {
        await accountingService.getAccountByCode('1100');
        await accountingService.getAccountByCode('4000');
        await accountingService.getAccountByCode('1200');
        await accountingService.getAccountByCode('1210');
        await accountingService.getAccountByCode('2100');
        await accountingService.getJournalByCode('INV');
        await accountingService.getJournalByCode('CSH1');
      } catch (e) {
        console.warn('[BulkImport-Optimization] Failed to pre-warm accounting cache', e);
      }

      // [OPTIMIZATION] 2. Extract Admission Numbers and Bulk Fetch Learners
      sendStatus('info', { message: 'Loading student records...' });
      const uniqueAdmNos = Array.from(new Set(
        data.map(row => String(row['Adm No'] ?? row['Admission Number'] ?? '').trim()).filter(Boolean)
      ));

      const learners = await prisma.learner.findMany({
        where: { admissionNumber: { in: uniqueAdmNos } }
      });
      const learnerMap = new Map(learners.map(l => [l.admissionNumber, l]));
      const learnerIds = learners.map(l => l.id);

      // [OPTIMIZATION] 3. Pre-fetch existing Invoices
      sendStatus('info', { message: 'Analyzing existing invoices...' });
      const existingInvoices = await prisma.feeInvoice.findMany({
        where: {
          learnerId: { in: learnerIds },
          term: term as Term,
          academicYear: yearInt,
          archived: false
        }
      });
      const invoiceMap = new Map(existingInvoices.map(i => [i.learnerId, i]));

      // [OPTIMIZATION] 4. Pre-fetch Fee Structures
      const distinctGrades = Array.from(new Set(learners.map(l => l.grade)));
      const searchGrades = distinctGrades.map(g => {
        if (g === 'GRADE_10') return 'FORM_1' as any;
        if (g === 'GRADE_11') return 'FORM_2' as any;
        if (g === 'GRADE_12') return 'FORM_3' as any;
        return g;
      });

      const structures = await prisma.feeStructure.findMany({
        where: {
          grade: { in: searchGrades },
          term: term as Term,
          academicYear: yearInt,
          archived: false
        }
      });
      const structureMap = new Map(structures.map(s => [s.grade, s]));

      // [OPTIMIZATION] 5. Pre-fetch existing Payments (Opening Balances)
      const existingPayments = await prisma.feePayment.findMany({
        where: {
          invoiceId: { in: existingInvoices.map(i => i.id) },
          paymentMethod: 'OTHER',
          notes: 'Opening Balance Import'
        }
      });
      const paymentMap = new Map(existingPayments.map(p => [p.invoiceId, p]));

      // 6. Process Main Loop (Now using in-memory lookups)
      const totalRows = data.length;
      sendStatus('start', { total: totalRows });

      for (const [index, row] of data.entries()) {
        if (isAborted) {
          console.log('[BulkImport] Stopping balance loop due to cancellation.');
          break;
        }

        try {
          const admNo = String(row['Adm No'] ?? row['Admission Number'] ?? '').trim();
          if (!admNo || admNo === 'undefined') {
            sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
            continue;
          }

          const billedRaw = row['Billed'] ?? row['Total Amount'];
          const paidRaw = row['Paid'] ?? row['Paid Amount'];
          const balanceRaw = row['Balance'] ?? row['Balances'] ?? row['Outstanding'];

          if (billedRaw == null && paidRaw == null && balanceRaw == null) {
            sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
            continue;
          }

          const billed = parseFloat(String(billedRaw).replace(/,/g, '')) || 0;
          const paid = parseFloat(String(paidRaw).replace(/,/g, '')) || 0;
          const balance = parseFloat(String(balanceRaw).replace(/,/g, '')) || 0;

          const learner = learnerMap.get(admNo);
          if (!learner) {
            results.failed++;
            results.errors.push({ row: index + 3, admNo, error: 'Student not found in registry' });
            sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
            continue;
          }

          let invoice = invoiceMap.get(learner.id);

          if (!invoice) {
            let mappedGrade = learner.grade;
            if (mappedGrade === 'GRADE_10') mappedGrade = 'FORM_1' as any;
            if (mappedGrade === 'GRADE_11') mappedGrade = 'FORM_2' as any;
            if (mappedGrade === 'GRADE_12') mappedGrade = 'FORM_3' as any;

            const structure = structureMap.get(mappedGrade as any);
            if (!structure) {
              results.failed++;
              results.errors.push({ row: index + 3, admNo, error: `No fee structure found for grade ${learner.grade}` });
              sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
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

          // Sync with Accounting Ledger
          try {
            await accountingService.postFeeInvoiceToLedger(invoice);
          } catch (accErr) {
            console.error(`[BulkImport-Accounting] Failed to post invoice ledger: ${admNo}`, accErr);
          }

          if (paid > 0) {
            const existingPayment = paymentMap.get(invoice.id);

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

              try {
                await accountingService.postFeePaymentToLedger(payment, 'OTHER');
              } catch (accErr) {
                console.error(`[BulkImport-Accounting] Failed to post payment ledger: ${admNo}`, accErr);
              }
            }
          }

          // [PROGRESS UPDATE]
          sendStatus('progress', { 
            current: index + 1, 
            total: totalRows, 
            percent: Math.round(((index + 1) / totalRows) * 100) 
          });

        } catch (err: any) {
          results.failed++;
          results.errors.push({ row: index + 3, error: err.message });
          sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
        }
      }

      // [FINAL RESULT]
      sendStatus('complete', {
        summary: { totalRows: data.length, ...results },
        errors: results.errors.slice(0, 50)
      });
      res.end();
    } catch (error: any) {
      console.error('Upload Balances Error:', error);
      // Since we already might have started streaming, this catch might fail to send status code
      res.write(JSON.stringify({ type: 'error', error: 'Failed to process import', details: error.message }) + '\n');
      res.end();
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

      // Set headers for streaming NDJSON
      res.setHeader('Content-Type', 'application/x-ndjson');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const results = { processed: 0, failed: 0, errors: [] as any[] };

      // [CANCELLATION SUPPORT] Monitor for client disconnect
      let isAborted = false;
      req.on('close', () => {
        if (!res.writableEnded) {
          isAborted = true;
          console.log('[BulkImport] Client disconnected. Aborting payment import...');
        }
      });

      // Helper to send progress
      const sendStatus = (type: string, payload: any) => {
        res.write(JSON.stringify({ type, ...payload }) + '\n');
      };

      const totalRows = data.length;
      sendStatus('start', { total: totalRows });

      for (const [index, row] of data.entries()) {
        if (isAborted) {
          console.log('[BulkImport] Stopping payment loop due to cancellation.');
          break;
        }

        try {
          const admNo = String(row['Adm No'] ?? row['Admission Number'] ?? '').trim();
          if (!admNo || admNo === 'undefined') {
             sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
             continue;
          }

          const amountRaw = row['Amount'] ?? row['Paid'];
          const dateRaw = row['Date'] ?? row['Payment Date'];
          const refRaw = row['Reference'] ?? row['Ref No'];
          
          if (!amountRaw) {
             sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
             continue;
          }

          const amount = parseFloat(String(amountRaw).replace(/,/g, ''));
          if (isNaN(amount) || amount <= 0) {
             sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
             continue;
          }

          const learner = await prisma.learner.findUnique({ where: { admissionNumber: admNo } });
          if (!learner) {
            results.failed++;
            results.errors.push({ row: index + 2, admNo, error: 'Student not found' });
            sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
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
            sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
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

          // Sync with Ledger
          try {
             await accountingService.postFeePaymentToLedger(payment, 'OTHER');
          } catch (e) {
             console.error(`Ledger sync failed for payment ${payment.id}`, e);
          }

          results.processed++;
          
          // [PROGRESS UPDATE]
          sendStatus('progress', { 
            current: index + 1, 
            total: totalRows, 
            percent: Math.round(((index + 1) / totalRows) * 100) 
          });

        } catch (err: any) {
          results.failed++;
          results.errors.push({ row: index + 2, error: err.message });
          sendStatus('progress', { current: index + 1, total: totalRows, percent: Math.round(((index + 1) / totalRows) * 100) });
        }
      }

      // [FINAL RESULT]
      sendStatus('complete', {
        summary: { totalRows: data.length, ...results },
        errors: results.errors.slice(0, 50)
      });
      res.end();
    } catch (error: any) {
      console.error('Upload Payments Error:', error);
      res.write(JSON.stringify({ type: 'error', error: 'Failed to process payments', details: error.message }) + '\n');
      res.end();
    }
  }
);

export default router;
