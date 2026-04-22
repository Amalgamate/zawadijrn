/**
 * Payment Resolver Service
 * 
 * Handles "organic" Buy Goods Till payments received via Kopo Kopo webhook.
 * Attempts to match the paying phone number to a registered learner/parent,
 * then auto-applies the payment to their oldest outstanding invoice.
 * 
 * If matching is ambiguous (multiple children) or fails (unknown number),
 * the payment is parked in the UnmatchedPayment queue for admin resolution.
 */

import prisma from '../config/database';
import messageService from './message.service';

// ─── Phone normalisation ────────────────────────────────────────────────────
export function normalizePhone(raw: string): string {
    let phone = String(raw).trim().replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    if (phone.startsWith('+')) phone = phone.slice(1);
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (!phone.startsWith('254')) phone = '254' + phone;
    return phone;
}

// ─── Learner finder ─────────────────────────────────────────────────────────
/**
 * Searches ALL learner phone fields for the given normalized phone number.
 * Returns a list of matching learner IDs (may be 0, 1, or many).
 */
export async function findLearnersByPhone(phone: string): Promise<string[]> {
    const learners = await prisma.learner.findMany({
        where: {
            archived: false,
            status: 'ACTIVE',
            OR: [
                { fatherPhone: phone },
                { motherPhone: phone },
                { guardianPhone: phone },
                { primaryContactPhone: phone },
                // Also match the linked parent User's phone
                { parent: { phone: phone } }
            ]
        },
        select: { id: true }
    });

    return learners.map(l => l.id);
}

// ─── Payment application ────────────────────────────────────────────────────
/**
 * Applies a payment to the oldest PENDING/PARTIAL invoice of a given learner.
 * Creates FeePayment, updates invoice balance + status, and sends SMS receipt.
 */
export async function applyPaymentToInvoice(params: {
    learnerId: string;
    amount: number;
    receipt: string;
    phone: string;
}): Promise<{ success: boolean; invoiceId?: string; invoiceNumber?: string }> {
    const { learnerId, amount, receipt, phone } = params;

    // Find oldest unpaid invoice
    const invoice = await prisma.feeInvoice.findFirst({
        where: {
            learnerId,
            status: { in: ['PENDING', 'PARTIAL'] },
            archived: false
        },
        orderBy: { dueDate: 'asc' },
        include: { learner: true }
    });

    if (!invoice) {
        console.warn(`[PaymentResolver] No pending invoice for learner ${learnerId}`);
        return { success: false };
    }

    const systemUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

    // Create payment record
    await prisma.feePayment.create({
        data: {
            invoiceId: invoice.id,
            amount,
            paymentMethod: 'MPESA',
            receiptNumber: `MPESA-${receipt}`,
            referenceNumber: receipt,
            notes: `Auto-matched Buy Goods Till payment from ${phone}`,
            recordedBy: systemUser?.id || ''
        }
    });

    // Update balances
    await prisma.feeInvoice.update({
        where: { id: invoice.id },
        data: {
            paidAmount: { increment: amount },
            balance: { decrement: amount }
        }
    });

    // Refresh to check if fully paid
    const updated = await prisma.feeInvoice.findUnique({ where: { id: invoice.id } });
    if (updated && Number(updated.balance) <= 0) {
        await prisma.feeInvoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID' }
        });
    } else if (updated && Number(updated.paidAmount) > 0) {
        await prisma.feeInvoice.update({
            where: { id: invoice.id },
            data: { status: 'PARTIAL' }
        });
    }

    // Send SMS receipt
    try {
        const school = await prisma.school.findFirst();
        const learner = invoice.learner;
        const name = learner ? `${learner.firstName} ${learner.lastName}` : 'your child';
        const msg = `Payment of KES ${amount.toLocaleString()} received for ${name} — Ref: ${invoice.invoiceNumber}. Receipt: ${receipt}. Balance: KES ${Math.max(0, Number(updated?.balance || 0)).toLocaleString()}. Thank you, ${school?.name || 'Zawadi SMS'}.`;

        await messageService.createAndDispatchMessage({
            senderId: 'system',
            senderType: 'ADMIN',
            recipientType: 'INDIVIDUAL',
            recipients: [{ recipientPhone: phone }],
            body: msg,
            messageType: 'SMS'
        });
    } catch (notifErr) {
        console.error('[PaymentResolver] SMS notification error:', notifErr);
    }

    return { success: true, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber };
}

/**
 * Applies a payment to a SPECIFIC invoice ID.
 */
