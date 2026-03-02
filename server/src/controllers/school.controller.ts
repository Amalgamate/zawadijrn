import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import prisma from '../config/database';
import { generateAdmissionNumber, getCurrentSequenceValue, resetSequence, getNextAdmissionNumberPreview } from '../services/admissionNumber.service';
import { provisionNewSchool } from '../services/school-provisioning.service';
import { deleteSchoolSafely } from '../services/school-deletion.service';

// ============================================
// SCHOOL MANAGEMENT ENDPOINTS (Single-Tenant)
// ============================================

export const getAllSchools = async (req: AuthRequest, res: Response) => {
  try {
    const schools = await prisma.school.findMany();
    res.status(200).json({ data: schools, count: schools.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};

export const getSchoolById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.findUnique({ where: { id } });
    if (!school) return res.status(404).json({ error: 'School not found' });
    res.status(200).json({ data: school });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch school' });
  }
};

export const updateSchool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.update({ where: { id }, data: req.body });
    res.status(200).json({ message: 'School updated', data: school });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update school' });
  }
};

export const createSchoolWithProvisioning = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.school.findFirst();
    if (existing) return res.status(400).json({ error: 'School already provisioned' });
    const result = await provisionNewSchool(req.body);
    res.status(201).json({ success: true, message: 'Provisioned', data: result });
  } catch (error: any) {
    res.status(500).json({ error: 'Provisioning failed', message: error.message });
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
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Deletion failed', message: error.message });
  }
};

export const deactivateSchool = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const school = await prisma.school.update({
      where: { id },
      data: { active: false, status: 'DEACTIVATED' }
    });
    res.json({ message: 'School deactivated', data: school });
  } catch (error) {
    res.status(500).json({ error: 'Deactivation failed' });
  }
};

// ============================================
// BRANCH MANAGEMENT (Simplified)
// ============================================

export const getBranchesBySchool = async (req: AuthRequest, res: Response) => {
  try {
    const branches = await prisma.branch.findMany();
    res.json({ data: branches, count: branches.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
};

export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await prisma.branch.create({ data: req.body });
    res.status(201).json({ data: branch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create branch' });
  }
};

export const getBranchById = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: req.params.branchId } });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json({ data: branch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
};

export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const branch = await prisma.branch.update({ where: { id: req.params.branchId }, data: req.body });
    res.json({ data: branch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update branch' });
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.branch.delete({ where: { id: req.params.branchId } });
    res.json({ message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete branch' });
  }
};

// ============================================
// ADMISSION SEQUENCE (Simplified)
// ============================================

export const getAdmissionSequence = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.academicYear);
    const value = await getCurrentSequenceValue(year);
    res.json({ academicYear: year, currentValue: value || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const getAdmissionNumberPreview = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.params.academicYear);
    const preview = await getNextAdmissionNumberPreview('ADM', year);
    res.json({ preview });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};

export const resetAdmissionSequence = async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.body.academicYear);
    await resetSequence(year, 0);
    res.json({ message: 'Sequence reset' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};
