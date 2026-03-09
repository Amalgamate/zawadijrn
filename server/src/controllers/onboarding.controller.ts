import { Request, Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { gradingService } from '../services/grading.service';
import { EmailService } from '../services/email-resend.service';
import { SmsService } from '../services/sms.service';
import { encrypt } from '../utils/encryption.util';
import fs from 'fs';

export class OnboardingController {
  async registerSchool(req: Request, res: Response) {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ success: false, error: 'School name is required' });
      }

      // In single-tenant, we might not even have a "School" model to register multiple times, 
      // but if we do, we just create the singleton configuration.

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Default Branch
        const branch = await tx.branch.create({
          data: {
            name: 'Main Campus',
          },
        });

        // 2. Create Admission Sequence
        await tx.admissionSequence.create({
          data: {
            academicYear: new Date().getFullYear(),
            currentValue: 0,
          },
        });

        // 3. Create Default Streams (A, B, C, D)
        const streamNames = ['A', 'B', 'C', 'D'];
        for (const streamName of streamNames) {
          await tx.streamConfig.create({
            data: {
              name: streamName,
              active: true,
            },
          });
        }

        // 4. Create Default Communication Config
        await tx.communicationConfig.create({
          data: {
            smsEnabled: true,
            smsProvider: 'mobilesasa',
            smsBaseUrl: 'https://api.mobilesasa.com',
            smsSenderId: process.env.SMS_SENDER_ID || 'MOBILESASA',
            smsApiKey: process.env.MOBILESASA_API_KEY ? encrypt(process.env.MOBILESASA_API_KEY) : null,
            hasApiKey: !!process.env.MOBILESASA_API_KEY,
          }
        });

        return { branch };
      });

      // 5. Initialize Grading Systems
      try {
        await gradingService.getGradingSystem('SUMMATIVE');
        await gradingService.getGradingSystem('CBC');
      } catch (error) {
        console.warn('Warning: Failed to initialize grading systems:', error);
      }

      res.status(201).json({ success: true, message: 'System provisioned successfully' });
    } catch (error: any) {
      console.error('Onboarding registerSchool error:', error);
      res.status(500).json({ success: false, error: error?.message || 'Failed to register school' });
    }
  }

  async registerFull(req: Request, res: Response) {
    const logFile = 'onboarding-debug.log';
    const log = (msg: string) => fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);

    try {
      const {
        fullName,
        email,
        phone,
        address,
        county,
        subCounty,
        ward,
        schoolName,
        schoolType,
        password,
        passwordConfirm,
      } = req.body;

      log(`Incoming Registration: ${JSON.stringify({ fullName, email, phone, schoolName, address, county })}`);

      if (!fullName || fullName.length < 2 || fullName.length > 100) {
        return res.status(400).json({ success: false, error: 'Invalid full name' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, error: 'Invalid email' });
      }

      const phoneRegex = /^(\+?[1-9]\d{1,14}|0[1-9]\d{8})$/;
      if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ''))) {
        return res.status(400).json({ success: false, error: 'Invalid phone format' });
      }

      if (!address || !county || !schoolName || !password || !passwordConfirm) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      if (password !== passwordConfirm) {
        return res.status(400).json({ success: false, error: 'Passwords do not match' });
      }

      const strong = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

      if (!strong) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters and include uppercase, lowercase, and numbers'
        });
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { phone }] }
      });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email or phone already exists' });
      }

      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Default Branch
        const branch = await tx.branch.create({
          data: {
            name: 'Main Campus',
          },
        });

        // 2. Create Admission Sequence
        await tx.admissionSequence.create({
          data: {
            academicYear: new Date().getFullYear(),
            currentValue: 0,
          },
        });

        // 3. Create Default Streams (A, B, C, D)
        const streamNames = ['A', 'B', 'C', 'D'];
        for (const streamName of streamNames) {
          await tx.streamConfig.create({
            data: {
              name: streamName,
              active: true,
            },
          });
        }

        // 4. Create Default Communication Config
        await tx.communicationConfig.create({
          data: {
            smsEnabled: true,
            smsProvider: 'mobilesasa',
            smsBaseUrl: 'https://api.mobilesasa.com',
            smsApiKey: process.env.MOBILESASA_API_KEY ? encrypt(process.env.MOBILESASA_API_KEY) : null,
            hasApiKey: !!process.env.MOBILESASA_API_KEY,
          }
        });

        // 5. Create Admin User
        const [firstName, ...rest] = fullName.trim().split(' ');
        const lastName = rest.join(' ') || ' ';
        const hashed = await bcrypt.hash(password, 12);
        const token = randomUUID();

        const user = await tx.user.create({
          data: {
            email,
            password: hashed,
            firstName,
            lastName,
            role: 'ADMIN',
            phone,
            emailVerified: false,
            emailVerificationToken: token,
            emailVerificationSentAt: new Date()
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            phone: true,
            createdAt: true
          }
        });

        return { user, token };
      });

      // 6. Initialize Grading Systems
      try {
        await gradingService.getGradingSystem('SUMMATIVE');
        await gradingService.getGradingSystem('CBC');
      } catch (error) {
        console.warn('Warning: Failed to initialize grading systems:', error);
      }

      // 7. Trigger Welcome Notifications
      const frontendUrl = process.env.FRONTEND_URL || 'https://zawadi-sms.up.railway.app';
      const loginUrl = `${frontendUrl}/login`;

      EmailService.sendOnboardingEmail({
        to: result.user.email,
        schoolName: schoolName,
        adminName: `${result.user.firstName} ${result.user.lastName}`,
        loginUrl
      }).catch(err => {
        console.error('❌ Failed to send onboarding email:', err);
      });

      if (result.user.phone) {
        SmsService.sendWelcomeSms(
          result.user.phone,
          schoolName
        ).catch(err => {
          console.error('❌ Failed to send welcome SMS:', err);
        });
      }

      res.status(201).json({
        success: true,
        data: {
          user: result.user
        },
        meta: {
          emailVerificationToken: process.env.NODE_ENV === 'development' ? result.token : undefined
        }
      });
    } catch (error: any) {
      console.error('Onboarding registerFull error:', error);
      res.status(500).json({ success: false, error: 'Failed to register' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query as any;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Missing token' });
      }
      const user = await prisma.user.findFirst({
        where: { emailVerificationToken: String(token) }
      });
      if (!user) {
        return res.status(404).json({ success: false, error: 'Invalid token' });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, status: 'ACTIVE', emailVerificationToken: null }
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Verification failed' });
    }
  }

  async verifyPhone(req: Request, res: Response) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        return res.status(400).json({ success: false, error: 'Missing email or code' });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.phoneVerificationCode !== code) {
        return res.status(400).json({ success: false, error: 'Invalid code' });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerificationCode: null }
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Phone verification failed' });
    }
  }

  async getBranchOptionsByEmail(req: Request, res: Response) {
    try {
      const email = String((req.query as any).email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }
      const branches = await prisma.branch.findMany({
        select: { id: true, name: true }
      });
      res.json({ success: true, branches });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch branch options' });
    }
  }
}