export async function applyToSpecificInvoice(params: {
    invoiceId: string;
    amount: number;
    receipt: string;
    phone: string;
    recordedBy?: string;
}): Promise<{ success: boolean; invoiceNumber?: string }> {
    const { invoiceId, amount, receipt, phone, recordedBy } = params;

    const invoice = await prisma.feeInvoice.findUnique({
        where: { id: invoiceId },
        include: { learner: true }
    });

    if (!invoice) return { success: false };

    // Create payment record
    await prisma.feePayment.create({
        data: {
            invoiceId: invoice.id,
            amount,
            paymentMethod: 'MPESA',
            receiptNumber: `MPESA-${receipt}`,
            referenceNumber: receipt,
            notes: `M-Pesa payment via ${phone}`,
            recordedBy: recordedBy || ''
        }
    });

    // Update balances
    await prisma.feeInvoice.update({
        where: { id: invoice.id },
        data: {
            paidAmount: { increment: amount },
            balance: { decrement: amount }
        }
    });

    // Refresh to check if fully paid
    const updated = await prisma.feeInvoice.findUnique({ where: { id: invoice.id } });
    if (updated && Number(updated.balance) <= 0) {
        await prisma.feeInvoice.update({
            where: { id: invoice.id },
            data: { status: 'PAID' }
        });
    } else if (updated && Number(updated.paidAmount) > 0) {
        await prisma.feeInvoice.update({
            where: { id: invoice.id },
            data: { status: 'PARTIAL' }
        });
    }

    // SMS Receipt
    try {
        const school = await prisma.school.findFirst();
        const msg = `Payment of KES ${amount.toLocaleString()} received for ${invoice.learner.firstName}. Receipt: ${receipt}. Balance: KES ${Math.max(0, Number(updated?.balance || 0)).toLocaleString()}. Thank you, ${school?.name || 'Zawadi SMS'}.`;
        await messageService.createAndDispatchMessage({
            senderId: 'system',
            senderType: 'ADMIN',
            recipientType: 'INDIVIDUAL',
            recipients: [{ recipientPhone: phone }],
            body: msg,
            messageType: 'SMS'
        });
    } catch (e) {
        console.error('[PaymentResolver] Direct SMS error:', e);
    }

    return { success: true, invoiceNumber: invoice.invoiceNumber };
}

// ─── Park unmatched ─────────────────────────────────────────────────────────
export async function parkAsUnmatched(params: {
    phone: string;
    amount: number;
    receipt: string;
    rawPayload: object;
    note?: string;
}): Promise<void> {
    const { phone, amount, receipt, rawPayload, note } = params;
    try {
        await prisma.unmatchedPayment.upsert({
            where: { receiptNo: receipt },
            update: {},   // Already parked — do not overwrite
            create: {
                phone,
                amount,
                receiptNo: receipt,
                rawPayload,
                note: note || null
            }
        });
        console.log(`[PaymentResolver] Parked unmatched payment: ${receipt} from ${phone}`);
    } catch (err) {
        console.error('[PaymentResolver] Failed to park unmatched payment:', err);
    }
}

// ─── Main resolver ──────────────────────────────────────────────────────────
/**
 * Main entry point: given phone + amount + receipt from a Buy Goods Till webhook,
 * attempt to auto-match and apply; otherwise park as unmatched.
 */
export async function resolveOrganicPayment(params: {
    rawPhone: string;
    amount: number;
    receipt: string;
    rawPayload: object;
}): Promise<{ outcome: 'applied' | 'ambiguous' | 'unmatched'; detail?: string }> {
    const { rawPhone, amount, receipt, rawPayload } = params;
    const phone = normalizePhone(rawPhone);

    console.log(`[PaymentResolver] Resolving organic payment: phone=${phone}, amount=${amount}, receipt=${receipt}`);

    const matchedIds = await findLearnersByPhone(phone);

    if (matchedIds.length === 0) {
        await parkAsUnmatched({ phone, amount, receipt, rawPayload, note: 'No matching phone number found in system' });
        return { outcome: 'unmatched', detail: 'No learner matched' };
    }

    if (matchedIds.length > 1) {
        // Multiple children — park for admin to resolve manually
        await parkAsUnmatched({
            phone, amount, receipt, rawPayload,
            note: `Ambiguous: ${matchedIds.length} learners share this phone number`
        });
        return { outcome: 'ambiguous', detail: `${matchedIds.length} potential learners` };
    }

    // Exactly one learner matched
    const result = await applyPaymentToInvoice({
        learnerId: matchedIds[0],
        amount,
        receipt,
        phone
    });

    if (!result.success) {
        // Matched learner but no outstanding invoice
        await parkAsUnmatched({
            phone, amount, receipt, rawPayload,
            note: 'Matched learner but no outstanding invoice found'
        });
        return { outcome: 'unmatched', detail: 'No outstanding invoice' };
    }

    return { outcome: 'applied', detail: `Applied to invoice ${result.invoiceNumber}` };
}
