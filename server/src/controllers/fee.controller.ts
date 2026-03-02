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

export class FeeController {
  /**
   * Get all fee structures
   */
  async getAllFeeStructures(req: AuthRequest, res: Response) {
    const { academicYear, term, grade, active } = req.query;
    const where: any = {};

    if (academicYear) where.academicYear = parseInt(academicYear as string);
    if (term) where.term = term;
    if (grade) where.grade = grade;
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

    if (!name || !feeItems || !Array.isArray(feeItems) || feeItems.length === 0 || !academicYear) {
      throw new ApiError(400, 'Missing required fields: name, feeItems, academicYear');
    }

    const existing = await prisma.feeStructure.findFirst({
      where: { name, academicYear, term: term || null, grade: grade || null }
    });
    if (existing) throw new ApiError(400, 'Fee structure already exists for this period');

    const feeStructure = await prisma.feeStructure.create({
      data: {
        name,
        description,
        grade: grade || null,
        term: term || null,
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
          ...(grade !== undefined && { grade }),
          ...(term !== undefined && { term }),
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
    if (term) where.term = term;
    if (academicYear) where.academicYear = parseInt(academicYear as string);
    if (learnerId) where.learnerId = learnerId;
    if (grade) where.learner = { grade };

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

    // Filter fee items based on transport preference
    const items = (feeStructure as any).feeItems || [];
    const filteredItems = items.filter((item: any) => {
      if (includeTransport === false && item.feeType?.code === 'TRANSPORT') {
        return false;
      }
      return true;
    });

    const totalAmount = filteredItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    const existing = await prisma.feeInvoice.findFirst({
      where: { learnerId, feeStructureId, term, academicYear }
    });
    // If it's the same structure/term/year, we prevent duplicate invoices
    if (existing) throw new ApiError(400, 'An invoice for this period already exists for the student');

    // Generate Invoice Number - Consider using a more robust sequence if concurrency is high
    const count = await prisma.feeInvoice.count();
    const invoiceNumber = `INV-${academicYear}-${String(count + 1).padStart(6, '0')}`;

    const invoice = await prisma.feeInvoice.create({
      data: {
        invoiceNumber,
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
      },
      include: {
        learner: true,
        feeStructure: {
          include: {
            feeItems: { include: { feeType: true } }
          }
        } as any
      }
    });

    // Handle Notifications & Accounting in parallel background tasks
    // We send the response immediately to avoid "stuck at saving" feeling
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
      } catch (err) { console.error('Post-creation accounting error:', err); }
    });

    res.status(201).json({ success: true, data: invoice });
  }

  /**
   * Record payment
   */
  async recordPayment(req: AuthRequest, res: Response) {
    const { invoiceId, amount: rawAmount, paymentMethod, referenceNumber, notes } = req.body;
    const userId = req.user!.userId;

    if (!invoiceId || !rawAmount || !paymentMethod) {
      throw new ApiError(400, 'Missing required fields: invoiceId, amount, paymentMethod');
    }

    const amount = Number(rawAmount);
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: { learner: true }
    });

    if (!invoice) throw new ApiError(404, 'Invoice not found');
    if (invoice.status === 'PAID') throw new ApiError(400, 'Invoice is already fully paid');

    const result: any = await prisma.$transaction(async (tx) => {
      const count = await tx.feePayment.count();
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      const payment = await tx.feePayment.create({
        data: {
          receiptNumber,
          invoiceId,
          amount,
          paymentMethod,
          referenceNumber,
          notes,
          recordedBy: userId
        }
      });

      const updatedInvoice = await tx.feeInvoice.update({
        where: { id: invoiceId },
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
        where: { id: invoiceId },
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
        if (contactPhone) {
          await SmsService.sendSms(
            contactPhone,
            `Payment of KES ${amount.toLocaleString()} received for ${learner.firstName}. New balance: KES ${result.invoice.balance.toLocaleString()}. Thank you.`
          );
        }
      } catch (err) { console.error('Post-payment error:', err); }
    })();

    res.status(201).json({ success: true, data: result });
  }

  /**
   * Get summary stats
   */
  async getPaymentStats(req: AuthRequest, res: Response) {
    const { academicYear, term, grade } = req.query;
    const where: any = {};

    if (academicYear) where.academicYear = parseInt(academicYear as string);
    if (term && term !== 'all') where.term = term;
    if (grade && grade !== 'all') {
      where.learner = { grade: grade as string };
    }

    const [totalInvoices, invoicesByStatus] = await Promise.all([
      prisma.feeInvoice.count({ where }),
      prisma.feeInvoice.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: {
          totalAmount: true,
          paidAmount: true,
          balance: true
        }
      })
    ]);

    res.json({ success: true, data: { totalInvoices, invoicesByStatus } });
  }

  /**
   * Bulk generate invoices
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

    // Filter fee items based on transport preference
    const items = (feeStructure as any).feeItems || [];
    const filteredItems = items.filter((item: any) => {
      if (includeTransport === false && item.feeType?.code === 'TRANSPORT') {
        return false;
      }
      return true;
    });

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

    const results = await prisma.$transaction(async (tx) => {
      const invoices = [];
      const startCount = await tx.feeInvoice.count();

      for (let i = 0; i < learners.length; i++) {
        const learner = learners[i];
        const existing = await tx.feeInvoice.findFirst({
          where: { learnerId: learner.id, feeStructureId, term, academicYear }
        });
        if (existing) continue;

        const invoice = await tx.feeInvoice.create({
          data: {
            invoiceNumber: `INV-${academicYear}-${String(startCount + i + 1).padStart(6, '0')}`,
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
}

export const feeController = new FeeController();
