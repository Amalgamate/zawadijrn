/**
 * Learner Controller — single-tenant
 */

import { Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';
import { LearnerStatus, Gender } from '@prisma/client';
import { generateAdmissionNumber } from '../services/admissionNumber.service';
import { feeService } from '../services/fee.service';
import { SmsService } from '../services/sms.service';
import { EmailService } from '../services/email.service';
import { parentService } from '../services/parent.service';
import { v2 as cloudinary } from 'cloudinary';

const SKIP_PARENT_PORTAL_NOTIFICATIONS = process.env.SKIP_PARENT_PORTAL_NOTIFICATIONS === 'true' || process.env.NODE_ENV === 'test';

/**
 * LearnerController handles learner operations in Zawadi SMS.
 */

export class LearnerController {
  async getAllLearners(req: AuthRequest, res: Response) {
    const currentUserRole = req.user!.role;
    const currentUserId = req.user!.userId;
    const institutionType = (req.user?.institutionType || 'PRIMARY_CBC') as any;
    const { grade, stream, status, search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    console.log('📚 [LEARNER] getAllLearners called with filters:', { grade, stream, status, search, page, limit });

    let whereClause: any = { archived: false, institutionType };
    if (currentUserRole === 'PARENT') whereClause.parentId = currentUserId;
    if (grade) whereClause.grade = String(grade);
    if (stream) whereClause.stream = String(stream);
    if (status) whereClause.status = String(status).toUpperCase() as LearnerStatus;
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName:  { contains: search as string, mode: 'insensitive' } },
        { admissionNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (status === 'DROPPED_OUT') delete whereClause.archived;

    try {
      const [learners, total] = await Promise.all([
        prisma.learner.findMany({
          where: whereClause,
          select: {
            id: true, firstName: true, lastName: true, middleName: true,
            admissionNumber: true, grade: true, stream: true, dateOfBirth: true,
            gender: true, parentId: true, status: true,
            primaryContactPhone: true, primaryContactName: true,
            primaryContactType: true, primaryContactEmail: true,
            guardianPhone: true, guardianName: true,
            createdBy: true,
            enrollments: {
              where: { active: true },
              select: { class: { select: { teacherId: true } } }
            },
            parent: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          },
          orderBy: [{ createdAt: 'desc' }, { grade: 'asc' }, { stream: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
          skip, take: Number(limit),
        }),
        prisma.learner.count({ where: whereClause }),
      ]);

      console.log('📚 [LEARNER] Query results:', {
        learnersCount: learners.length,
        total,
        whereClause,
        uniqueStreams: Array.from(new Set(learners.map(l => l.stream))),
        sampleLearners: learners.slice(0, 3).map(l => ({ id: l.id, name: `${l.firstName} ${l.lastName}`, stream: l.stream }))
      });

      res.json({ success: true, data: learners, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
    } catch (error: any) {
      throw new ApiError(500, 'Server error fetching learners: ' + error.message);
    }
  }

  async getLearnerStats(_req: AuthRequest, res: Response) {
    const institutionType = (_req.user?.institutionType || 'PRIMARY_CBC') as any;
    const whereClause: any = { archived: false, institutionType };
    const [statusCounts, gradeCounts, genderCounts, total, active] = await Promise.all([
      prisma.learner.groupBy({ by: ['status'], _count: true, where: whereClause }),
      prisma.learner.groupBy({ by: ['grade'],  _count: true, where: { ...whereClause, status: 'ACTIVE' } }),
      prisma.learner.groupBy({ by: ['gender'], _count: true, where: { ...whereClause, status: 'ACTIVE' } }),
      prisma.learner.count({ where: whereClause }),
      prisma.learner.count({ where: { ...whereClause, status: 'ACTIVE' } }),
    ]);
    res.json({
      success: true,
      data: {
        total, active,
        byStatus: statusCounts.reduce((a, i) => { a[i.status] = i._count; return a; }, {} as any),
        byGrade:  gradeCounts.reduce((a, i)  => { a[i.grade]  = i._count; return a; }, {} as any),
        byGender: genderCounts.reduce((a, i) => { a[i.gender] = i._count; return a; }, {} as any),
      },
    });
  }

  async getLearnerById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const institutionType = (req.user?.institutionType || 'PRIMARY_CBC') as any;
    const learner = await prisma.learner.findUnique({
      where: { id },
      include: { parent: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
    });
    if (!learner) throw new ApiError(404, 'Learner not found');
    if (learner.institutionType !== institutionType) throw new ApiError(404, 'Learner not found');
    if (req.user!.role === 'PARENT' && learner.parentId !== req.user!.userId) {
      throw new ApiError(403, 'You can only access your own children');
    }
    res.json({ success: true, data: learner });
  }

  async getLearnerByAdmissionNumber(req: AuthRequest, res: Response) {
    const institutionType = (req.user?.institutionType || 'PRIMARY_CBC') as any;
    const learner = await prisma.learner.findUnique({
      where: { admissionNumber: req.params.admissionNumber },
      include: { parent: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
    });
    if (!learner) throw new ApiError(404, 'Learner not found');
    if (learner.institutionType !== institutionType) throw new ApiError(404, 'Learner not found');
    res.json({ success: true, data: learner });
  }

  async createLearner(req: AuthRequest, res: Response) {
    const currentUserId = req.user!.userId;
    const institutionType = (req.user?.institutionType || 'PRIMARY_CBC') as any;
    let {
      admissionNumber, firstName, lastName, middleName, dateOfBirth, gender, grade, stream,
      parentId, guardianName, guardianPhone, guardianEmail, medicalConditions, allergies,
      emergencyContact, emergencyPhone, bloodGroup, address, county, subCounty, previousSchool,
      religion, specialNeeds, isTransportStudent, photo, fatherName, fatherPhone, fatherEmail, fatherDeceased,
      motherName, motherPhone, motherEmail, motherDeceased, guardianRelation,
      primaryContactType, primaryContactName, primaryContactPhone, primaryContactEmail,
    } = req.body;

    if (!admissionNumber) {
      try {
        admissionNumber = await generateAdmissionNumber(stream || 'A', new Date().getFullYear());
      } catch (error: any) {
        throw new ApiError(500, 'Could not generate admission number: ' + error.message);
      }
    }
    if (!firstName || !lastName || !dateOfBirth || !gender || !grade) {
      throw new ApiError(400, 'Missing required fields');
    }
    const existing = await prisma.learner.findUnique({ where: { admissionNumber } });
    if (existing) throw new ApiError(400, `Admission number ${admissionNumber} already exists`);

    try {
      // ── Automatic Parent Account Registration ────────────────────────────────
      if (!parentId) {
        const pPhone = guardianPhone || primaryContactPhone;
        const pName  = guardianName  || primaryContactName || 'Parent';
        const pEmail = (guardianEmail || primaryContactEmail)?.includes('@') ? (guardianEmail || primaryContactEmail) : undefined;

        if (pPhone || pEmail) {
          const parent = await parentService.getOrCreateParent({
            phone: pPhone,
            name: pName,
            email: pEmail
          });
          if (parent) parentId = parent.id;
        }
      }

      let finalPhotoUrl: string | undefined = undefined;
      if (photo && photo.startsWith('data:image')) {
        const cloudName = process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME;
        if (cloudName) {
          try {
            const result = await cloudinary.uploader.upload(photo, { folder: 'zawadi/photos' });
            finalPhotoUrl = result.secure_url;
          } catch (uploadErr: any) {
            console.warn('Cloudinary upload failed, skipping photo:', uploadErr.message);
          }
        } else {
          console.warn('[createLearner] Cloudinary not configured, photo skipped.');
        }
      }

      const learner = await prisma.learner.create({
        data: {
          admissionNumber, firstName, lastName, middleName,
          dateOfBirth: new Date(dateOfBirth), gender: gender as Gender, grade: String(grade) as any,
          institutionType,
          stream: stream || 'A', parentId, guardianName, guardianPhone, guardianEmail,
          medicalConditions, allergies, emergencyContact, emergencyPhone, bloodGroup,
          address, county, subCounty, previousSchool, religion, specialNeeds,
          isTransportStudent: isTransportStudent === true || isTransportStudent === 'true',
          photoUrl: finalPhotoUrl,
          fatherName, fatherPhone, fatherEmail, fatherDeceased: fatherDeceased || false,
          motherName, motherPhone, motherEmail, motherDeceased: motherDeceased || false,
          guardianRelation, primaryContactType, primaryContactName, primaryContactPhone, primaryContactEmail,
          status: 'ACTIVE', createdBy: currentUserId,
        },
        include: { parent: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
      });

      // ── Create student system user ────────────────────────────────────────────
      try {
        const studentUsername = admissionNumber.replace(/\//g, '-').toUpperCase();
        const existingUser = await prisma.user.findFirst({
          where: { OR: [{ username: studentUsername }, { email: `${studentUsername}@zawadisms.com` }] }
        });
        if (!existingUser) {
          // ── C1 fix: random password + force-reset token ──────────────────────
          const studentPassword = parentService.generateTemporaryPassword();
          const forceResetToken = randomBytes(32).toString('hex');
          const forceResetExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

          await prisma.user.create({
            data: {
              username: studentUsername,
              email: `${studentUsername}@zawadisms.com`,
              password: await bcrypt.hash(studentPassword, 11),
              firstName, lastName, middleName, phone: guardianPhone || null,
              role: 'STUDENT', status: 'ACTIVE',
              passwordResetToken: forceResetToken,
              passwordResetExpiry: forceResetExpiry,
            },
          });
        }
      } catch (userError) {
        console.error('Failed to create student system user:', userError);
      }

      // ── Generate Initial Fee Invoice ──────────────────────────────────────────
      let invoiceMessage = '';
      try {
        const invResult = await feeService.generateInvoiceForLearner(learner.id);
        if (invResult.success) {
          if (invResult.created) {
            invoiceMessage = ` Invoice ${invResult.invoice.invoiceNumber} generated for ${invResult.invoice.term} ${invResult.invoice.academicYear}.`;
          } else {
            invoiceMessage = ' (Invoice already exists for this term).';
          }
        } else {
          invoiceMessage = ` (⚠️ Note: Fee invoice not generated: ${invResult.error})`;
        }
      } catch (e: any) {
        console.error('Invoice generation failed:', e);
        invoiceMessage = ` (⚠️ Error: Automated invoice failed: ${e.message})`;
      }

      res.status(201).json({
        success: true,
        data: learner,
        message: `Learner created successfully.${invoiceMessage}`
      });
    } catch (createError: any) {
      console.error('[createLearner] Full error:', createError);
      throw new ApiError(500, `Creation failed: ${createError.message || JSON.stringify(createError)}`);
    }
  }

  async updateLearner(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const learner = await prisma.learner.findUnique({ where: { id } });
      if (!learner) throw new ApiError(404, 'Learner not found');

      const allowedFields = [
        'firstName', 'lastName', 'middleName',
        'dateOfBirth', 'gender', 'grade', 'stream',
        'parentId',
        'guardianName', 'guardianPhone', 'guardianEmail',
        'fatherName', 'fatherPhone', 'fatherEmail', 'fatherDeceased',
        'motherName', 'motherPhone', 'motherEmail', 'motherDeceased',
        'guardianRelation',
        'primaryContactType', 'primaryContactName', 'primaryContactPhone', 'primaryContactEmail',
        'medicalConditions', 'allergies', 'emergencyContact', 'emergencyPhone',
        'bloodGroup', 'address', 'county', 'subCounty',
        'previousSchool', 'religion', 'specialNeeds', 'isTransportStudent',
        'status', 'exitDate', 'exitReason',
      ];

      const updateData: any = { updatedBy: req.user!.userId };

      for (const field of allowedFields) {
        const val = req.body[field];
        if (val === undefined) continue;

        if (field === 'gender') { if (val && val !== '') updateData.gender = val as Gender; continue; }
        if (field === 'grade')  { if (val && val !== '') updateData.grade = String(val); continue; }
        if (field === 'status') { if (val && val !== '') updateData.status = val as LearnerStatus; continue; }

        if (field === 'fatherDeceased' || field === 'motherDeceased' || field === 'isTransportStudent') {
          updateData[field] = val === true || val === 'true'; continue;
        }

        updateData[field] = val === '' ? null : val;
      }

      // ── Auto-create parent account on update if still missing ─────────────────
      let parentId = updateData.parentId || learner.parentId;
      if (!parentId) {
        const pPhone = req.body.guardianPhone || req.body.primaryContactPhone;
        const pName  = req.body.guardianName  || req.body.primaryContactName || (req.body.firstName ? 'Parent' : null);
        const pEmail = (req.body.guardianEmail || req.body.primaryContactEmail)?.includes('@')
          ? (req.body.guardianEmail || req.body.primaryContactEmail)
          : undefined;

        if (pPhone || pEmail) {
          const parent = await parentService.getOrCreateParent({
            phone: pPhone,
            name: pName,
            email: pEmail
          });
          if (parent) updateData.parentId = parent.id;
        }
      }

      if (req.body.dateOfBirth && req.body.dateOfBirth !== '') updateData.dateOfBirth = new Date(req.body.dateOfBirth);
      if (req.body.dateOfAdmission && req.body.dateOfAdmission !== '') updateData.admissionDate = new Date(req.body.dateOfAdmission);
      if (req.body.exitDate && req.body.exitDate !== '') updateData.exitDate = new Date(req.body.exitDate);

      if (req.body.photo && req.body.photo !== '') {
        let finalPhotoUrl = req.body.photo;
        if (req.body.photo.startsWith('data:image')) {
          const cloudName = process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME;
          if (cloudName) {
            try {
              const result = await cloudinary.uploader.upload(req.body.photo, { folder: 'zawadi/photos' });
              finalPhotoUrl = result.secure_url;
            } catch (uploadErr: any) {
              console.warn('Cloudinary upload failed, keeping base64:', uploadErr.message);
            }
          }
        }
        updateData.photoUrl = finalPhotoUrl;
      }

      const updated = await prisma.learner.update({
        where: { id },
        data: updateData,
        include: { parent: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
      });

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error('[updateLearner] error:', error?.message || error);
      if (error instanceof ApiError) throw error;
      if (error?.code === 'P2002') throw new ApiError(409, 'A learner with that admission number already exists.');
      throw new ApiError(500, error?.message || 'Failed to update learner');
    }
  }

  async deleteLearner(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { permanent = false } = req.query;
    if (permanent === 'true' && req.user!.role === 'SUPER_ADMIN') {
      await prisma.learner.delete({ where: { id } });
      return res.json({ success: true, message: 'Permanently deleted' });
    }
    await prisma.learner.update({ where: { id }, data: { archived: true, archivedAt: new Date(), archivedBy: req.user!.userId, status: 'DROPPED_OUT', exitDate: new Date() } });
    res.json({ success: true, message: 'Learner archived' });
  }

  async getLearnersByGrade(req: AuthRequest, res: Response) {
    const { grade } = req.params;
    const { stream, status = 'ACTIVE' } = req.query;
    const learners = await prisma.learner.findMany({
      where: { grade: String(grade), status: String(status).toUpperCase() as LearnerStatus, stream: stream ? (stream as string) : undefined, archived: false },
      include: { parent: { select: { id: true, firstName: true, lastName: true, phone: true } } },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
    res.json({ success: true, data: learners, count: learners.length });
  }

  async uploadLearnerPhoto(req: AuthRequest, res: Response) {
    const updated = await prisma.learner.update({ where: { id: req.params.id }, data: { photoUrl: req.body.photoData, updatedBy: req.user!.userId } });
    res.json({ success: true, data: updated });
  }

  async deleteLearnerPhoto(req: AuthRequest, res: Response) {
    const updated = await prisma.learner.update({ where: { id: req.params.id }, data: { photoUrl: null, updatedBy: req.user!.userId } });
    res.json({ success: true, data: updated });
  }

  async getUpcomingBirthdays(_req: AuthRequest, res: Response) {
    const activeLearners = await prisma.learner.findMany({
      where: { status: 'ACTIVE', archived: false },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, grade: true, stream: true, admissionNumber: true },
    });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
    const upcoming = activeLearners
      .filter(l => { if (!l.dateOfBirth) return false; const d = new Date(l.dateOfBirth); const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate()); return thisYear >= today && thisYear <= nextWeek; })
      .map(l => ({ ...l, name: `${l.firstName} ${l.lastName}`, daysUntil: Math.ceil((new Date(today.getFullYear(), new Date(l.dateOfBirth!).getMonth(), new Date(l.dateOfBirth!).getDate()).getTime() - today.getTime()) / 86400000) }))
      .sort((a, b) => a.daysUntil - b.daysUntil);
    res.json({ success: true, data: upcoming });
  }

  async promoteLearners(req: AuthRequest, res: Response) {
    const { learnerIds, nextGrade } = req.body;
    const result = await prisma.$transaction(learnerIds.map((id: string) => prisma.learner.update({ where: { id }, data: { grade: String(nextGrade), updatedBy: req.user!.userId } })));
    res.json({ success: true, message: `Promoted ${result.length} learners` });
  }
}

export const learnerController = new LearnerController();
