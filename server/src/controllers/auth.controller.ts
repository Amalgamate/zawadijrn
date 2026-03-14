import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { User } from '@prisma/client';
import prisma from '../config/database';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util';
import { ApiError } from '../utils/error.util';
import { Role, canManageRole } from '../config/permissions';
import { AuthRequest } from '../middleware/permissions.middleware';
import { validatePassword, DEFAULT_PASSWORD_POLICY, PARENT_PASSWORD_POLICY, passwordsMatch } from '../utils/password.util';
import { EmailService } from '../services/email-resend.service';
import { whatsappService } from '../services/whatsapp.service';
import { redisCacheService } from '../services/redis-cache.service';

export class AuthController {
  async register(req: AuthRequest, res: Response) {
    const { email, password, firstName, lastName, role, phone } = req.body;

    if (!email || !password || !firstName || !lastName) {
      throw new ApiError(400, 'Missing required fields');
    }

    const isAuthenticatedCreation = !!req.user;
    const requestedRole = (role || 'TEACHER') as Role;

    if (isAuthenticatedCreation) {
      const currentUserRole = req.user!.role;
      if (!canManageRole(currentUserRole, requestedRole)) {
        throw new ApiError(403, `You cannot create users with role: ${requestedRole}`);
      }
      if (['SUPER_ADMIN', 'ADMIN'].includes(requestedRole) && currentUserRole !== 'SUPER_ADMIN') {
        throw new ApiError(403, 'Only SUPER_ADMIN can create admin users');
      }
    } else {
      if (role && role !== 'PARENT') {
        throw new ApiError(403, 'Public registration is only allowed for parent accounts');
      }
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ApiError(400, 'User already exists');

    const passwordPolicy = requestedRole === 'PARENT' ? PARENT_PASSWORD_POLICY : DEFAULT_PASSWORD_POLICY;
    const passwordValidation = validatePassword(password, passwordPolicy);
    if (!passwordValidation.valid) throw new ApiError(400, passwordValidation.errors.join(', '));

    // Reduced bcrypt cost from 12 to 11 for better performance under load
    // Cost 10-11: ~50-100ms per operation, Cost 12: ~100-200ms per operation
    const hashedPassword = await bcrypt.hash(password, 11);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: requestedRole,
        phone: phone || null,
        status: 'ACTIVE'
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    EmailService.sendWelcomeEmail({
      to: email,
      schoolName: 'Zawadi SMS',
      adminName: `${firstName} ${lastName}`,
      loginUrl: `${frontendUrl}/login`
    }).catch(err => console.error('Failed to send welcome email:', err));

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.status(201).json({
      success: true,
      user,
      token: accessToken,
      refreshToken,
      message: 'User registered successfully'
    });
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    // Security: Validate password field doesn't contain XSS patterns
    const xssPatterns = [/<script/gi, /javascript:/gi, /on\w+\s*=/gi, /<iframe/gi];
    if (xssPatterns.some(pattern => pattern.test(password))) {
      throw new ApiError(400, 'Invalid password format');
    }

    // Phase 2 Optimization: Check Redis/Memory cache first (5-minute TTL)
    const cacheKey = `auth:user:${email}`;
    let user = await redisCacheService.get<any>(cacheKey);

    // If not in cache, query database with optimized selection
    if (!user) {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          password: true,
          status: true,
          loginAttempts: true,
          lockedUntil: true,
          role: true,
          // Only load these fields if needed for auth flow
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          lastLogin: true
        }
      });

      // Cache the result for 5 minutes
      if (user) {
        await redisCacheService.set(cacheKey, user, 5 * 60); // 5 minutes
      }
    }

    if (!user) throw new ApiError(401, 'Invalid credentials');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ApiError(403, `Account locked. Try again in ${minutesLeft} minutes`);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      const newAttempts = (user.loginAttempts || 0) + 1;
      const lockAccount = newAttempts >= 5;
      
      // Invalidate cache on failed login
      await redisCacheService.delete(cacheKey);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: lockAccount ? new Date(Date.now() + 15 * 60 * 1000) : null,
        }
      });
      if (lockAccount) throw new ApiError(403, 'Account locked for 15 minutes');
      throw new ApiError(401, 'Invalid credentials');
    }

    if (user.status !== 'ACTIVE') throw new ApiError(403, 'Account is not active');

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Invalidate cache after successful login (data updated)
    await redisCacheService.delete(cacheKey);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), loginAttempts: 0, lockedUntil: null }
    });

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      token: accessToken,
      refreshToken,
      message: 'Login successful'
    });
  }

  async checkAvailability(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email required');

    const user = await prisma.user.findUnique({ where: { email } });
    res.json({ success: true, available: !user });
  }

  async sendWhatsAppVerification(req: Request, res: Response) {
    const { phone } = req.body;
    if (!phone) throw new ApiError(400, 'Phone number required');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // In real app, store OTP in DB/Cache with expiry
    const result = await whatsappService.sendMessage({
      to: phone,
      message: `Your Zawadi SMS verification code is: ${otp}`
    });

    if (!result.success) {
      throw new ApiError(500, result.message || 'Failed to send WhatsApp verification');
    }

    res.json({ success: true, message: 'Verification code sent via WhatsApp' });
  }

  async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || user.status !== 'ACTIVE') throw new ApiError(401, 'Invalid user or account inactive');

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.json({ success: true, token: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Email required');

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: true, message: 'Reset link sent if account exists' });

    const resetToken = randomUUID();
    const resetExpiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: resetToken, passwordResetExpiry: resetExpiry }
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
      await EmailService.sendPasswordReset({
        to: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        schoolName: 'Zawadi SMS',
        resetLink: resetUrl
      });
    } catch (error) {
      console.error('Email failed:', error);
    }

    res.json({ success: true, message: 'Reset link sent if account exists' });
  }

  async resetPassword(req: Request, res: Response) {
    const { token, newPassword, passwordConfirm } = req.body;
    if (!token || !newPassword || !passwordConfirm) throw new ApiError(400, 'Missing fields');
    if (newPassword !== passwordConfirm) throw new ApiError(400, 'Passwords do not match');

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } }
    });

    if (!user) throw new ApiError(400, 'Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, passwordResetToken: null, passwordResetExpiry: null, loginAttempts: 0, lockedUntil: null }
    });

    res.json({ success: true, message: 'Password reset successful' });
  }

  async logout(req: AuthRequest, res: Response) {
    res.json({ success: true, message: 'Logged out' });
  }

  async me(req: AuthRequest, res: Response) {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true, role: true, status: true, createdAt: true
      }
    });

    if (!user) throw new ApiError(404, 'User not found');
    res.json({ success: true, data: user });
  }

  async getSeededUsers(_req: Request, res: Response) {
    if (process.env.NODE_ENV !== 'development') {
      throw new ApiError(403, 'This route is only available in development environment');
    }

    const users = await prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true
      }
    });

    res.json({ success: true, count: users.length, data: users });
  }
}

export const authController = new AuthController();
