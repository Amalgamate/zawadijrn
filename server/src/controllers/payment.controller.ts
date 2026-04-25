import { Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { IntaSendService } from '../services/intasend.service';
import { ApiError } from '../utils/error.util';
import prisma from '../config/database';
import { FeeController } from './fee.controller';

import logger from '../utils/logger';
const feeController = new FeeController();

export class PaymentController {
    /**
     * Initiate M-Pesa STK Push
     */
    async initiateStkPush(req: AuthRequest, res: Response) {
        const { amount, phoneNumber, invoiceId } = req.body;
        const userId = req.user!.userId;

        if (!amount || !phoneNumber || !invoiceId) {
            throw new ApiError(400, 'Missing required fields: amount, phoneNumber, invoiceId');
        }

        const invoice = await prisma.feeInvoice.findUnique({
            where: { id: invoiceId },
            include: { learner: true }
        });

        if (!invoice) throw new ApiError(404, 'Invoice not found');

        // Initiate STK Push via IntaSend
        const identifier = `PAY-${invoice.invoiceNumber}-${Date.now()}`;
        const result = await IntaSendService.initiateStkPush(phoneNumber, amount, identifier);

        // We can track this "checkout" in our DB if needed, but for now we rely on IntaSend's invoice ID
        res.json({
            success: true,
            message: 'STK Push initiated. Please check your phone.',
            data: {
                checkoutId: result.invoice.invoice_id,
                apiRef: identifier
            }
        });
    }

    /**
     * Check STK Push status and record payment if successful
     */
    async checkStatusAndRecord(req: AuthRequest, res: Response) {
        const { checkoutId, invoiceId } = req.params;
        const userId = req.user!.userId;

        const statusResult = await IntaSendService.checkStatus(checkoutId);
        
        // IntaSend status: 'COMPLETE', 'FAILED', 'PENDING', 'PROCESSING'
        const state = statusResult.invoice.state;

        if (state === 'COMPLETE') {
            // Check if this payment was already recorded to prevent duplicates
            const existingPayment = await prisma.feePayment.findFirst({
                where: { referenceNumber: checkoutId }
            });

            if (existingPayment) {
                return res.json({
                    success: true,
                    status: 'COMPLETE',
                    message: 'Payment already recorded.',
                    data: statusResult
                });
            }

            // Map IntaSend state to record payment
            // We use the recordPayment logic from FeeController but we simulate the request
            const mockReq = {
                user: { userId },
                body: {
                    invoiceId: invoiceId,
                    amount: Number(statusResult.invoice.net_amount),
                    paymentMethod: 'MPESA',
                    referenceNumber: checkoutId,
                    notes: `M-Pesa STK Push via IntaSend (${statusResult.invoice.invoice_id})`
                }
            } as AuthRequest;

            // Since recordPayment is a complex method, we'll call it or re-implement the core logic
            // Re-implementing core logic to ensure consistency without circular dependencies or mock issues
            try {
                // We'll use a transaction for reliability
                const recordResult = await prisma.$transaction(async (tx) => {
                    // Logic similar to fee.controller.ts:recordPayment
                    const invoice = await tx.feeInvoice.findUnique({ where: { id: invoiceId } });
                    if (!invoice) throw new Error('Invoice not found during record');

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
                            invoiceId,
                            amount: Number(statusResult.invoice.net_amount),
                            paymentMethod: 'MPESA',
                            referenceNumber: checkoutId,
                            notes: `Automated M-Pesa Payment (${checkoutId})`,
                            recordedBy: userId
                        }
                    });

                    const tuitionAmount = Number(statusResult.invoice.net_amount);
                    const updatedInvoice = await tx.feeInvoice.update({
                        where: { id: invoiceId },
                        data: {
                            paidAmount: { increment: tuitionAmount },
                            balance: { decrement: tuitionAmount }
                        }
                    });

                    // Update status
                    let newStatus = updatedInvoice.status;
                    if (Number(updatedInvoice.paidAmount) >= Number(updatedInvoice.totalAmount)) {
                        newStatus = 'PAID';
                    } else if (Number(updatedInvoice.paidAmount) > 0) {
                        newStatus = 'PARTIAL';
                    }

                    await tx.feeInvoice.update({
                        where: { id: invoiceId },
                        data: { status: newStatus as any }
                    });

                    return payment;
                });

                return res.json({
                    success: true,
                    status: 'COMPLETE',
                    message: 'Payment verified and recorded successfully.',
                    data: recordResult
                });
            } catch (err: any) {
                logger.error('Error recording automated payment:', err);
                throw new ApiError(500, 'Payment verified but failed to record. Please contact support.');
            }
        }

        res.json({
            success: true,
            status: state,
            message: `Payment is currently ${state}.`,
            data: statusResult
        });
    }
}
