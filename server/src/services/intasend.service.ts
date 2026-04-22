import axios from 'axios';
import prisma from '../config/database';
import { decrypt } from '../utils/encryption.util';
import { ApiError } from '../utils/error.util';

export class IntaSendService {
    private static async getConfig() {
        const config = await prisma.communicationConfig.findFirst();
        if (!config || !config.mpesaEnabled) {
            throw new ApiError(400, 'M-Pesa payments are not enabled for this institution.');
        }

        const publicKey = config.mpesaPublicKey;
        const secretKey = config.mpesaSecretKey ? decrypt(config.mpesaSecretKey) : null;

        if (!publicKey || !secretKey) {
            throw new ApiError(400, 'M-Pesa configuration is incomplete (missing keys).');
        }

        return {
            publicKey,
            secretKey,
            sandbox: config.mpesaSandbox,
            baseUrl: config.mpesaSandbox 
                ? 'https://sandbox.intasend.com/api/v1' 
                : 'https://payment.intasend.com/api/v1'
        };
    }

    /**
     * Initialize M-Pesa STK Push
     * @param phoneNumber - Parent's M-Pesa phone number (2547XXXXXXXX)
     * @param amount - Amount to pay
     * @param identifier - Unique identifier (invoice number or combo)
     */
    static async initiateStkPush(phoneNumber: string, amount: number, identifier: string) {
        const config = await this.getConfig();
        
        // Ensure phone number starts with 254
        let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+')) {
            formattedPhone = formattedPhone.substring(1);
        }
        
        if (!formattedPhone.startsWith('254')) {
            formattedPhone = '254' + formattedPhone;
        }

        try {
            const response = await axios.post(`${config.baseUrl}/payment/mpesa-stk-push/`, {
                public_key: config.publicKey,
                amount: amount,
                phone_number: formattedPhone,
                api_ref: identifier
            }, {
                headers: {
                    'Authorization': `Bearer ${config.secretKey}`
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('IntaSend STK Push Error:', error.response?.data || error.message);
            const message = error.response?.data?.errors?.[0]?.message || 'Failed to initiate M-Pesa prompt. Please try again.';
            throw new ApiError(400, message);
        }
    }

    /**
     * Check transaction status
     * @param invoiceId - The IntaSend Invoice ID (from STK push response)
     */
    static async checkStatus(invoiceId: string) {
        const config = await this.getConfig();

        try {
            const response = await axios.get(`${config.baseUrl}/payment/status/${invoiceId}/`, {
                headers: {
                    'Authorization': `Bearer ${config.secretKey}`
                }
            });

            return response.data;
        } catch (error: any) {
            console.error('IntaSend Status Check Error:', error.response?.data || error.message);
            throw new ApiError(400, 'Failed to verify payment status.');
        }
    }
}
