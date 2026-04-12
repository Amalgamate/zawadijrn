/**
 * seed-test-invoices.ts
 * 
 * Seeds 5 realistic test invoices covering:
 *  1. Transport student — Paid in Full
 *  2. Regular student  — Paid in Full (no transport)
 *  3. Partial payment
 *  4. Previous accrued balance (carried over)
 *  5. Overpayment / excess payment
 * 
 * Run: npx ts-node scratch/seed-test-invoices.ts
 */

import { PrismaClient, PaymentStatus, PaymentMethod, Term } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test invoice seed...\n');

  // ── 1. Prerequisites ──────────────────────────────────────────────
  // Get first 5 active learners
  const learners = await prisma.learner.findMany({
    where: { status: 'ACTIVE' },
    take: 5,
    orderBy: { createdAt: 'asc' },
  });

  if (learners.length < 5) {
    throw new Error(`Need at least 5 active learners. Found ${learners.length}. Please add more students first.`);
  }

  // Get the first active admin user to use as issuedBy
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!admin) throw new Error('No admin user found. Please create an admin first.');
  console.log(`👤 Using admin: ${admin.firstName} ${admin.lastName} (${admin.id})`);

  // Get or find fee structures for Term 1 2026
  const feeStructures = await prisma.feeStructure.findMany({
    where: { term: 'TERM_1', academicYear: 2026, active: true },
  });

  if (feeStructures.length === 0) {
    throw new Error('No active fee structures found for Term 1 2026. Please create a fee structure first.');
  }

  // Get a fee structure matching each learner's grade (or fallback to first)
  const getStructure = (grade: string) =>
    feeStructures.find(fs => fs.grade === grade) || feeStructures[0];

  const BASE_FEE     = 10_300; // Standard term fee
  const TRANSPORT_FEE = 4_500; // Transport surcharge

  const dueDate = new Date('2026-04-30');
  const now     = new Date();

  // ── Helper: unique invoice and receipt numbers ────────────────────
  const invNum = (suffix: string) => `INV-SEED-${suffix}-${Date.now()}`;
  const rctNum = (suffix: string) => `RCT-SEED-${suffix}-${Date.now()}`;

  const results: string[] = [];

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 1 — Transport student, Paid in Full (10,300 + 4,500 = 14,800)
  // ─────────────────────────────────────────────────────────────────
  {
    const learner = learners[0];
    const structure = getStructure(learner.grade);
    const total = BASE_FEE + TRANSPORT_FEE;

    console.log(`\n[1/5] Transport + Fully Paid → ${learner.firstName} ${learner.lastName}`);

    // Mark as transport student
    await prisma.learner.update({ where: { id: learner.id }, data: { isTransportStudent: true } });

    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber:  invNum('T-FULL'),
        learnerId:      learner.id,
        feeStructureId: structure.id,
        term:            'TERM_1',
        academicYear:    2026,
        dueDate,
        totalAmount:     total,
        paidAmount:      total,
        balance:         0,
        status:          'PAID',
        issuedBy:        admin.id,
      },
    });

    await prisma.feePayment.create({
      data: {
        receiptNumber:   rctNum('T-FULL'),
        invoiceId:       invoice.id,
        amount:          total,
        paymentMethod:   'MPESA',
        paymentDate:     new Date('2026-01-15'),
        referenceNumber: 'MPESA-T-001',
        notes:           'Full payment including transport',
        recordedBy:      admin.id,
      },
    });

    results.push(`✅ [1] Transport + Full  | ${learner.firstName} ${learner.lastName} | KES ${total.toLocaleString()} | PAID`);
  }

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 2 — Regular student, Paid in Full (no transport)
  // ─────────────────────────────────────────────────────────────────
  {
    const learner = learners[1];
    const structure = getStructure(learner.grade);
    const total = BASE_FEE;

    console.log(`[2/5] Regular + Fully Paid → ${learner.firstName} ${learner.lastName}`);

    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber:  invNum('R-FULL'),
        learnerId:      learner.id,
        feeStructureId: structure.id,
        term:            'TERM_1',
        academicYear:    2026,
        dueDate,
        totalAmount:     total,
        paidAmount:      total,
        balance:         0,
        status:          'PAID',
        issuedBy:        admin.id,
      },
    });

    await prisma.feePayment.create({
      data: {
        receiptNumber:   rctNum('R-FULL'),
        invoiceId:       invoice.id,
        amount:          total,
        paymentMethod:   'BANK_TRANSFER',
        paymentDate:     new Date('2026-01-10'),
        referenceNumber: 'BANK-R-002',
        notes:           'Full payment — regular student',
        recordedBy:      admin.id,
      },
    });

    results.push(`✅ [2] Regular + Full    | ${learner.firstName} ${learner.lastName} | KES ${total.toLocaleString()} | PAID`);
  }

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 3 — Partial payment (paid 5,000 of 10,300)
  // ─────────────────────────────────────────────────────────────────
  {
    const learner   = learners[2];
    const structure = getStructure(learner.grade);
    const total     = BASE_FEE;
    const paid      = 5_000;
    const balance   = total - paid;

    console.log(`[3/5] Partial Payment → ${learner.firstName} ${learner.lastName}`);

    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber:  invNum('PARTIAL'),
        learnerId:      learner.id,
        feeStructureId: structure.id,
        term:            'TERM_1',
        academicYear:    2026,
        dueDate,
        totalAmount:     total,
        paidAmount:      paid,
        balance,
        status:          'PARTIAL',
        issuedBy:        admin.id,
      },
    });

    await prisma.feePayment.create({
      data: {
        receiptNumber:   rctNum('PARTIAL'),
        invoiceId:       invoice.id,
        amount:          paid,
        paymentMethod:   'CASH',
        paymentDate:     new Date('2026-01-20'),
        referenceNumber: 'CASH-P-003',
        notes:           'Partial payment — balance pending',
        recordedBy:      admin.id,
      },
    });

    results.push(`🟡 [3] Partial           | ${learner.firstName} ${learner.lastName} | Paid ${paid.toLocaleString()} / ${total.toLocaleString()} | Balance ${balance.toLocaleString()} | PARTIAL`);
  }

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 4 — Previous accrued balance (no payment made yet)
  //   Simulate a student who has carried over 3,500 from last term
  //   and now owes full this term = 10,300
  // ─────────────────────────────────────────────────────────────────
  {
    const learner   = learners[3];
    const structure = getStructure(learner.grade);
    const prevBalance = 3_500; // carried from last term
    const total       = BASE_FEE + prevBalance;

    console.log(`[4/5] Accrued Balance → ${learner.firstName} ${learner.lastName}`);

    await prisma.feeInvoice.create({
      data: {
        invoiceNumber:  invNum('BALANCE'),
        learnerId:      learner.id,
        feeStructureId: structure.id,
        term:            'TERM_1',
        academicYear:    2026,
        dueDate,
        totalAmount:     total,
        paidAmount:      0,
        balance:         total,
        status:          'PENDING',
        issuedBy:        admin.id,
      },
    });

    results.push(`🔴 [4] Accrued Balance   | ${learner.firstName} ${learner.lastName} | Total ${total.toLocaleString()} (incl. ${prevBalance.toLocaleString()} carried over) | PENDING`);
  }

  // ─────────────────────────────────────────────────────────────────
  // SCENARIO 5 — Excess / overpayment (paid 12,000 on a 10,300 bill)
  // ─────────────────────────────────────────────────────────────────
  {
    const learner   = learners[4];
    const structure = getStructure(learner.grade);
    const total     = BASE_FEE;
    const paid      = 12_000; // overpaid
    const balance   = total - paid; // negative = credit

    console.log(`[5/5] Overpayment → ${learner.firstName} ${learner.lastName}`);

    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber:  invNum('OVER'),
        learnerId:      learner.id,
        feeStructureId: structure.id,
        term:            'TERM_1',
        academicYear:    2026,
        dueDate,
        totalAmount:     total,
        paidAmount:      paid,
        balance,
        status:          'OVERPAID',
        issuedBy:        admin.id,
      },
    });

    // Two payments to simulate overpayment
    await prisma.feePayment.createMany({
      data: [
        {
          receiptNumber:   rctNum('OVER-1'),
          invoiceId:       invoice.id,
          amount:          10_300,
          paymentMethod:   'MPESA',
          paymentDate:     new Date('2026-01-12'),
          referenceNumber: 'MPESA-O-005-A',
          notes:           'First payment — full amount',
          recordedBy:      admin.id,
        },
        {
          receiptNumber:   rctNum('OVER-2'),
          invoiceId:       invoice.id,
          amount:          1_700,
          paymentMethod:   'MPESA',
          paymentDate:     new Date('2026-01-25'),
          referenceNumber: 'MPESA-O-005-B',
          notes:           'Error — excess payment (credit KES 1,700)',
          recordedBy:      admin.id,
        },
      ],
    });

    results.push(`💜 [5] Overpaid          | ${learner.firstName} ${learner.lastName} | Paid ${paid.toLocaleString()} / ${total.toLocaleString()} | Credit ${Math.abs(balance).toLocaleString()} | OVERPAID`);
  }

  // ─────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════');
  console.log('  SEEDED INVOICES SUMMARY');
  console.log('══════════════════════════════════════════════════');
  results.forEach(r => console.log(' ', r));
  console.log('══════════════════════════════════════════════════\n');
  console.log('✅ Done! Refresh the Fee Collection page to see the invoices.\n');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
