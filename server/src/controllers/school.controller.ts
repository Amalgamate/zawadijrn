import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import prisma from '../config/database';
import { generateAdmissionNumber, getCurrentSequenceValue, resetSequence, getNextAdmissionNumberPreview } from '../services/admissionNumber.service';
import { provisionNewSchool } from '../services/school-provisioning.service';
import { deleteSchoolSafely } from '../services/school-deletion.service';

// ============================================
// SCHOOL MANAGEMENT ENDPOINTS (Single-Tenant)
// ============================================

export const getPublicBranding = async (req: Request, res: Response) => {
  try {
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
        email: true
      }
    });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch public branding' });
  }
};

export const getSchool = async (req: AuthRequest, res: Response) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch school' });
  }
};

export const updateSchool = async (req: AuthRequest, res: Response) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });
    
    const updated = await prisma.school.update({ 
      where: { id: school.id }, 
      data: req.body 
    });
    res.status(200).json({ success: true, message: 'School updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update school' });
  }
};

export const createSchoolWithProvisioning = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.school.findFirst();
    if (existing) return res.status(400).json({ success: false, error: 'School already provisioned' });
    const result = await provisionNewSchool(req.body);
    res.status(201).json({ success: true, message: 'Provisioned', data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, error: 'Provisioning failed' });
  }
};

export const deleteSchool = async (req: AuthRequest, res: Response) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    const result = await deleteSchoolSafely(school.id, {
      hardDelete: req.query.permanent === 'true',
      deletedBy: req.user!.userId,
      reason: req.body.reason || 'Requested through API'
    });
    res.json({ success: true, data: result, message: 'School deletion processed' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message, error: 'Deletion failed' });
  }
};

export const deactivateSchool = async (req: AuthRequest, res: Response) => {
  try {
    const school = await prisma.school.findFirst();
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });

    const updated = await prisma.school.update({
      where: { id: school.id },
      data: { active: false, status: 'DEACTIVATED' }
    });
    res.json({ success: true, message: 'School deactivated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Deactivation failed' });
  }
};

// ============================================
// ADMISSION SEQUENCE (Simplified)
// ============================================

export const getAdmissionSequence = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.academicYear);
    const value = await getCurrentSequenceValue(year);
    res.json({ success: true, data: { academicYear: year, currentValue: value || 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
};

export const getAdmissionNumberPreview = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.academicYear);
    const preview = await getNextAdmissionNumberPreview('ADM', year);
    res.json({ success: true, data: { preview } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
};

export const resetAdmissionSequence = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.body.academicYear);
    await resetSequence(year, 0);
    res.json({ success: true, message: 'Sequence reset' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
};
