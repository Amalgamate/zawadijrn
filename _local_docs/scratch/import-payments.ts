import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

// Using raw prisma instance since we bypass the normal controllers for this mass data import
const prisma = new PrismaClient();

async function main() {
  const filePath = path.resolve('C:\\Amalgamate\\Projects\\Zawadi SMS\\data\\xlsx.xlsx');
  
  console.log('Loading Excel File...');
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Found ${data.length} records in Excel.`);
  
  let successCount = 0;
  let skipNoStudentMatch = 0;
  let skipDuplicate = 0;
  let invoiceCreatedCount = 0;

  const defaultFeeStructure = await prisma.feeStructure.findFirst();
  if (!defaultFeeStructure) {
     console.error('No Fee Structure exists in the system to bind to invoices!');
     process.exit(1);
  }

  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const adminId = adminUser ? adminUser.id : 'unknown';

  // Row 0 is headers in this file
  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Data Mapping for "xlsx.xlsx"
    const rawReceipt = row['Exported data']; // This is "Receipt .Number"
    const rawDate = row['__EMPTY'];
    const rawMode = row['__EMPTY_1'];
    const rawStudent = row['__EMPTY_2'];
    const rawAdm = row['__EMPTY_3'];
    const rawPaid = row['__EMPTY_5']; // This is "A.Paid"
    const rawRef = row['__EMPTY_6'];
    const rawPaidBy = row['__EMPTY_7'];

    if (!rawPaid || !rawAdm) continue;

    const admNo = String(rawAdm).trim();
    const amount = Number(rawPaid);
    const ref = String(rawRef || 'N/A').trim();
    const receiptNumber = String(rawReceipt || `IMP-AUTOGEN-${i}`).trim();

    // Map Mode
    let paymentMethod: any = 'CASH';
    const parsedMode = String(rawMode || '').toUpperCase().trim();
    if (parsedMode.includes('MPESA')) paymentMethod = 'MPESA';
    else if (parsedMode.includes('BANK')) paymentMethod = 'BANK_TRANSFER';
    else if (parsedMode.includes('CHEQUE')) paymentMethod = 'CHEQUE';

    // Parse Date (DD/MM/YYYY to Date object)
    let paymentDate = new Date();
    if (rawDate && typeof rawDate === 'string') {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY
        paymentDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
    }

    try {
      // 1. Find Learner
      const learner = await prisma.learner.findFirst({
        where: { admissionNumber: admNo }
      });

      if (!learner) {
        console.warn(`[Row ${i+1}] SKIPPED: Learner not found for AdmNo: ${admNo} (${rawStudent})`);
        skipNoStudentMatch++;
        continue;
      }

      // 2. Find or Create their Term 1 2026 Invoice
      let invoice = await prisma.feeInvoice.findFirst({
        where: {
          learnerId: learner.id,
          academicYear: 2026,
          term: 'TERM_1'
        }
      });

      if (!invoice) {
        const existingInvoice = await prisma.feeInvoice.findFirst({ where: { learnerId: learner.id } });
        
        invoice = await prisma.feeInvoice.create({
          data: {
            invoiceNumber: `INV-${learner.admissionNumber}-T1-2026-IMP`,
            learnerId: learner.id,
            term: 'TERM_1',
            academicYear: 2026,
            totalAmount: existingInvoice ? existingInvoice.totalAmount : 0, 
            paidAmount: 0,
            balance: existingInvoice ? existingInvoice.totalAmount : 0,
            status: 'PENDING',
            issuedBy: learner.createdBy || adminId,
            feeStructureId: existingInvoice ? existingInvoice.feeStructureId : defaultFeeStructure.id,
            dueDate: new Date(2026, 3, 30) // April 30, 2026
          }
        });
        invoiceCreatedCount++;
      }

      // 3. Duplicate Check
      const existingPayment = await prisma.feePayment.findFirst({
        where: {
          invoiceId: invoice.id,
          OR: [
            { receiptNumber: receiptNumber },
            { 
              amount: amount, 
              referenceNumber: ref !== 'n/a' ? ref : undefined,
              paymentDate: { 
                gte: new Date(new Date(paymentDate).setHours(0,0,0,0)), 
                lte: new Date(new Date(paymentDate).setHours(23,59,59,999)) 
              } 
            }
          ]
        }
      });

      if (existingPayment) {
        skipDuplicate++;
        continue; 
      }

      // 4. Apply Payment
      await prisma.$transaction(async (tx) => {
        // Create Payment
        await tx.feePayment.create({
          data: {
            invoiceId: invoice!.id,
            amount,
            paymentMethod,
            paymentDate,
            receiptNumber,
            referenceNumber: ref,
            notes: `Paid by: ${String(rawPaidBy || 'Import')}`,
            recordedBy: learner.createdBy || adminId
          }
        });

        // Update Invoice Balances
        const freshInvoice = await tx.feeInvoice.findUnique({ where: { id: invoice!.id } });
        const newPaid = Number(freshInvoice!.paidAmount) + amount;
        const newBalance = Math.max(0, Number(freshInvoice!.totalAmount) - newPaid);
        let status = freshInvoice!.status;

        if (newBalance <= 0) status = 'PAID';
        else if (newPaid > 0) status = 'PARTIAL';

        await tx.feeInvoice.update({
          where: { id: invoice!.id },
          data: {
            paidAmount: newPaid,
            balance: newBalance,
            status: status as any
          }
        });
      });

      successCount++;
    } catch (err: any) {
      console.error(`[Row ${i+1}] ERROR on AdmNo ${admNo}:`, err.message);
    }
  }

  console.log('--- IMPORT SUMMARY ---');
  console.log(`Total Rows Processed: ${data.length}`);
  console.log(`Successfully Imported: ${successCount}`);
  console.log(`Skipped (No Student): ${skipNoStudentMatch}`);
  console.log(`Skipped (Duplicates): ${skipDuplicate}`);
  console.log(`Invoices Auto-Created: ${invoiceCreatedCount}`);

}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
