import prisma from '../config/database';
import { darajaService } from './daraja.service';
import { kopokopoService } from './kopokopo.service';
import { IntaSendService } from './intasend.service';

class MpesaService {
    /**
     * Determine the active provider from configuration
     */
    async getProvider() {
        const config = await prisma.communicationConfig.findFirst();
        // Priority to Kopo Kopo if enabled or explicitly set
        if (config?.mpesaProvider === 'kopokopo') return 'kopokopo';
        if (config?.mpesaProvider === 'intasend') return 'intasend';
        return config?.mpesaProvider || 'kopokopo'; // Default to Kopo Kopo as per user request
    }

    /**
     * Initiate STK Push (Unified Interface)
     */
    async initiateStkPush(params: {
        phoneNumber: string;
        amount: number;
        studentId?: string;
        invoiceId?: string;
        firstName?: string;
        lastName?: string;
    }) {
        const provider = await this.getProvider();

        if (provider === 'kopokopo') {
            return kopokopoService.initiateStkPush(params);
        } else if (provider === 'intasend') {
            const identifier = `PAY-${params.invoiceId || 'GEN'}-${Date.now()}`;
            const result = await IntaSendService.initiateStkPush(params.phoneNumber, params.amount, identifier);
            return {
                success: true,
                checkoutRequestId: result.invoice.invoice_id,
                message: 'STK Push initiated'
            };
        } else {
            // Default to Daraja
            return darajaService.initiateStkPush(params);
        }
    }

    /**
     * Initiate Payout (B2C)
     */
    async initiatePayout(params: {
        phoneNumber: string;
        amount: number;
        staffId?: string;
        payrollRecordId?: string;
        reason?: string;
    }) {
        const provider = await this.getProvider();

        if (provider === 'kopokopo') {
            return kopokopoService.initiatePayout(params);
        } else {
            throw new Error(`Payouts are not yet supported for provider: ${provider}`);
        }
    }

    /**
     * Query Transaction Status (Unified Response)
     */
    async queryStatus(transactionId: string) {
        const provider = await this.getProvider();
        
        if (provider === 'daraja') {
            const result = await darajaService.queryStkStatus(transactionId);
            return {
                success: true,
                state: result.ResultCode === '0' ? 'COMPLETE' : (result.ResultCode === '1032' ? 'FAILED' : 'PENDING'),
                raw: result
            };
        }

        if (provider === 'intasend') {
            const result: any = await IntaSendService.checkStatus(transactionId);
            return {
                success: true,
                state: result.invoice?.state || 'PENDING',
                amount: Number(result.invoice?.net_amount || 0),
                receipt: result.invoice?.invoice_id,
                phone: result.invoice?.account,
                raw: result
            };
        }

        if (provider === 'kopokopo') {
            const result = await kopokopoService.queryStkStatus(transactionId);
            const k2status = result.data?.attributes?.status || 'Pending';
            const resource = result.data?.attributes?.event?.resource;
            
            return {
                success: true,
                state: k2status.toUpperCase() === 'SUCCESS' ? 'COMPLETE' : 
                       (['FAILED', 'CANCELLED'].includes(k2status.toUpperCase()) ? 'FAILED' : 'PENDING'),
                amount: Number(resource?.amount || 0),
                receipt: resource?.reference,
                phone: resource?.sender_phone_number || resource?.destination_reference,
                raw: result
            };
        }
        
        throw new Error(`Inquiry not fully implemented for ${provider}`);
    }
}

export const mpesaService = new MpesaService();
