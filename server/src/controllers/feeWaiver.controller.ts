/**
 * Fee Waiver Controller
 * Handles creation, approval, and rejection of fee waivers
 */

import { Response } from 'express';
import { WaiverStatus } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';
import { SmsService } from '../services/sms.service';
import { whatsappService } from '../services/whatsapp.service';
import { accountingService } from '../services/accounting.service';
import { EmailService } from '../services/email.service';

export class FeeWaiverController {
  private smsService = new SmsService();
  private emailService = new EmailService();

  /**
   * Create a fee waiver request
   * POST /api/fees/waivers
   */
  async createWaiver(req: AuthRequest, res: Response) {
    const { invoiceId, amountWaived, reason, waiverCategory } = req.body;
    const userId = req.user?.userId;

    if (!userId) throw new ApiError(401, 'User not authenticated');
    if (!invoiceId || !amountWaived || !reason) {
      throw new ApiError(400, 'Missing required fields: invoiceId, amountWaived, reason');
    }

    // Verify invoice exists and get details
    const invoice = await prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        learner: {
          include: { parent: true }
        }
      }
    });

    if (!invoice) throw new ApiError(404, 'Invoice not found');

    const amount = typeof amountWaived === 'string' 
      ? parseFloat(amountWaived) 
      : amountWaived;

    if (amount <= 0) throw new ApiError(400, 'Amount waived must be greater than 0');
    if (amount > Number(invoice.totalAmount)) {
      throw new ApiError(400, 'Waiver amount cannot exceed invoice total');
    }

    // Create the waiver
    const waiver = await prisma.feeWaiver.create({
      data: {
        invoiceId,
        amountWaived: amount,
        reason,
        waiverCategory: waiverCategory || 'OTHER',
        status: 'PENDING',
        createdById: userId
      },
      include: {
        invoice: {
          include: {
            learner: { include: { parent: true } }
          }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    // Notify system that waiver was requested
    await this.notifyWaiverRequested(waiver);

    res.status(201).json({ 
      success: true, 
      data: waiver,
      message: 'Fee waiver request created successfully' 
    });
  }

  /**
   * List all fee waivers with filters
   * GET /api/fees/waivers
   */
  async listWaivers(req: AuthRequest, res: Response) {
    const { status, invoiceId, learnerId, waiverCategory, page = '1', limit = '20' } = req.query;
    const where: any = { archived: false };

    if (status) where.status = status;
    if (invoiceId) where.invoiceId = invoiceId;
    if (waiverCategory) where.waiverCategory = waiverCategory;

    // If filtering by learner, need to join through invoice
    if (learnerId) {
      return this.listWaiversByLearner(req, res, learnerId as string);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [waivers, total] = await Promise.all([
      prisma.feeWaiver.findMany({
        where,
        include: {
          invoice: {
            include: {
              learner: true
            }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.feeWaiver.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        waivers,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  }

  /**
   * Helper: List waivers for a specific learner
   */
  private async listWaiversByLearner(req: AuthRequest, res: Response, learnerId: string) {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      invoice: { learnerId },
      archived: false
    };
    if (status) where.status = status;

    const [waivers, total] = await Promise.all([
      prisma.feeWaiver.findMany({
        where,
        include: {
          invoice: {
            include: {
              learner: true
            }
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          },
          approvedBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.feeWaiver.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        waivers,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  }

  /**
   * Get waiver by ID
   * GET /api/fees/waivers/:id
   */
  async getWaiverById(req: AuthRequest, res: Response) {
    const { id } = req.params;

    const waiver = await prisma.feeWaiver.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            learner: { include: { parent: true } }
          }
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!waiver) throw new ApiError(404, 'Fee waiver not found');

    res.json({ success: true, data: waiver });
  }

  /**
   * Approve a fee waiver
   * PATCH /api/fees/waivers/:id/approve
   */
  async approveWaiver(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) throw new ApiError(401, 'User not authenticated');

    const waiver = await prisma.feeWaiver.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            learner: { include: { parent: true } }
          }
        },
        createdBy: { select: { firstName: true, lastName: true } }
      }
    });

    if (!waiver) throw new ApiError(404, 'Fee waiver not found');
    if (waiver.status !== 'PENDING') {
      throw new ApiError(400, `Cannot approve waiver with status: ${waiver.status}`);
    }

    // Approve waiver + update invoice balance/status atomically
    const [updatedWaiver, updatedInvoice] = await prisma.$transaction(async (tx) => {
      const approved = await tx.feeWaiver.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date()
        },
        include: {
          invoice: {
            include: {
              learner: { include: { parent: true } }
            }
          },
          approvedBy: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Re-read balance INSIDE the transaction — avoids stale data (Bug 1 fix)
      const freshInvoice = await tx.feeInvoice.findUnique({
        where: { id: waiver.invoiceId },
        select: { balance: true, paidAmount: true, totalAmount: true }
      });

      const newBalance = Math.max(0, Number(freshInvoice!.balance) - Number(approved.amountWaived));

      // Recalculate status (Bug 2 fix)
      let newStatus: string;
      if (newBalance <= 0) {
        newStatus = 'PAID';
      } else if (Number(freshInvoice!.paidAmount) > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = 'PENDING';
      }

      const inv = await tx.feeInvoice.update({
        where: { id: waiver.invoiceId },
        data: { balance: newBalance, status: newStatus as any }
      });

      return [approved, inv];
    });

    // Create accounting entry for waived amount
    if (updatedWaiver.amountWaived > 0) {
      await this.recordWaiverInAccounting(updatedWaiver);
    }

    // Notify parent and accountant
    await this.notifyWaiverApproved(updatedWaiver, Number(updatedInvoice.balance));

    res.json({
      success: true,
      data: updatedWaiver,
      message: 'Fee waiver approved successfully'
    });
  }

  /**
   * Reject a fee waiver
   * PATCH /api/fees/waivers/:id/reject
   */
  async rejectWaiver(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user?.userId;

    if (!userId) throw new ApiError(401, 'User not authenticated');
    if (!rejectionReason) {
      throw new ApiError(400, 'rejectionReason is required');
    }

    const waiver = await prisma.feeWaiver.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            learner: { include: { parent: true } }
          }
        }
      }
    });

    if (!waiver) throw new ApiError(404, 'Fee waiver not found');
    if (waiver.status !== 'PENDING') {
      throw new ApiError(400, `Cannot reject waiver with status: ${waiver.status}`);
    }

    const updatedWaiver = await prisma.feeWaiver.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason,
        approvedById: userId,
        approvedAt: new Date()
      },
      include: {
        invoice: {
          include: {
            learner: { include: { parent: true } }
          }
        },
        approvedBy: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Notify requestor and parent
    await this.notifyWaiverRejected(updatedWaiver);

    res.json({
      success: true,
      data: updatedWaiver,
      message: 'Fee waiver rejected successfully'
    });
  }

  /**
   * Delete waiver (soft delete - archive)
   * DELETE /api/fees/waivers/:id
   */
  async deleteWaiver(req: AuthRequest, res: Response) {
    const { id } = req.params;

    const waiver = await prisma.feeWaiver.findUnique({ where: { id } });
    if (!waiver) throw new ApiError(404, 'Fee waiver not found');

    await prisma.feeWaiver.update({
      where: { id },
      data: { archived: true }
    });

    res.json({ success: true, message: 'Fee waiver archived successfully' });
  }

  /**
   * Helper: Record waiver in accounting system
   */
  private async recordWaiverInAccounting(waiver: any) {
    try {
      const school = await prisma.school.findFirst();
      // Create a journal entry for the waived amount
      // This would typically be recorded as expense or discount
      await accountingService.recordTransaction({
        type: 'EXPENSE',
        description: `Fee waiver for ${waiver.invoice.learner.firstName} ${waiver.invoice.learner.lastName} - ${waiver.reason}`,
        amount: Number(waiver.amountWaived),
        category: 'FEE_WAIVER',
        referenceId: waiver.id,
        schoolId: school?.id
      });
    } catch (error) {
      console.error('Failed to record waiver in accounting:', error);
      // Don't throw - waiver should still be approved even if accounting fails
    }
  }

  /**
   * Helper: Notify that waiver was requested
   */
  private async notifyWaiverRequested(waiver: any) {
    try {
      const recipient = await prisma.school.findFirst();
      if (!recipient) return;

      const message = `Fee waiver request received: KES ${waiver.amountWaived} for ${waiver.invoice.learner.firstName} ${waiver.invoice.learner.lastName}. Reason: ${waiver.reason}`;

      // Send SMS if phone available
      if (recipient.phone) {
        await this.smsService.sendSMS(
          recipient.phone,
          message
        );
      }

      // Send WhatsApp if business number available
      if ((recipient as any).whatsappNumber) {
        await whatsappService.sendMessage(
          (recipient as any).whatsappNumber,
          message
        );
      }

      // Email to school admin
      if (recipient.email) {
        await this.emailService.sendEmail({
          to: recipient.email,
          subject: 'New Fee Waiver Request',
          template: 'fee-waiver-requested',
          context: {
            schoolName: recipient.name,
            learnerName: `${waiver.invoice.learner.firstName} ${waiver.invoice.learner.lastName}`,
            amount: waiver.amountWaived,
            reason: waiver.reason,
            invoiceNumber: waiver.invoice.invoiceNumber
          }
        });
      }
    } catch (error) {
      console.error('Failed to notify waiver requested:', error);
    }
  }

  /**
   * Helper: Notify that waiver was approved
   */
  private async notifyWaiverApproved(waiver: any, newBalance: number) {
    try {
      const parent = waiver.invoice?.learner?.parent;
      const school = await prisma.school.findFirst();

      if (!parent) return;

      const message = `Good news! Your fee waiver of KES ${waiver.amountWaived} for ${waiver.invoice.learner.firstName} has been approved. New balance: KES ${newBalance}.`;

      // SMS to parent
      if (parent.phone) {
        await this.smsService.sendSMS(
          parent.phone,
          message
        );
      }

      // WhatsApp to parent
      if ((parent as any).whatsappPhone) {
        await whatsappService.sendMessage(
          (parent as any).whatsappPhone,
          message
        );
      }

      // Email to parent
      if (parent.email) {
        await this.emailService.sendEmail({
          to: parent.email,
          subject: 'Fee Waiver Approved',
          template: 'fee-waiver-approved',
          context: {
            parentName: parent.firstName,
            learnerName: waiver.invoice.learner.firstName,
            amount: waiver.amountWaived,
            newBalance: waiver.invoice.balance,
            schoolName: school?.name
          }
        });
      }
    } catch (error) {
      console.error('Failed to notify waiver approved:', error);
    }
  }

  /**
   * Helper: Notify that waiver was rejected
   */
  private async notifyWaiverRejected(waiver: any) {
    try {
      const parent = waiver.invoice?.learner?.parent;
      const school = await prisma.school.findFirst();

      if (!parent) return;

      const message = `Your fee waiver request of KES ${waiver.amountWaived} for ${waiver.invoice.learner.firstName} has been declined. Reason: ${waiver.rejectionReason}`;

      // SMS to parent
      if (parent.phone) {
        await this.smsService.sendSMS(
          parent.phone,
          message
        );
      }

      // WhatsApp to parent
      if ((parent as any).whatsappPhone) {
        await whatsappService.sendMessage(
          (parent as any).whatsappPhone,
          message
        );
      }

      // Email to parent
      if (parent.email) {
        await this.emailService.sendEmail({
          to: parent.email,
          subject: 'Fee Waiver Declined',
          template: 'fee-waiver-rejected',
          context: {
            parentName: parent.firstName,
            learnerName: waiver.invoice.learner.firstName,
            amount: waiver.amountWaived,
            reason: waiver.rejectionReason,
            schoolName: school?.name
          }
        });
      }
    } catch (error) {
      console.error('Failed to notify waiver rejected:', error);
    }
  }
}

export const feeWaiverController = new FeeWaiverController();
