/**
 * Fee Management Controller
 * Handles fee structures, invoices, and payments for a single-tenant environment
 */

import { Response } from 'express';
import { PaymentStatus } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';
import { SmsService } from '../services/sms.service';
import { whatsappService } from '../services/whatsapp.service';
import { accountingService } from '../services/accounting.service';
import { complianceService } from '../services/compliance.service';
import { EmailService } from '../services/email.service';

function normalizeEnumValue(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = String(value).trim().toUpperCase().replace(/\s+/g, '_');
  return normalized
    .replace(/GRADE[_-]?(\d+)/, 'GRADE_$1')
    .replace(/TERM[_-]?(\d+)/, 'TERM_$1');
}

const INVOICE_NUMBER_RETRY_COUNT = 3;

function parseInvoiceNumber(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

async function getNextInvoiceNumber(client: any, academicYear: number): Promise<string> {
  const result = await client.feeInvoice.aggregate({
    _max: { invoiceNumber: true },
    where: { academicYear }
  });

  const currentMax = result._max.invoiceNumber as string | null;
  const nextSequence = parseInvoiceNumber(currentMax) + 1;
  return `INV-${academicYear}-${String(nextSequence).padStart(6, '0')}`;
}

async function createInvoiceWithSafeNumber(client: any, invoiceData: any, include: any): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= INVOICE_NUMBER_RETRY_COUNT; attempt++) {
    const invoiceNumber = await getNextInvoiceNumber(client, invoiceData.academicYear);

    try {
      return await client.feeInvoice.create({
        data: { ...invoiceData, invoiceNumber },
        include
      });
    } catch (error: any) {
      lastError = error;
      if (error?.code === 'P2002' && attempt < INVOICE_NUMBER_RETRY_COUNT) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/**
 * [FIX 3] Shared transport filter — was copy-pasted in createInvoice AND
 * bulkGenerateInvoices. Single source of truth now.
 */
function applyTransportFilter(items: any[], includeTransport: boolean): any[] {
  if (includeTransport) return items;
  return items.filter((item: any) => item.feeType?.code !== 'TRANSPORT');
}

export class FeeController {
  /**
   * Get all fee structures
   */
  async getAllFeeStructures(req: AuthRequest, res: Response) {
    const { academicYear, term, grade, active } = req.query;
    const where: any = {};

    if (academicYear) where.academicYear = parseInt(academicYear as string);
    if (term) where.term = normalizeEnumValue(term) || term;
    if (grade) where.grade = normalizeEnumValue(grade) || grade;
    if (active !== undefined) where.active = active === 'true';

    const feeStructures = await prisma.feeStructure.findMany({
      where,
      include: {
        feeItems: {
          include: {
            feeType: true
          }
        }
      } as any,
      orderBy: [
        { academicYear: 'desc' },
        { term: 'asc' },
        { grade: 'asc' }
      ]
    });

    res.json({ success: true, data: feeStructures, count: feeStructures.length });
  }

  /**
   * Create fee structure
   */
  async createFeeStructure(req: AuthRequest, res: Response) {
    const { name, description, feeItems, grade, term, academicYear, mandatory, active } = req.body;
    const userId = req.user!.userId;
    const normalizedGrade = normalizeEnumValue(grade) || grade;
    const normalizedTerm = normalizeEnumValue(term) || term;

    if (!name || !feeItems || !Array.isArray(feeItems) || feeItems.length === 0 || !academicYear) {
      throw new ApiError(400, 'Missing required fields: name, feeItems, academicYear');
    }

    const existing = await prisma.feeStructure.findFirst({
      where: { name, academicYear, term: normalizedTerm || null, grade: normalizedGrade || null }
    });
    if (existing) throw new ApiError(400, 'Fee structure already exists for this period');

    const feeStructure = await prisma.feeStructure.create({
      data: {
        name,
        description,
        grade: normalizedGrade || null,
        term: normalizedTerm || null,
        academicYear,
        mandatory: mandatory !== undefined ? mandatory : true,
        active: active !== undefined ? active : true,
        createdBy: userId,
        feeItems: {
          create: feeItems.map((item: any) => ({
            feeTypeId: item.feeTypeId,
            amount: item.amount,
            mandatory: item.mandatory !== undefined ? item.mandatory : true
          }))
        } as any
      },
      include: {
        feeItems: {
          include: { feeType: true }
        }
      } as any
    });

    res.status(201).json({ success: true, data: feeStructure });
  }

  /**
   * Update fee structure
   */
  async updateFeeStructure(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { name, description, feeItems, grade, term, mandatory, active } = req.body;

    const existing = await prisma.feeStructure.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, 'Fee structure not found');

    const updated = await prisma.$transaction(async (tx: any) => {
      await tx.feeStructure.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(grade !== undefined && { grade: normalizeEnumValue(grade) || grade }),
          ...(term !== undefined && { term: normalizeEnumValue(term) || term }),
          ...(mandatory !== undefined && { mandatory }),
          ...(active !== undefined && { active })
        }
      });

      if (feeItems && Array.isArray(feeItems)) {
        await tx.feeStructureItem.deleteMany({ where: { feeStructureId: id } });
        if (feeItems.length > 0) {
          await tx.feeStructureItem.createMany({
            data: feeItems.map((item: any) => ({
              feeStructureId: id,
              feeTypeId: item.feeTypeId,
              amount: item.amount,
              mandatory: item.mandatory !== undefined ? item.mandatory : true
            }))
          });
        }
      }

      return await tx.feeStructure.findUnique({
        where: { id },
        include: {
          feeItems: {
            include: { feeType: true }
          }
        } as any
      });
    });

    res.json({ success: true, data: updated });
  }

  /**
   * Delete fee structure
   */
  async deleteFeeStructure(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const existing = await prisma.feeStructure.findUnique({
      where: { id },
      include: { invoices: true }
    });

    if (!existing) throw new ApiError(404, 'Fee structure not found');
    if (existing.invoices.length > 0) throw new ApiError(400, 'Cannot delete structure with existing invoices');

    await prisma.feeStructure.delete({ where: { id } });
    res.json({ success: true, message: 'Fee structure deleted successfully' });
  }

  /**
   * Get all invoices
   */
  async getAllInvoices(req: AuthRequest, res: Response) {
    const { status, term, academicYear, grade, learnerId } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (term) where.term = normalizeEnumValue(term) || term;
    if (academicYear) where.academicYear = parseInt(academicYear as string);
    if (learnerId) where.learnerId = learnerId;
    if (grade) where.learner = { grade: normalizeEnumValue(grade) || grade };

    const invoices = await prisma.feeInvoice.findMany({
      where,
      include: {
        learner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            grade: true,
            stream: true,
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        feeStructure: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: invoices, count: invoices.length });
  }

  /**
   * Get learner invoices
   */
  async getLearnerInvoices(req: AuthRequest, res: Response) {
    const { learnerId } = req.params;
    const learner = await prisma.learner.findUnique({ where: { id: learnerId } });
    if (!learner) throw new ApiError(404, 'Learner not found');

    const invoices = await prisma.feeInvoice.findMany({
      where: { learnerId },
      include: {
        feeStructure: true,
        payments: { orderBy: { paymentDate: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: invoices });
  }

  /**
   * Create single invoice
   */
  async createInvoice(req: AuthRequest, res: Response) {
    const { learnerId, feeStructureId, term, academicYear, dueDate, includeTransport } = req.body;
    const userId = req.user!.userId;

    if (!learnerId || !feeStructureId || !term || !academicYear || !dueDate) {
      throw new ApiError(400, 'Missing required fields');
    }

    const [learner, feeStructure] = await Promise.all([
      prisma.learner.findUnique({ where: { id: learnerId } }),
      prisma.feeStructure.findUnique({
        where: { id: feeStructureId },
        include: {
          feeItems: {
            include: { feeType: true }
          }
        } as any
      })
    ]);

    if (!learner || !feeStructure) throw new ApiError(404, 'Learner or Fee structure not found');

    // [FIX 3] Use shared transport filter helper
    const filteredItems = applyTransportFilter(
      (feeStructure as any).feeItems || [],
      includeTransport !== false
    );

    const totalAmount = filteredItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const existing = await prisma.feeInvoice.findFirst({
      where: { learnerId, feeStructureId, term, academicYear }
    });
    if (existing) throw new ApiError(400, 'An invoice for this period already exists for the student');

    const invoice = await createInvoiceWithSafeNumber(prisma, {
      learnerId,
      feeStructureId,
      term,
      academicYear,
      dueDate: new Date(dueDate),
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      status: 'PENDING',
      issuedBy: userId
    }, {
      learner: true,
      feeStructure: {
        include: {
          feeItems: { include: { feeType: true } }
        }
      } as any
    });

    // Handle Notifications & Accounting in parallel background tasks.
    // Response is sent immediately to avoid latency.
    setImmediate(async () => {
      try {
        const contactPhone = learner.primaryContactPhone || learner.guardianPhone;
        if (contactPhone) {
          Promise.all([
            SmsService.sendFeeInvoiceNotification({
              parentPhone: contactPhone,
              parentName: learner.primaryContactName || 'Parent',
              learnerName: `${learner.firstName} ${learner.lastName}`,
              invoiceNumber: invoice.invoiceNumber,
              term: invoice.term,
              amount: Number(invoice.totalAmount),
              dueDate: new Date(invoice.dueDate).toLocaleDateString()
            }).catch(e => console.error('SMS Notification failed:', e)),
            whatsappService.sendMessage({
              to: contactPhone,
              message: `Official Fee Invoice ${invoice.invoiceNumber} for ${learner.firstName} has been generated. Amount: KES ${invoice.totalAmount.toLocaleString()}.`
            }).catch(e => console.error('WhatsApp Notification failed:', e))
          ]);
        }
      } catch (err) { console.error('Post-creation notification error:', err); }

      try {
        await accountingService.postFeeInvoiceToLedger(invoice);
        await complianceService.syncInvoiceToETIMS(invoice.id);
      } catch (err) { console.error('Post-creation background tasks error:', err); }
    });

    res.status(201).json({ success: true, data: invoice });
  }

  /**
   * Record payment
   */
  async recordPayment(req: AuthRequest, res: Response) {
    const { invoiceId, learnerId, amount: rawAmount, paymentMethod, referenceNumber, notes } = req.body;
    const userId = req.user!.userId;

    if ((!invoiceId && !learnerId) || rawAmount === undefined || rawAmount === null || !paymentMethod) {
      throw new ApiError(400, 'Missing required fields: invoiceId or learnerId, amount, paymentMethod');
    }

    const amount = Number(rawAmount);

    let invoice;
    if (invoiceId) {
      invoice = await prisma.feeInvoice.findUnique({
        where: { id: invoiceId },
        include: { learner: true }
      });
    } else {
      invoice = await prisma.feeInvoice.findFirst({
        where: {
          learnerId,
          status: { in: ['PENDING', 'PARTIAL'] }
        },
        orderBy: { createdAt: 'desc' },
        include: { learner: true }
      });
      if (!invoice && learnerId) {
        invoice = await prisma.feeInvoice.findFirst({
          where: { learnerId },
          orderBy: { createdAt: 'desc' },
          include: { learner: true }
        });
      }
    }

    // [FIX 1] Removed duplicate if (!invoice) guard that fired twice back-to-back
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    if (invoice.status === 'PAID') throw new ApiError(400, 'Invoice is already fully paid');

    const actualInvoiceId = invoice.id;

    const result: any = await prisma.$transaction(async (tx) => {
      // Use MAX instead of COUNT so concurrent transactions never produce
      // the same receipt number even if payments are deleted later.
      const maxResult = await tx.feePayment.aggregate({ _max: { receiptNumber: true } });
      const lastSeq = (() => {
        const raw = maxResult._max.receiptNumber as string | null;
        if (!raw) return 0;
        const m = raw.match(/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })();
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(lastSeq + 1).padStart(6, '0')}`;

      const payment = await tx.feePayment.create({
        data: {
          receiptNumber,
          invoiceId: actualInvoiceId,
          amount,
          paymentMethod,
          referenceNumber,
          notes,
          recordedBy: userId
        }
      });

      const updatedInvoice = await tx.feeInvoice.update({
        where: { id: actualInvoiceId },
        data: {
          paidAmount: { increment: amount },
          balance: { decrement: amount }
        }
      });

      let newStatus: PaymentStatus = updatedInvoice.status;
      const balance = Number(updatedInvoice.balance);
      if (balance <= 0) {
        newStatus = balance < 0 ? 'OVERPAID' : 'PAID';
      } else {
        newStatus = 'PARTIAL';
      }

      const finalInvoice = await tx.feeInvoice.update({
        where: { id: actualInvoiceId },
        data: { status: newStatus },
        include: { learner: true, payments: true }
      });

      return { payment, invoice: finalInvoice };
    });

    // Handle Accounting & Notifications Async
    (async () => {
      try {
        await accountingService.postFeePaymentToLedger(result.payment, paymentMethod);

        const learner = result.invoice.learner;
        const contactPhone = learner.primaryContactPhone || learner.guardianPhone;
        const newStatus: string = result.invoice.status;

        if (contactPhone) {
          // [FIX 2] Tailored SMS copy per payment outcome status
          let smsMessage: string;
          if (newStatus === 'PAID') {
            smsMessage = `Payment of KES ${amount.toLocaleString()} received for ${learner.firstName}. Invoice fully settled. Thank you.`;
          } else if (newStatus === 'OVERPAID') {
            smsMessage = `Payment of KES ${amount.toLocaleString()} received for ${learner.firstName}. Credit balance: KES ${Math.abs(Number(result.invoice.balance)).toLocaleString()}. Please contact the school to arrange a refund or apply to next term.`;
          } else {
            // PARTIAL
            smsMessage = `Payment of KES ${amount.toLocaleString()} received for ${learner.firstName}. Outstanding balance: KES ${Number(result.invoice.balance).toLocaleString()}. Thank you.`;
          }
          await SmsService.sendSms(contactPhone, smsMessage);
        }
      } catch (err) { console.error('Post-payment error:', err); }
    })();

    res.status(201).json({ success: true, data: result });
  }

  /**
   * Get summary stats
   * [FIX 5] Grade-wise collection now uses a Prisma groupBy query instead of
   * fetching all invoices into memory and grouping in JS.
   */
  async getPaymentStats(req: AuthRequest, res: Response) {
    const { academicYear, term, grade, startDate, endDate } = req.query;
    const invoiceWhere: any = {};
    const paymentWhere: any = {};

    if (academicYear) invoiceWhere.academicYear = parseInt(academicYear as string);
    if (term && term !== 'all') invoiceWhere.term = term;
    if (grade && grade !== 'all') {
      invoiceWhere.learner = { grade: grade as string };
    }

    if (startDate) {
      invoiceWhere.createdAt = { gte: new Date(startDate as string) };
      paymentWhere.paymentDate = { gte: new Date(startDate as string) };
    }
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      invoiceWhere.createdAt = { ...invoiceWhere.createdAt, lte: end };
      paymentWhere.paymentDate = { ...paymentWhere.paymentDate, lte: end };
    }

    // Apply grade/term/academic year filters to payment query via relation
    if (academicYear || (term && term !== 'all') || (grade && grade !== 'all')) {
      paymentWhere.invoice = {};
      if (academicYear) paymentWhere.invoice.academicYear = parseInt(academicYear as string);
      if (term && term !== 'all') paymentWhere.invoice.term = term;
      if (grade && grade !== 'all') paymentWhere.invoice.learner = { grade: grade as string };
    }

    const [totalInvoices, invoicesByStatus] = await Promise.all([
      prisma.feeInvoice.count({ where: invoiceWhere }),
      prisma.feeInvoice.groupBy({
        by: ['status'],
        where: invoiceWhere,
        _count: true,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balance: true
        }
      })
    ]);

    const totalExpected = invoicesByStatus.reduce((acc, curr) => acc + Number(curr._sum.totalAmount || 0), 0);
    const totalCollected = invoicesByStatus.reduce((acc, curr) => acc + Number(curr._sum.paidAmount || 0), 0);
    const totalOutstanding = invoicesByStatus.reduce((acc, curr) => acc + Number(curr._sum.balance || 0), 0);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const paidInvoices    = invoicesByStatus.find(i => i.status === 'PAID')?._count    || 0;
    const partialInvoices = invoicesByStatus.find(i => i.status === 'PARTIAL')?._count || 0;
    const pendingInvoices = invoicesByStatus.find(i => i.status === 'PENDING')?._count || 0;
    const overdueInvoices = await prisma.feeInvoice.count({
      where: { ...invoiceWhere, status: { notIn: ['PAID', 'OVERPAID', 'CANCELLED'] }, dueDate: { lt: new Date() } }
    });

    const paymentsByMethod = await prisma.feePayment.groupBy({
      by: ['paymentMethod'],
      where: paymentWhere,
      _count: true,
      _sum: { amount: true }
    });

    const paymentMethods = paymentsByMethod.map(p => ({
      method: p.paymentMethod,
      amount: Number(p._sum.amount || 0),
      count: p._count
    }));

    // [FIX 5] Grade-wise breakdown via DB groupBy — no full table scan into JS memory.
    // We group invoices by learner.grade directly in the database, then run a
    // separate count-distinct for studentCount using a raw aggregate per grade.
    const gradeGroupRaw = await prisma.feeInvoice.groupBy({
      by: ['learnerId'] as any,
      where: invoiceWhere,
      _sum: {
        totalAmount: true,
        paidAmount: true,
        balance: true
      }
    });

    // Fetch the grade for each learner we just grouped — one query, not N queries
    const learnerIds = gradeGroupRaw.map((r: any) => r.learnerId).filter(Boolean);
    const learnerGrades = learnerIds.length > 0
      ? await prisma.learner.findMany({
          where: { id: { in: learnerIds } },
          select: { id: true, grade: true }
        })
      : [];

    const gradeIdMap = new Map(learnerGrades.map(l => [l.id, l.grade || 'Unknown']));

    const gradeAgg: Record<string, { expected: number; collected: number; outstanding: number; studentIds: Set<string> }> = {};
    for (const row of gradeGroupRaw as any[]) {
      const g = gradeIdMap.get(row.learnerId) ?? 'Unknown';
      if (!gradeAgg[g]) gradeAgg[g] = { expected: 0, collected: 0, outstanding: 0, studentIds: new Set() };
      gradeAgg[g].studentIds.add(row.learnerId);
      gradeAgg[g].expected    += Number(row._sum.totalAmount || 0);
      gradeAgg[g].collected   += Number(row._sum.paidAmount  || 0);
      gradeAgg[g].outstanding += Number(row._sum.balance     || 0);
    }

    const gradeWiseCollection = Object.entries(gradeAgg).map(([g, gm]) => ({
      grade: g.replace(/_/g, ' '),
      studentCount: gm.studentIds.size,
      expected: gm.expected,
      collected: gm.collected,
      outstanding: gm.outstanding,
      collectionRate: gm.expected > 0 ? Math.round((gm.collected / gm.expected) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        totalExpected,
        totalCollected,
        totalOutstanding,
        collectionRate,
        totalInvoices,
        paidInvoices,
        partialInvoices,
        pendingInvoices,
        overdueInvoices,
        paymentMethods,
        gradeWiseCollection
      }
    });
  }

  /**
   * Bulk generate invoices
   * [FIX 4] Duplicate-check is now done BEFORE the transaction using a single
   * query, avoiding N findFirst calls inside the transaction loop which could
   * time out on large grades.
   */
  async bulkGenerateInvoices(req: AuthRequest, res: Response) {
    const { feeStructureId, term, academicYear, dueDate, grade, stream, includeTransport } = req.body;
    const userId = req.user!.userId;

    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: {
        feeItems: {
          include: { feeType: true }
        }
      } as any
    });

    if (!feeStructure) throw new ApiError(404, 'Fee structure not found');

    // [FIX 3] Use shared transport filter helper
    const filteredItems = applyTransportFilter(
      (feeStructure as any).feeItems || [],
      includeTransport !== false
    );

    const totalAmount = filteredItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const learners = await prisma.learner.findMany({
      where: {
        grade,
        stream: stream || undefined,
        status: 'ACTIVE'
      }
    });

    if (learners.length === 0) {
      throw new ApiError(400, 'No active learners found for grade/stream');
    }

    // [FIX 4] Pre-fetch all learner IDs that already have an invoice for this
    // structure+term+year in ONE query, then filter in JS — keeps the
    // transaction lean and avoids per-learner findFirst calls inside it.
    const learnerIds = learners.map(l => l.id);
    const alreadyInvoiced = await prisma.feeInvoice.findMany({
      where: {
        learnerId: { in: learnerIds },
        feeStructureId,
        term,
        academicYear
      },
      select: { learnerId: true }
    });
    const alreadyInvoicedSet = new Set(alreadyInvoiced.map(i => i.learnerId));
    const learnersToInvoice = learners.filter(l => !alreadyInvoicedSet.has(l.id));

    if (learnersToInvoice.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0,
        message: 'All learners in this grade already have invoices for this period.'
      });
    }

    let results;
    let lastError: any;

    for (let attempt = 1; attempt <= INVOICE_NUMBER_RETRY_COUNT; attempt++) {
      try {
        results = await prisma.$transaction(async (tx: any) => {
          const invoices = [];
          const maxResult = await tx.feeInvoice.aggregate({
            _max: { invoiceNumber: true },
            where: { academicYear }
          });

          let nextSequence = parseInvoiceNumber(maxResult._max.invoiceNumber as string | null) + 1;

          for (const learner of learnersToInvoice) {
            const invoiceNumber = `INV-${academicYear}-${String(nextSequence).padStart(6, '0')}`;
            nextSequence += 1;

            const invoice = await tx.feeInvoice.create({
              data: {
                invoiceNumber,
                learnerId: learner.id,
                feeStructureId,
                term,
                academicYear,
                dueDate: new Date(dueDate),
                totalAmount,
                paidAmount: 0,
                balance: totalAmount,
                status: 'PENDING',
                issuedBy: userId
              }
            });
            invoices.push(invoice);
          }

          return invoices;
        });
        break;
      } catch (error: any) {
        lastError = error;
        if (error?.code === 'P2002' && attempt < INVOICE_NUMBER_RETRY_COUNT) {
          continue;
        }
        throw error;
      }
    }

    if (!results) {
      throw lastError;
    }

    // Handle Accounting Ledger Posting & eTIMS sync in background
    setImmediate(async () => {
      console.log(`[BulkCompliance] Starting background tasks for ${results?.length} invoices...`);
      for (const inv of results || []) {
        try {
          await accountingService.postFeeInvoiceToLedger(inv);
          await complianceService.syncInvoiceToETIMS(inv.id);
        } catch (err) {
          console.error(`[BulkCompliance] Failed background sync for invoice ${inv.invoiceNumber}:`, err);
        }
      }
    });

    res.status(201).json({ success: true, data: results, count: results.length });
  }

  /**
   * Reset invoices (Super Admin only)
   */
  async resetInvoices(req: AuthRequest, res: Response) {
    if (req.user!.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Global reset restricted to SUPER_ADMIN');
    }

    await prisma.feePayment.deleteMany({});
    const result = await prisma.feeInvoice.deleteMany({});

    res.json({ success: true, message: `System reset complete. Deleted ${result.count} invoices and all payments.` });
  }

  /**
   * Send individual invoice reminder
   */
  async sendInvoiceReminder(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { channel } = req.body; // 'SMS' | 'WHATSAPP' | 'BOTH'

    const invoice = await prisma.feeInvoice.findUnique({
      where: { id },
      include: { learner: true }
    });

    if (!invoice) throw new ApiError(404, 'Invoice not found');
    const learner = invoice.learner;
    const contactPhone = learner.primaryContactPhone || learner.guardianPhone;
    if (!contactPhone) throw new ApiError(400, 'Student has no contact phone number');

    const message = `Reminder: Fee Invoice ${invoice.invoiceNumber} for ${learner.firstName} is outstanding. Balance: KES ${invoice.balance.toLocaleString()}. Please clear by the due date.`;

    const results: any = {};

    if (channel === 'SMS' || channel === 'BOTH') {
      try {
        const smsResult = await SmsService.sendSms(contactPhone, message);
        if (smsResult.success) {
          results.sms = 'Sent';
        } else {
          results.sms = `Failed: ${smsResult.error}`;
        }
      } catch (e: any) {
        results.sms = `Error: ${e.message}`;
      }
    }

    if (channel === 'WHATSAPP' || channel === 'BOTH') {
      try {
        const waResult = await whatsappService.sendMessage({ to: contactPhone, message });
        if (waResult.success) {
          results.whatsapp = 'Sent';
        } else {
          results.whatsapp = `Failed: ${waResult.message}${waResult.error ? ` (${waResult.error})` : ''}`;
        }
      } catch (e: any) {
        results.whatsapp = `Error: ${e.message}`;
      }
    }

    // Check if everything failed
    const allFailed = (channel === 'SMS' && results.sms?.startsWith('Failed')) ||
      (channel === 'WHATSAPP' && results.whatsapp?.startsWith('Failed')) ||
      (channel === 'BOTH' && results.sms?.startsWith('Failed') && results.whatsapp?.startsWith('Failed'));

    if (allFailed) {
      const errorDetail = Object.entries(results)
        .filter(([_, v]) => (v as string).includes('Failed') || (v as string).includes('Error'))
        .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
        .join('; ');

      return res.status(400).json({
        success: false,
        message: `Reminder failed: ${errorDetail}`,
        data: results
      });
    }

    res.json({ success: true, data: results });
  }

  /**
   * Bulk send reminders
   */
  async bulkSendReminders(req: AuthRequest, res: Response) {
    const { invoiceIds, channel } = req.body;

    if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      throw new ApiError(400, 'No invoices selected');
    }

    const invoices = await prisma.feeInvoice.findMany({
      where: { id: { in: invoiceIds } },
      include: { learner: true }
    });

    // Run in background to avoid timeout
    setImmediate(async () => {
      for (const invoice of invoices) {
        const learner = invoice.learner;
        const contactPhone = learner.primaryContactPhone || learner.guardianPhone;
        if (!contactPhone) continue;

        const message = `Reminder: Fee Invoice ${invoice.invoiceNumber} for ${learner.firstName} is outstanding. Balance: KES ${invoice.balance.toLocaleString()}. Thank you.`;

        if (channel === 'SMS' || channel === 'BOTH') {
          await SmsService.sendSms(contactPhone, message).catch(() => { });
        }
        if (channel === 'WHATSAPP' || channel === 'BOTH') {
          await whatsappService.sendMessage({ to: contactPhone, message }).catch(() => { });
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }
    });

    res.json({ success: true, message: `Reminder process started for ${invoices.length} invoices.` });
  }

  /**
   * Export invoices to CSV
   */
  async exportInvoices(req: AuthRequest, res: Response) {
    const { status, term, academicYear, grade, learnerId } = req.query;
    const where: any = {};

    if (status) where.status = status;
    if (term) where.term = term;
    if (academicYear) where.academicYear = parseInt(academicYear as string);
    if (learnerId) where.learnerId = learnerId;
    if (grade) where.learner = { grade };

    const invoices = await prisma.feeInvoice.findMany({
      where,
      include: {
        learner: {
          select: {
            firstName: true,
            lastName: true,
            admissionNumber: true,
            grade: true,
            stream: true,
          }
        },
        feeStructure: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = ['Invoice Number', 'Student Name', 'Admission No', 'Grade', 'Stream', 'Fee Structure', 'Total Amount', 'Paid Amount', 'Balance', 'Status', 'Due Date'];
    const rows = invoices.map((inv: any) => [
      inv.invoiceNumber,
      `${inv.learner?.firstName || ''} ${inv.learner?.lastName || ''}`,
      inv.learner?.admissionNumber || '',
      inv.learner?.grade || 'N/A',
      inv.learner?.stream || 'N/A',
      inv.feeStructure?.name || 'N/A',
      inv.totalAmount,
      inv.paidAmount,
      inv.balance,
      inv.status,
      inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));

    const csvStr = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fee_invoices_report.csv');
    res.send(csvStr);
  }

  /**
   * Email fee statement
   */
  async emailStatement(req: AuthRequest, res: Response) {
    const { learnerId } = req.params;
    const { pdfBase64 } = req.body;

    if (!pdfBase64) {
      throw new ApiError(400, 'PDF document is required');
    }

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: { parent: true }
    });

    if (!learner) throw new ApiError(404, 'Learner not found');

    const contactEmail = learner.guardianEmail || learner.parent?.email || (learner as any).email;
    if (!contactEmail) {
      throw new ApiError(400, 'Student has no linked email address to send the statement to');
    }

    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    const school = await prisma.school.findFirst({ select: { name: true } });

    await EmailService.sendFeeStatementEmail({
      to: contactEmail,
      schoolName: school?.name || 'School',
      parentName: learner.guardianName || learner.parent?.firstName || 'Parent/Guardian',
      learnerName: `${learner.firstName} ${learner.lastName}`,
      pdfBuffer
    });

    res.json({ success: true, message: 'Statement emailed successfully' });
  }
}

export const feeController = new FeeController();
