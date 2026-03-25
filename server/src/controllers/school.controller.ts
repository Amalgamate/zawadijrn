import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { generateAdmissionNumber, getCurrentSequenceValue, resetSequence, getNextAdmissionNumberPreview } from '../services/admissionNumber.service';
import { provisionNewSchool } from '../services/school-provisioning.service';
import { deleteSchoolSafely } from '../services/school-deletion.service';

// ============================================
// SCHOOL MANAGEMENT ENDPOINTS (Single-Tenant)
// ============================================

export const getPublicBranding = async (req: Request, res: Response) => {
  const school = await prisma.school.findFirst({
    select: {
      id: true,
      name: true,
      logoUrl: true,
      faviconUrl: true,
      brandColor: true,
      welcomeTitle: true,
      welcomeMessage: true,
      onboardingTitle: true,
      onboardingMessage: true,
      motto: true,
      address: true,
      phone: true,
      email: true,
    },
  });

  // Return defaults when no school record exists yet (single-tenant, not yet provisioned)
  const branding = school ?? {
    id: null,
    name: 'Zawadi Junior Academy',
    logoUrl: '/logo-new.png',
    faviconUrl: null,
    brandColor: '#5D0057',
    welcomeTitle: 'Welcome',
    welcomeMessage: null,
    onboardingTitle: null,
    onboardingMessage: null,
    motto: null,
    address: null,
    phone: null,
    email: null,
  };

  res.status(200).json({ success: true, data: branding });
};

export const getSchool = async (req: AuthRequest, res: Response) => {
  const school = await prisma.school.findFirst();
  if (!school) throw new ApiError(404, 'School not found');
  res.status(200).json({ success: true, data: school });
};

export const updateSchool = async (req: AuthRequest, res: Response) => {
  const school = await prisma.school.findFirst();

  if (!school) {
    // If no school exists, create it (handles first-time setup/branding)
    const created = await prisma.school.create({
      data: {
        ...req.body,
        name: req.body.name || 'Zawadi Junior Academy', // Ensure a name exists
      },
    });
    return res.status(201).json({ success: true, message: 'School settings initialized', data: created });
  }

  const updated = await prisma.school.update({
    where: { id: school.id },
    data: req.body,
  });
  res.status(200).json({ success: true, message: 'School updated', data: updated });
};

export const createSchoolWithProvisioning = async (req: AuthRequest, res: Response) => {
  const existing = await prisma.school.findFirst();
  if (existing) throw new ApiError(400, 'School already provisioned');

  const result = await provisionNewSchool(req.body);
  res.status(201).json({ success: true, message: 'Provisioned', data: result });
};

export const deleteSchool = async (req: AuthRequest, res: Response) => {
  const school = await prisma.school.findFirst();
  if (!school) throw new ApiError(404, 'School not found');

  const result = await deleteSchoolSafely(school.id, {
    hardDelete: req.query.permanent === 'true',
    deletedBy: req.user!.userId,
    reason: req.body.reason || 'Requested through API',
  });
  res.json({ success: true, data: result, message: 'School deletion processed' });
};

export const deactivateSchool = async (req: AuthRequest, res: Response) => {
  const school = await prisma.school.findFirst();
  if (!school) throw new ApiError(404, 'School not found');

  const updated = await prisma.school.update({
    where: { id: school.id },
    data: { active: false, status: 'DEACTIVATED' },
  });
  res.json({ success: true, message: 'School deactivated', data: updated });
};

// ============================================
// ADMISSION SEQUENCE (Simplified)
// ============================================

export const getAdmissionSequence = async (req: AuthRequest, res: Response) => {
  const year = parseInt(req.params.academicYear);
  const value = await getCurrentSequenceValue(year);
  res.json({ success: true, data: { academicYear: year, currentValue: value || 0 } });
};

export const getAdmissionNumberPreview = async (req: AuthRequest, res: Response) => {
  const year = parseInt(req.params.academicYear);
  const preview = await getNextAdmissionNumberPreview('ADM', year);
  res.json({ success: true, data: { preview } });
};

export const resetAdmissionSequence = async (req: AuthRequest, res: Response) => {
  const year = parseInt(req.body.academicYear);
  await resetSequence(year, 0);
  res.json({ success: true, message: 'Sequence reset' });
};
