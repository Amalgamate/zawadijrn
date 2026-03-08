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

export const getAllSchools = async (req: AuthRequest, res: Response) => {
  try {
    const schools = await prisma.school.findMany();
    res.status(200).json({ success: true, data: schools, message: `Fetched ${schools.length} schools` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch schools' });
  }
};

export const getSchoolById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) return res.status(404).json({ success: false, error: 'School not found' });
    res.status(200).json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch school' });
  }
};

export const updateSchool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.update({ where: { id }, data: req.body });
    res.status(200).json({ success: true, message: 'School updated', data: school });
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
    const { id } = req.params;
    const result = await deleteSchoolSafely(id, {
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
    const { id } = req.params;
    const school = await prisma.school.update({
      where: { id },
      data: { active: false, status: 'DEACTIVATED' }
    });
    res.json({ success: true, message: 'School deactivated', data: school });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Deactivation failed' });
  }
};

// ============================================
// BRANCH MANAGEMENT (Simplified)
// ============================================

export const getBranchesBySchool = async (req: AuthRequest, res: Response) => {
  try {
    const branches = await prisma.branch.findMany();
    res.json({ success: true, data: branches, message: `Fetched ${branches.length} branches` });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch branches' });
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await prisma.branch.create({ data: req.body });
    res.status(201).json({ success: true, data: branch, message: 'Branch created' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create branch' });
  }
};

export const getBranchById = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } });
    if (!branch) return res.status(404).json({ success: false, error: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch branch' });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await prisma.branch.update({ where: { id: req.params.branchId }, data: req.body });
    res.json({ success: true, data: branch, message: 'Branch updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update branch' });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.branch.delete({ where: { id: req.params.branchId } });
    res.json({ success: true, message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete branch' });
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
