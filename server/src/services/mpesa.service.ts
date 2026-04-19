import prisma from '../config/database';
import { darajaService } from './daraja.service';
import { kopokopoService } from './kopokopo.service';

class MpesaService {
    /**
     * Determine the active provider from configuration
     */
    async getProvider() {
        const config = await prisma.communicationConfig.findFirst();
        return config?.mpesaProvider || 'daraja';
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
     * Query Transaction Status (Unified)
     */
    async queryStatus(transactionId: string) {
        const provider = await this.getProvider();
        
        if (provider === 'daraja') {
            return darajaService.queryStkStatus(transactionId);
        }
        
        // For Kopo Kopo, status inquiry is typically done via their GET resource endpoint
        // but we mainly rely on webhooks.
        throw new Error(`Inquiry not fully implemented for ${provider}`);
    }
}

export const mpesaService = new MpesaService();
