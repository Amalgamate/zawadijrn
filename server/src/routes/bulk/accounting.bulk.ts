import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/permissions.middleware';
import { rateLimit } from '../../middleware/enhanced-rateLimit.middleware';
import { auditLog } from '../../middleware/permissions.middleware';
import { PaymentMethod } from '@prisma/client';
import prisma from '../../config/database';
import multer from 'multer';

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
    if (rowNumber === 1) {
      headers = values.map((v: any) => (v == null ? '' : String(v).trim()));
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
 * POST /api/bulk/accounting/expenses/upload
 * Bulk import expenses from an excel/csv sheet
 */
router.post(
  '/expenses/upload',
  upload.single('file'),
  rateLimit({ windowMs: 60_000, maxRequests: 5 }),
  auditLog('BULK_UPLOAD_EXPENSES'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
      }

      const data = await parseWorkbook(req.file.buffer);

      const results = { processed: 0, failed: 0, errors: [] as any[] };

      // Cache existing accounts (expense types) and vendors
      const accountsList = await prisma.account.findMany({ where: { type: 'EXPENSE', isActive: true } });
      const accountsByName = new Map(accountsList.map(a => [a.name.toLowerCase(), a.id]));
      
      const vendorsList = await prisma.vendor.findMany();
      const vendorsByName = new Map(vendorsList.map(v => [v.name.toLowerCase(), v.id]));

      for (const [index, row] of data.entries()) {
        try {
          const dateRaw = row['Date'] ?? row['Expense Date'];
          const descRaw = row['Description'] ?? row['Particulars'];
          const amountRaw = row['Amount'] ?? row['Total'];
          const categoryRaw = row['Category'] ?? row['Account'];
          const vendorRaw = row['Vendor'] ?? row['Payee'];
          const refRaw = row['Reference'] ?? row['Ref No'];
          const methodRaw = row['Method'] ?? row['Payment Method'];

          if (!descRaw || !amountRaw) continue; // Skip empty rows

          const amount = parseFloat(String(amountRaw).replace(/,/g, ''));
          if (isNaN(amount) || amount <= 0) {
            results.errors.push({ row: index + 2, error: `Invalid amount: ${amountRaw}` });
            results.failed++;
            continue;
          }

          // Resolve Account
          let accountId: string | undefined;
          if (categoryRaw) {
            const catLower = String(categoryRaw).toLowerCase();
            accountId = accountsByName.get(catLower);
            
            if (!accountId) {
              // Try to find a partial match
              const match = accountsList.find(a => a.name.toLowerCase().includes(catLower) || catLower.includes(a.name.toLowerCase()));
              if (match) accountId = match.id;
            }
          }
          
          if (!accountId) {
             // Fallback account
             const fallback = accountsList[0]; // Just take the first active expense account
             if (fallback) accountId = fallback.id;
             else {
               results.errors.push({ row: index + 2, error: 'No active expense account found in system' });
               results.failed++;
               continue;
             }
          }

          // Resolve Vendor (Loose matching)
          let vendorId: string | null = null;
          if (vendorRaw) {
            const venLower = String(vendorRaw).toLowerCase();
            vendorId = vendorsByName.get(venLower) ?? null;
            if (!vendorId) {
              const match = vendorsList.find(v => v.name.toLowerCase().includes(venLower) || venLower.includes(v.name.toLowerCase()));
              if (match) vendorId = match.id;
              // If vendor not found, we just allow it to be null, or we could auto-create it (decided: leave null for now config)
            }
          }

          // Resolve Payment Method
          let paymentMethod: PaymentMethod = 'CASH';
          if (methodRaw) {
             const m = String(methodRaw).toUpperCase();
             if (['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CHEQUE', 'CARD', 'OTHER'].includes(m)) {
                 paymentMethod = m as PaymentMethod;
             }
          }

          const expenseDate = dateRaw ? new Date(dateRaw) : new Date();
          
          if (isNaN(expenseDate.getTime())) {
              results.errors.push({ row: index + 2, error: `Invalid date: ${dateRaw}` });
              results.failed++;
              continue;
          }

          await prisma.expense.create({
            data: {
              date: expenseDate,
              amount: amount,
              description: String(descRaw),
              category: categoryRaw ? String(categoryRaw) : 'General',
              accountId,
              vendorId,
              paymentMethod,
              reference: refRaw ? String(refRaw) : undefined,
              status: 'PAID'
            }
          });

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
      console.error('Upload Expenses Error:', error);
      res.status(500).json({ success: false, error: 'Failed to process import', details: error.message });
    }
  }
);

export default router;
