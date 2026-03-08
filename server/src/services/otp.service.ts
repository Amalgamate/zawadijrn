import { SmsService } from './sms.service';
import prisma from '../config/database';
import { SMS_MESSAGES, OTP_CONFIG } from '../config/communication.messages';
import crypto from 'crypto';
import fs from 'fs';

interface OtpResult {
    success: boolean;
    message: string;
    expiresAt?: Date;
}

interface OtpVerifyResult {
    success: boolean;
    message: string;
    user?: any;
}

export class OtpService {
    // OTP Configuration
    private static readonly OTP_LENGTH = 6;
    private static readonly OTP_EXPIRY_MINUTES = 5;

    /**
     * Generate a 6-digit OTP code
     */
    private static generateOTP(): string {
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Send OTP to user's phone
     */
    static async sendOTP(email: string): Promise<OtpResult> {
        try {
            const logMsg = `[${new Date().toISOString()}] OTP Request for: ${email}\n`;
            fs.appendFileSync('otp-debug.log', logMsg);

            console.log(`📱 OTP Request for: ${email}`);

            // 1. Find user by email
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    status: true
                }
            });

            if (!user) {
                return { success: false, message: 'User not found' };
            }

            if (user.status !== 'ACTIVE') {
                return { success: false, message: 'Account is not active' };
            }

            if (!user.phone) {
                return { success: false, message: 'No phone number registered' };
            }

            // 2. Generate OTP
            const otpCode = this.generateOTP();
            const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

            // Log OTP for development/testing
            fs.appendFileSync('otp-debug.log', `[${new Date().toISOString()}] GENERATED OTP FOR ${email}: ${otpCode}\n`);
            console.log(`🔑 Generated OTP for ${email}: ${otpCode}`);

            // 3. Store OTP in database
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    phoneVerificationCode: otpCode,
                    phoneVerificationSentAt: new Date()
                }
            });

            // 4. Send SMS (async)
            const message = SMS_MESSAGES.otp(otpCode, OTP_CONFIG.expiryMinutes);

            SmsService.sendSms(
                user.phone,
                message
            ).catch((error: any) => {
                console.warn(`⚠️ SMS failed for ${email}: ${error.message}`);
                fs.appendFileSync('otp-debug.log', `SMS FAILED: ${error.message}\n`);
            });

            return {
                success: true,
                message: `OTP sent to ${this.maskPhoneNumber(user.phone)}.`,
                expiresAt
            };

        } catch (error: any) {
            console.error('OTP Send Error:', error);
            return { success: false, message: 'Failed to send OTP' };
        }
    }

    /**
     * Verify OTP and return user data
     */
    static async verifyOTP(email: string, otp: string): Promise<OtpVerifyResult> {
        try {
            // 1. Find user
            const user = await prisma.user.findUnique({
                where: { email }
            });

            if (!user) return { success: false, message: 'User not found' };

            // 2. Check if OTP exists
            if (!user.phoneVerificationCode || !user.phoneVerificationSentAt) {
                return { success: false, message: 'No OTP sent' };
            }

            // 3. Check if OTP has expired
            const sentAt = new Date(user.phoneVerificationSentAt);
            const expiryTime = new Date(sentAt.getTime() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

            if (new Date() > expiryTime) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { phoneVerificationCode: null, phoneVerificationSentAt: null }
                });
                return { success: false, message: 'OTP has expired' };
            }

            // 4. Verify OTP
            if (user.phoneVerificationCode !== otp) {
                return { success: false, message: 'Invalid OTP code' };
            }

            // 5. Clear OTP
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    phoneVerificationCode: null,
                    phoneVerificationSentAt: null,
                    emailVerified: true
                }
            });

            // 6. Return user data
            return {
                success: true,
                message: 'OTP verified successfully',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    status: user.status,
                    phone: user.phone
                }
            };

        } catch (error: any) {
            console.error('OTP Verify Error:', error);
            return { success: false, message: 'Verification failed' };
        }
    }

    private static maskPhoneNumber(phone: string): string {
        if (!phone || phone.length < 8) return phone;
        const start = phone.substring(0, 3);
        const end = phone.substring(phone.length - 4);
        return `${start}****${end}`;
    }

    static async canRequestOTP(email: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { phoneVerificationSentAt: true }
            });
            if (!user || !user.phoneVerificationSentAt) return { allowed: true };
            const COOLDOWN_SECONDS = 60;
            const timeSinceLastOTP = (Date.now() - new Date(user.phoneVerificationSentAt).getTime()) / 1000;
            if (timeSinceLastOTP < COOLDOWN_SECONDS) {
                return { allowed: false, waitSeconds: Math.ceil(COOLDOWN_SECONDS - timeSinceLastOTP) };
            }
            return { allowed: true };
        } catch (error) {
            return { allowed: true };
        }
    }
}
