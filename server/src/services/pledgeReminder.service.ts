/**
 * Pledge Reminder Service — CRON Job
 * New file: server/src/services/pledgeReminder.service.ts
 *
 * Run this daily (e.g. 8:00 AM) via node-cron or your existing CRON_SETUP.
 *
 * Logic:
 *  1. Find all PENDING pledges whose pledgeDate is today or earlier
 *  2. Send SMS/WhatsApp reminder to parent
 *  3. Update reminderSentAt + reminderCount
 *  4. If pledgeDate + 3 days has passed with no payment → mark BROKEN
 */

import prisma from '../config/database';
import { SmsService } from './sms.service';
import { whatsappService } from './whatsapp.service';

export class PledgeReminderService {

  async runDailyCheck(): Promise<void> {
    console.log('[PledgeReminder] Starting daily pledge reminder check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // --- 1. Mark BROKEN: pledge date was 3+ days ago, invoice still unpaid ---
    const brokenCandidates = await (prisma as any).feePledge.findMany({
      where: {
        status: 'PENDING',
        pledgeDate: { lte: threeDaysAgo }
      },
      include: {
        invoice: { select: { status: true } }
      }
    });

    let brokenCount = 0;
    for (const pledge of brokenCandidates) {
      if (!['PAID', 'OVERPAID'].includes(pledge.invoice.status)) {
        await (prisma as any).feePledge.update({
          where: { id: pledge.id },
          data: { status: 'BROKEN' }
        });
        brokenCount++;
      } else {
        // Payment came in — auto-fulfil
        await (prisma as any).feePledge.update({
          where: { id: pledge.id },
          data: { status: 'FULFILLED', fulfilledAt: new Date() }
        });
      }
    }
    console.log(`[PledgeReminder] Marked ${brokenCount} pledge(s) as BROKEN`);

    // --- 2. Auto-fulfil pledges where invoice is now PAID ---
    const paidPledges = await (prisma as any).feePledge.findMany({
      where: {
        status: { in: ['PENDING', 'DUE'] }
      },
      include: {
        invoice: { select: { status: true } }
      }
    });

    let fulfilledCount = 0;
    for (const pledge of paidPledges) {
      if (['PAID', 'OVERPAID'].includes(pledge.invoice.status)) {
        await (prisma as any).feePledge.update({
          where: { id: pledge.id },
          data: { status: 'FULFILLED', fulfilledAt: new Date() }
        });
        fulfilledCount++;
      }
    }
    console.log(`[PledgeReminder] Auto-fulfilled ${fulfilledCount} pledge(s)`);

    // --- 3. Send reminders for pledges due today or overdue (not yet BROKEN) ---
    const dueForReminder = await (prisma as any).feePledge.findMany({
      where: {
        status: 'PENDING',
        pledgeDate: { lte: today },
        // Don't spam — only remind once per day
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lt: today } }
        ]
      },
      include: {
        invoice: {
          include: {
            learner: {
              select: {
                firstName: true,
                lastName: true,
                primaryContactPhone: true,
                guardianPhone: true,
                primaryContactName: true
              }
            }
          }
        }
      }
    });

    console.log(`[PledgeReminder] Sending reminders for ${dueForReminder.length} pledge(s)...`);

    let sentCount = 0;
    for (const pledge of dueForReminder) {
      const learner = pledge.invoice.learner;
      const phone = learner.primaryContactPhone || learner.guardianPhone;
      if (!phone) continue;

      const parentName = learner.primaryContactName || 'Parent/Guardian';
      const amount = Number(pledge.pledgedAmount).toLocaleString('en-KE');
      const pledgeDateStr = new Date(pledge.pledgeDate).toLocaleDateString('en-GB');

      const message = `Dear ${parentName}, this is a reminder that you pledged to pay KES ${amount} for ${learner.firstName}'s school fees by ${pledgeDateStr}. Please make the payment at your earliest convenience.`;

      try {
        await SmsService.sendSms(phone, message);
        sentCount++;
      } catch (e) {
        console.error(`[PledgeReminder] SMS failed for pledge ${pledge.id}:`, e);
      }

      // Try WhatsApp too (non-blocking)
      try {
        await whatsappService.sendMessage({ to: phone, message });
      } catch (_) { /* silently ignore */ }

      // Update reminder metadata
      await (prisma as any).feePledge.update({
        where: { id: pledge.id },
        data: {
          reminderSentAt: new Date(),
          reminderCount: { increment: 1 },
          status: 'DUE'  // escalate status to DUE once pledge date is reached
        }
      });

      // Add a REMINDER_SENT comment to the invoice timeline
      await (prisma as any).feeComment.create({
        data: {
          invoiceId: pledge.invoiceId,
          type: 'REMINDER_SENT',
          body: `Pledge reminder sent to ${parentName} (${phone}) for KES ${amount} pledged by ${pledgeDateStr}.`,
          isInternal: true,
          createdById: pledge.createdById  // system uses original creator's ID
        }
      });
    }

    console.log(`[PledgeReminder] Done. Sent ${sentCount} reminder(s).`);
  }
}

export const pledgeReminderService = new PledgeReminderService();
