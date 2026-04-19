import { Request, Response } from 'express';
import { mpesaService } from '../services/mpesa.service';
import prisma from '../config/database';

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
 * Handle M-Pesa STK Push Callback (Public Endpoint)
 */
export const handleCallback = async (req: Request, res: Response) => {
    const callbackData = req.body.Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callbackData;

    console.log(`[MpesaCallback] Processing ${CheckoutRequestID} | Result: ${ResultCode} (${ResultDesc})`);

    try {
        // Find the transaction
        const transaction = await prisma.$transaction.findUnique({
            where: { checkoutRequestId: CheckoutRequestID }
        });

        if (!transaction) {
            console.error(`[MpesaCallback] Transaction not found for CheckoutRequestID: ${CheckoutRequestID}`);
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        // Log the raw callback
        await prisma.mpesaCallback.create({
            data: {
                transactionId: transaction.id,
                rawBody: req.body
            }
        });

        if (ResultCode === 0) {
            // Success
            const metadata = CallbackMetadata.Item;
            const amount = metadata.find((i: any) => i.Name === 'Amount')?.Value;
            const receipt = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
            const phone = metadata.find((i: any) => i.Name === 'PhoneNumber')?.Value;

            await prisma.$transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'SUCCESS',
                    resultCode: ResultCode,
                    resultDesc: ResultDesc,
                    transactionId: receipt,
                    metadata: { amount, phone, receipt }
                }
            });

            // Trigger FeePayment creation if linked to an invoice
            if (transaction.invoiceId) {
                // Determine who recorded this (System/M-Pesa)
                const systemUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });

                await prisma.feePayment.create({
                    data: {
                        invoiceId: transaction.invoiceId,
                        amount: amount || transaction.amount,
                        paymentMethod: 'MPESA',
                        receiptNumber: `MPESA-${receipt}`,
                        referenceNumber: receipt,
                        notes: `M-Pesa STK Push Payment via ${phone}`,
                        recordedBy: systemUser?.id || 'SYSTEM'
                    }
                });

                // Logic to update invoice balance is usually handled via Prisma middlewares or service methods
                // Assuming fee.service handles balance updates or we trigger it here:
                await prisma.feeInvoice.update({
                    where: { id: transaction.invoiceId },
                    data: {
                        paidAmount: { increment: amount || transaction.amount },
                        balance: { decrement: amount || transaction.amount }
                    }
                });

                // Update invoice status if fully paid
                const updatedInvoice = await prisma.feeInvoice.findUnique({ where: { id: transaction.invoiceId } });
                if (updatedInvoice && Number(updatedInvoice.balance) <= 0) {
                    await prisma.feeInvoice.update({
                        where: { id: transaction.invoiceId },
                        data: { status: 'PAID' }
                    });
                }
            }

            console.log(`[MpesaCallback] Payment successful for ${transaction.id} | Receipt: ${receipt}`);
        } else {
            // Failure
            await prisma.$transaction.update({
                where: { id: transaction.id },
                data: {
                    status: 'FAILED',
                    resultCode: ResultCode,
                    resultDesc: ResultDesc
                }
            });
            console.log(`[MpesaCallback] Payment failed: ${ResultDesc}`);
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('[MpesaCallback] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
