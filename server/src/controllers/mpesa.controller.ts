import { Request, Response } from 'express';
import { mpesaService } from '../services/mpesa.service';
import prisma from '../config/database';
import messageService from '../services/message.service';
import { resolveOrganicPayment, applyPaymentToInvoice, normalizePhone } from '../services/payment-resolver.service';

export const initiatePayment = async (req: Request, res: Response) => {
    const { phoneNumber, amount, studentId, invoiceId } = req.body;

    if (!phoneNumber || !amount) {
        return res.status(400).json({ success: false, message: 'Phone number and amount are required' });
    }

    try {
        const result = await mpesaService.initiateStkPush({
            phoneNumber,
            amount,
            studentId,
            invoiceId
        });

        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Handle M-Pesa Callback (Public Endpoint)
 * Handles both:
 *  1. STK Push callbacks (Daraja + Kopo Kopo) — transaction pre-exists in DB
 *  2. Organic Buy Goods till payments (Kopo Kopo) — no pre-existing transaction
 */
export const handleCallback = async (req: Request, res: Response) => {
    let provider = 'daraja';
    let checkoutRequestId: string | null = null;
    let externalId: string | null = null;

    if (req.body.Body?.stkCallback) {
        provider = 'daraja';
        checkoutRequestId = req.body.Body.stkCallback.CheckoutRequestID;
    } else if (req.body.data?.attributes?.event?.type) {
        provider = 'kopokopo';
        externalId = req.body.data.id;
    }

    console.log(`[MpesaCallback] Provider: ${provider} | ID: ${checkoutRequestId || externalId}`);

    try {
        // ── 1. Try to find a pre-existing (STK-initiated) transaction ───────────
        const transaction = await prisma.mpesaTransaction.findFirst({
            where: provider === 'daraja'
                ? { checkoutRequestId }
                : { externalId }
        });

        // ── 2. Parse payload ────────────────────────────────────────────────────
        let isSuccess = false;
        let amount = 0;
        let receipt = '';
        let phone = '';
        let resultCode: any = null;
        let resultDesc: any = null;

        if (provider === 'daraja') {
            const callbackData = req.body.Body.stkCallback;
            resultCode = callbackData.ResultCode;
            resultDesc = callbackData.ResultDesc;
            isSuccess = resultCode === 0;

            if (isSuccess && callbackData.CallbackMetadata) {
                const metadata = callbackData.CallbackMetadata.Item;
                amount = Number(metadata.find((i: any) => i.Name === 'Amount')?.Value ?? 0);
                receipt = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value ?? '';
                phone = String(metadata.find((i: any) => i.Name === 'PhoneNumber')?.Value ?? '');
            }
        } else {
            // Kopo Kopo
            const attributes = req.body.data.attributes;
            isSuccess = attributes.status === 'Success';
            resultCode = isSuccess ? 0 : 1;
            resultDesc = attributes.status;

            if (isSuccess && attributes.event?.resource) {
                const resource = attributes.event.resource;
                amount = Number(resource.amount ?? 0);
                receipt = resource.reference ?? '';
                phone = String(resource.sender_phone_number || resource.destination_reference || '');
            }
        }

        // ── 3. STK-initiated flow (transaction exists) ────────────────────────
        if (transaction) {
            // Log raw callback
            await prisma.mpesaCallback.create({
                data: { transactionId: transaction.id, rawBody: req.body }
            });

            if (isSuccess) {
                await prisma.mpesaTransaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'SUCCESS',
                        resultCode,
                        resultDesc,
                        transactionId: receipt || null,
                        phoneNumber: phone || null,
                        metadata: { amount, phone, receipt }
                    }
                });

                // If tied to a specific invoice, apply directly
                if (transaction.invoiceId) {
                    const systemUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

                    await prisma.feePayment.create({
                        data: {
                            invoiceId: transaction.invoiceId,
                            amount,
                            paymentMethod: 'MPESA',
                            receiptNumber: `MPESA-${receipt}`,
                            referenceNumber: receipt,
                            notes: `M-Pesa STK Push via ${phone}`,
                            recordedBy: systemUser?.id || ''
                        }
                    });

                    await prisma.feeInvoice.update({
                        where: { id: transaction.invoiceId },
                        data: {
                            paidAmount: { increment: amount },
                            balance: { decrement: amount }
                        }
                    });

                    const updatedInvoice = await prisma.feeInvoice.findUnique({ where: { id: transaction.invoiceId } });
                    if (updatedInvoice && Number(updatedInvoice.balance) <= 0) {
                        await prisma.feeInvoice.update({ where: { id: transaction.invoiceId }, data: { status: 'PAID' } });
                    }

                    // SMS receipt
                    try {
                        const school = await prisma.school.findFirst();
                        const msg = `Payment of KES ${amount.toLocaleString()} received. Invoice: ${updatedInvoice?.invoiceNumber}. Receipt: ${receipt}. Thank you, ${school?.name || 'Zawadi SMS'}.`;
                        await messageService.createAndDispatchMessage({
                            senderId: 'system',
                            senderType: 'ADMIN',
                            recipientType: 'INDIVIDUAL',
                            recipients: [{ recipientPhone: phone }],
                            body: msg,
                            messageType: 'SMS'
                        });
                    } catch (notifErr) {
                        console.error('[MpesaCallback] SMS error:', notifErr);
                    }
                }

                console.log(`[MpesaCallback] STK success: ${transaction.id} | receipt: ${receipt}`);
            } else {
                await prisma.mpesaTransaction.update({
                    where: { id: transaction.id },
                    data: { status: 'FAILED', resultCode, resultDesc }
                });
                console.log(`[MpesaCallback] STK failed: ${resultDesc}`);
            }

            return res.json({ success: true });
        }

        // ── 4. Organic Buy Goods payment (no pre-existing transaction) ────────
        if (isSuccess && phone && amount > 0 && receipt) {
            console.log(`[MpesaCallback] Organic Buy Goods payment detected: ${phone} → KES ${amount} (${receipt})`);

            const { outcome, detail } = await resolveOrganicPayment({
                rawPhone: phone,
                amount,
                receipt,
                rawPayload: req.body
            });

            console.log(`[MpesaCallback] Organic resolution: ${outcome} — ${detail}`);
        }

        return res.json({ success: true });

    } catch (error: any) {
        console.error('[MpesaCallback] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ─── Unmatched Payments — list ───────────────────────────────────────────────
export const getUnmatchedPayments = async (req: Request, res: Response) => {
    try {
        const { status = 'PENDING', page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const [records, total] = await Promise.all([
            prisma.unmatchedPayment.findMany({
                where: { status: status as any },
                orderBy: { createdAt: 'desc' },
                skip,
                take: Number(limit)
            }),
            prisma.unmatchedPayment.count({ where: { status: status as any } })
        ]);

        res.json({ success: true, data: records, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Unmatched Payments — pending count ─────────────────────────────────────
export const getUnmatchedCount = async (req: Request, res: Response) => {
    try {
        const count = await prisma.unmatchedPayment.count({ where: { status: 'PENDING' } });
        res.json({ success: true, count });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Unmatched Payments — resolve ───────────────────────────────────────────
export const resolveUnmatchedPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { learnerId, invoiceId } = req.body;
    const userId = (req as any).user?.id;

    if (!learnerId || !invoiceId) {
        return res.status(400).json({ success: false, message: 'learnerId and invoiceId are required' });
    }

    try {
        const unmatched = await prisma.unmatchedPayment.findUnique({ where: { id } });
        if (!unmatched || unmatched.status !== 'PENDING') {
            return res.status(404).json({ success: false, message: 'Unmatched payment not found or already resolved' });
        }

        // Verify the target invoice belongs to the learner
        const invoice = await prisma.feeInvoice.findFirst({ where: { id: invoiceId, learnerId }, include: { learner: true } });
        if (!invoice) {
            return res.status(400).json({ success: false, message: 'Invoice does not belong to the specified learner' });
        }

        const systemUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

        // Apply payment
        await prisma.feePayment.create({
            data: {
                invoiceId,
                amount: unmatched.amount,
                paymentMethod: 'MPESA',
                receiptNumber: `MPESA-${unmatched.receiptNo}`,
                referenceNumber: unmatched.receiptNo,
                notes: `Manually assigned from unmatched payment queue (phone: ${unmatched.phone})`,
                recordedBy: systemUser?.id || userId || ''
            }
        });

        await prisma.feeInvoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: { increment: unmatched.amount },
                balance: { decrement: unmatched.amount }
            }
        });

        const updated = await prisma.feeInvoice.findUnique({ where: { id: invoiceId } });
        if (updated && Number(updated.balance) <= 0) {
            await prisma.feeInvoice.update({ where: { id: invoiceId }, data: { status: 'PAID' } });
        } else if (updated && Number(updated.paidAmount) > 0) {
            await prisma.feeInvoice.update({ where: { id: invoiceId }, data: { status: 'PARTIAL' } });
        }

        // Mark as resolved
        await prisma.unmatchedPayment.update({
            where: { id },
            data: {
                status: 'RESOLVED',
                resolvedLearnerId: learnerId,
                resolvedInvoiceId: invoiceId,
                resolvedBy: userId,
                resolvedAt: new Date()
            }
        });

        // SMS receipt
        try {
            const school = await prisma.school.findFirst();
            const learner = invoice.learner;
            const name = learner ? `${learner.firstName} ${learner.lastName}` : 'your child';
            const msg = `Payment of KES ${Number(unmatched.amount).toLocaleString()} received for ${name}. Receipt: ${unmatched.receiptNo}. Balance: KES ${Math.max(0, Number(updated?.balance ?? 0)).toLocaleString()}. Thank you, ${school?.name || 'Zawadi SMS'}.`;
            await messageService.createAndDispatchMessage({
                senderId: 'system',
                senderType: 'ADMIN',
                recipientType: 'INDIVIDUAL',
                recipients: [{ recipientPhone: unmatched.phone }],
                body: msg,
                messageType: 'SMS'
            });
        } catch (e) {
            console.error('[ResolveUnmatched] SMS error:', e);
        }

        res.json({ success: true, message: 'Payment resolved and applied to invoice' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Unmatched Payments — dismiss ───────────────────────────────────────────
export const dismissUnmatchedPayment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { note } = req.body;
    const userId = (req as any).user?.id;

    try {
        const unmatched = await prisma.unmatchedPayment.findUnique({ where: { id } });
        if (!unmatched || unmatched.status !== 'PENDING') {
            return res.status(404).json({ success: false, message: 'Payment not found or already actioned' });
        }

        await prisma.unmatchedPayment.update({
            where: { id },
            data: {
                status: 'DISMISSED',
                note: note || 'Dismissed by admin',
                resolvedBy: userId,
                resolvedAt: new Date()
            }
        });

        res.json({ success: true, message: 'Payment dismissed' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Initiate Bulk Payout
 */
export const initiateBulkPayout = async (req: Request, res: Response) => {
    const { payrollRecordIds } = req.body;

    if (!payrollRecordIds || !Array.isArray(payrollRecordIds)) {
        return res.status(400).json({ success: false, message: 'Array of payrollRecordIds is required' });
    }

    try {
        const records = await prisma.payrollRecord.findMany({
            where: { id: { in: payrollRecordIds } },
            include: { user: true }
        });

        const results = [];
        for (const record of records) {
            if (!record.user.phone) {
                results.push({ id: record.id, success: false, message: 'User has no phone number' });
                continue;
            }

            const payoutResult = await mpesaService.initiatePayout({
                phoneNumber: record.user.phone,
                amount: Number(record.netSalary),
                staffId: record.userId,
                payrollRecordId: record.id,
                reason: `Salary ${record.month}/${record.year}`
            });

            results.push({ id: record.id, ...payoutResult });
        }

        res.json({ success: true, results });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
