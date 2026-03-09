/**
 * Learner Controller
 * Handles learner management operations for a single-tenant environment
 * 
 * @module controllers/learner.controller
 */

import { Response } from 'express';
import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';
import { Grade, LearnerStatus, Gender } from '@prisma/client';
import { generateAdmissionNumber } from '../services/admissionNumber.service';
import { feeService } from '../services/fee.service';

export class LearnerController {
  /**
   * Get all learners
   */
  async getAllLearners(req: AuthRequest, res: Response) {
    const currentUserRole = req.user!.role;
    const currentUserId = req.user!.userId;

    const { grade, stream, status, search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let whereClause: any = { archived: false };

    if (currentUserRole === 'PARENT') {
      whereClause.parentId = currentUserId;
    }

    if (grade) whereClause.grade = grade as Grade;
    if (stream) whereClause.stream = String(stream);
    if (status) whereClause.status = status as LearnerStatus;

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { admissionNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status === 'DROPPED_OUT') {
      delete whereClause.archived;
    }

    console.log('[GET ALL LEARNERS] User Role:', currentUserRole, 'Params:', req.query, 'Where:', JSON.stringify(whereClause));

    try {
      const [learners, total] = await Promise.all([
        prisma.learner.findMany({
          where: whereClause,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            admissionNumber: true,
            grade: true,
            stream: true,
            dateOfBirth: true,
            gender: true,
            parentId: true,
            status: true,
            primaryContactPhone: true,
            primaryContactName: true,
            primaryContactType: true,
            primaryContactEmail: true,
            guardianPhone: true,
            guardianName: true,
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: [
            { createdAt: 'desc' },
            { grade: 'asc' },
            { stream: 'asc' },
            { lastName: 'asc' },
            { firstName: 'asc' },
          ],
          skip,
          take: Number(limit),
        }),
        prisma.learner.count({ where: whereClause }),
      ]);

      console.log(`[GET ALL LEARNERS] Returning ${learners.length} out of ${total}`);

      res.json({
        success: true,
        data: learners,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('[GET ALL LEARNERS] Error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  /**
   * Get learner statistics
   */
  async getLearnerStats(req: AuthRequest, res: Response) {
    const whereClause: any = { archived: false };

    const statusCounts = await prisma.learner.groupBy({
      by: ['status'],
      _count: true,
      where: whereClause,
    });

    const gradeCounts = await prisma.learner.groupBy({
      by: ['grade'],
      _count: true,
      where: { ...whereClause, status: 'ACTIVE' },
    });

    const genderCounts = await prisma.learner.groupBy({
      by: ['gender'],
      _count: true,
      where: { ...whereClause, status: 'ACTIVE' },
    });

    const total = await prisma.learner.count({ where: whereClause });
    const active = await prisma.learner.count({ where: { ...whereClause, status: 'ACTIVE' } });

    res.json({
      success: true,
      data: {
        total,
        active,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byGrade: gradeCounts.reduce((acc, item) => {
          acc[item.grade] = item._count;
          return acc;
        }, {} as Record<string, number>),
        byGender: genderCounts.reduce((acc, item) => {
          acc[item.gender] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  }

  /**
   * Get single learner by ID
   */
  async getLearnerById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const learner = await prisma.learner.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!learner) {
      throw new ApiError(404, 'Learner not found');
    }

    if (currentUserRole === 'PARENT' && learner.parentId !== currentUserId) {
      throw new ApiError(403, 'You can only access your own children');
    }

    res.json({
      success: true,
      data: learner,
    });
  }

  /**
   * Get learner by admission number
   */
  async getLearnerByAdmissionNumber(req: AuthRequest, res: Response) {
    const { admissionNumber } = req.params;

    const learner = await prisma.learner.findUnique({
      where: { admissionNumber },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!learner) {
      throw new ApiError(404, 'Learner not found');
    }

    res.json({
      success: true,
      data: learner,
    });
  }

  /**
   * Create new learner
   */
  async createLearner(req: AuthRequest, res: Response) {
    const currentUserId = req.user!.userId;

    let {
      admissionNumber,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      gender,
      grade,
      stream,
      parentId,
      guardianName,
      guardianPhone,
      guardianEmail,
      medicalConditions,
      allergies,
      emergencyContact,
      emergencyPhone,
      bloodGroup,
      address,
      county,
      subCounty,
      previousSchool,
      religion,
      specialNeeds,
      photo,
      fatherName,
      fatherPhone,
      fatherEmail,
      fatherDeceased,
      motherName,
      motherPhone,
      motherEmail,
      motherDeceased,
      guardianRelation,
      primaryContactType,
      primaryContactName,
      primaryContactPhone,
      primaryContactEmail,
    } = req.body;

    // Auto-generate admission number if not provided
    if (!admissionNumber) {
      try {
        const streamCode = stream || 'A';
        const currentYear = new Date().getFullYear();
        admissionNumber = await generateAdmissionNumber(streamCode, currentYear);
      } catch (error: any) {
        throw new ApiError(500, 'Could not generate admission number: ' + error.message);
      }
    }

    if (!firstName || !lastName || !dateOfBirth || !gender || !grade) {
      throw new ApiError(400, 'Missing required fields');
    }

    const existing = await prisma.learner.findUnique({
      where: { admissionNumber }
    });

    if (existing) {
      throw new ApiError(400, `Admission number ${admissionNumber} already exists`);
    }

    try {
      if (!parentId && guardianPhone) {
        let parent = await prisma.user.findFirst({
          where: { phone: guardianPhone, role: 'PARENT' }
        });

        if (!parent) {
          const nameParts = guardianName ? guardianName.split(' ') : ['Parent'];
          const pFirstName = nameParts[0];
          const pLastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Guardian';
          const pEmail = guardianEmail && guardianEmail.includes('@') ? guardianEmail : `${guardianPhone.replace(/\D/g, '')}@zawadisms.com`;

          const existingEmail = await prisma.user.findUnique({ where: { email: pEmail } });
          const finalEmail = existingEmail ? `${guardianPhone.replace(/\D/g, '')}-${Date.now()}@zawadisms.com` : pEmail;

          const hashedPassword = await bcrypt.hash('ChangeMe123!', 12);

          parent = await prisma.user.create({
            data: {
              firstName: pFirstName,
              lastName: pLastName,
              email: finalEmail,
              phone: guardianPhone,
              password: hashedPassword,
              role: 'PARENT',
              status: 'ACTIVE'
            }
          });
        }
        parentId = parent.id;
      }

      const learner = await prisma.learner.create({
        data: {
          admissionNumber,
          firstName,
          lastName,
          middleName,
          dateOfBirth: new Date(dateOfBirth),
          gender: gender as Gender,
          grade: grade as Grade,
          stream: stream || 'A',
          parentId,
          guardianName,
          guardianPhone,
          guardianEmail,
          medicalConditions,
          allergies,
          emergencyContact,
          emergencyPhone,
          bloodGroup,
          address,
          county,
          subCounty,
          previousSchool,
          religion,
          specialNeeds,
          photoUrl: photo,
          fatherName,
          fatherPhone,
          fatherEmail,
          fatherDeceased: fatherDeceased || false,
          motherName,
          motherPhone,
          motherEmail,
          motherDeceased: motherDeceased || false,
          guardianRelation,
          primaryContactType,
          primaryContactName,
          primaryContactPhone,
          primaryContactEmail,
          status: 'ACTIVE',
          createdBy: currentUserId,
        },
        include: {
          parent: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true }
          }
        }
      });

      // Automatically create a System User for the student
      try {
        const studentUsername = admissionNumber.replace(/\//g, '-').toUpperCase();
        // Check if user already exists with this username
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { username: studentUsername },
              { email: `${studentUsername}@zawadisms.com` }
            ]
          }
        });

        if (!existingUser) {
          const hashedPassword = await bcrypt.hash('Student123!', 12);
          await prisma.user.create({
            data: {
              username: studentUsername,
              email: `${studentUsername}@zawadisms.com`,
              password: hashedPassword,
              firstName,
              lastName,
              middleName,
              phone: guardianPhone || null,
              role: 'STUDENT',
              status: 'ACTIVE',
              schoolId: (req.headers['x-school-id'] as string) || null
            }
          });
        }
      } catch (userError) {
        console.error('Failed to create student system user:', userError);
      }

      // Generate initial invoice
      try {
        await feeService.generateInvoiceForLearner(learner.id);
      } catch (invError) {
        console.error('Failed to generate initial invoice:', invError);
      }

      res.status(201).json({
        success: true,
        data: learner,
        message: 'Learner created successfully'
      });
    } catch (createError: any) {
      console.error('Creation Failed:', createError);
      res.status(500).json({ success: false, message: `Creation Failed: ${createError.message}` });
    }
  }

  /**
   * Update learner
   */
  async updateLearner(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    const learner = await prisma.learner.findUnique({ where: { id } });
    if (!learner) throw new ApiError(404, 'Learner not found');

    const updateData: any = { ...req.body, updatedBy: currentUserId };

    // Handle Date conversions
    if (updateData.dateOfBirth) updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.exitDate) updateData.exitDate = new Date(updateData.exitDate);
    if (updateData.photo) {
      updateData.photoUrl = updateData.photo;
      delete updateData.photo;
    }

    const updatedLearner = await prisma.learner.update({
      where: { id },
      data: updateData,
      include: {
        parent: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        }
      }
    });

    res.json({ success: true, data: updatedLearner });
  }

  /**
   * Delete or archive learner
   */
  async deleteLearner(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { permanent = false } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (permanent === 'true' && currentUserRole === 'SUPER_ADMIN') {
      await prisma.learner.delete({ where: { id } });
      res.json({ success: true, message: 'Permanently deleted' });
    } else {
      await prisma.learner.update({
        where: { id },
        data: {
          archived: true,
          archivedAt: new Date(),
          archivedBy: currentUserId,
          status: 'DROPPED_OUT',
          exitDate: new Date(),
        },
      });
      res.json({ success: true, message: 'Learner archived' });
    }
  }

  /**
   * Get learners by grade
   */
  async getLearnersByGrade(req: AuthRequest, res: Response) {
    const { grade } = req.params;
    const { stream, status = 'ACTIVE' } = req.query;

    const learners = await prisma.learner.findMany({
      where: {
        grade: grade as Grade,
        status: status as LearnerStatus,
        stream: stream ? (stream as string) : undefined,
        archived: false,
      },
      include: {
        parent: { select: { id: true, firstName: true, lastName: true, phone: true } }
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    res.json({ success: true, data: learners, count: learners.length });
  }

  /**
   * Photo Management
   */
  async uploadLearnerPhoto(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { photoData } = req.body;
    const currentUserId = req.user!.userId;

    const updated = await prisma.learner.update({
      where: { id },
      data: { photoUrl: photoData, updatedBy: currentUserId }
    });

    res.json({ success: true, data: updated });
  }

  async deleteLearnerPhoto(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const currentUserId = req.user!.userId;

    const updated = await prisma.learner.update({
      where: { id },
      data: { photoUrl: null, updatedBy: currentUserId }
    });

    res.json({ success: true, data: updated });
  }

  async getUpcomingBirthdays(req: AuthRequest, res: Response) {
    const activeLearners = await prisma.learner.findMany({
      where: { status: 'ACTIVE', archived: false },
      select: { id: true, firstName: true, lastName: true, dateOfBirth: true, grade: true, stream: true, admissionNumber: true }
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const upcoming = activeLearners.filter(l => {
      if (!l.dateOfBirth) return false;
      const dob = new Date(l.dateOfBirth);
      const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      return thisYear >= today && thisYear <= nextWeek;
    }).map(l => ({
      ...l,
      name: `${l.firstName} ${l.lastName}`,
      daysUntil: Math.ceil((new Date(today.getFullYear(), new Date(l.dateOfBirth!).getMonth(), new Date(l.dateOfBirth!).getDate()).getTime() - today.getTime()) / (1000 * 3600 * 24))
    })).sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({ success: true, data: upcoming });
  }

  async promoteLearners(req: AuthRequest, res: Response) {
    const { learnerIds, nextGrade } = req.body;
    const currentUserId = req.user!.userId;

    const result = await prisma.$transaction(
      learnerIds.map((id: string) => prisma.learner.update({
        where: { id },
        data: { grade: nextGrade as Grade, updatedBy: currentUserId }
      }))
    );

    res.json({ success: true, message: `Promoted ${result.length} learners` });
  }
}

export const learnerController = new LearnerController();
