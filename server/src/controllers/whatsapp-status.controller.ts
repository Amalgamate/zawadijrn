/**
 * WhatsApp Status Controller
 * Handles WhatsApp connection status and QR code retrieval
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { whatsappService } from '../services/whatsapp.service';
import { ApiError } from '../utils/error.util';

class WhatsAppStatusController {
    /**
     * Get WhatsApp connection status
     */
    async getStatus(req: AuthRequest, res: Response) {
        try {
            const status = whatsappService.getStatus();

            res.json({
                success: true,
                data: {
                    status: status.status,
                    hasQRCode: !!status.qrCode
                }
            });
        } catch (error: any) {
            console.error('[WhatsApp Status] Error getting status:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get WhatsApp status',
                    error: error.message
                });
            }
        }
    }

    /**
     * Get QR code for authentication
     */
    async getQRCode(req: AuthRequest, res: Response) {
        try {
            const status = whatsappService.getStatus();

            if (!status.qrCode) {
                return res.json({
                    success: false,
                    message: 'No QR code available',
                    data: { qrCode: null }
                });
            }

            res.json({
                success: true,
                data: {
                    qrCode: status.qrCode,
                    status: status.status
                }
            });
        } catch (error: any) {
            console.error('[WhatsApp Status] Error getting QR code:', error);
            if (error instanceof ApiError) {
                res.status(error.statusCode).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to get QR code',
                    error: error.message
                });
            }
        }
    }
}

export const whatsappStatusController = new WhatsAppStatusController();
