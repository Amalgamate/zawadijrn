// @ts-nocheck
/**
 * Scale Group Controller - BACKUP (Original)
 * Backed up on: 2026-01-29
 * This is the original file before the 14 learning areas fix
 * NOTE: This file is not compiled - kept for reference only
 */

import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/permissions.middleware';

const prisma = new PrismaClient();

// ============================================
// SCALE GROUP CRUD
// ============================================

/**
 * Get all scale groups for a school
 * GET /api/grading/scale-groups
 */
export const getScaleGroups = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - School ID required'
      });
    }

    const scaleGroups = await prisma.scaleGroup.findMany({
      where: {
        schoolId,
        archived: false
      },
      include: {
        gradingSystems: {
          where: { archived: false },
          include: {
            ranges: {
              orderBy: { minPercentage: 'desc' }
            }
          },
          orderBy: { grade: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: scaleGroups
    });

  } catch (error: any) {
    console.error('Error fetching scale groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scale groups',
      error: error.message
    });
  }
};

/**
 * Get a single scale group by ID
 * GET /api/grading/scale-groups/:id
 */
export const getScaleGroupById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.user?.schoolId;

    const scaleGroup = await prisma.scaleGroup.findFirst({
      where: {
        id,
        schoolId,
        archived: false
      },
      include: {
        gradingSystems: {
          where: { archived: false },
          include: {
            ranges: {
              orderBy: { minPercentage: 'desc' }
            }
          },
          orderBy: { grade: 'asc' }
        }
      }
    });

    if (!scaleGroup) {
      return res.status(404).json({
        success: false,
        message: 'Scale group not found'
      });
    }

    res.json({
      success: true,
      data: scaleGroup
    });

  } catch (error: any) {
    console.error('Error fetching scale group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scale group',
      error: error.message
    });
  }
};

/**
 * Create a new scale group
 * POST /api/grading/scale-groups
 */
export const createScaleGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - School ID required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Scale group name is required'
      });
    }

    // Check if name already exists
    const existing = await prisma.scaleGroup.findFirst({
      where: {
        schoolId,
        name,
        archived: false
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A scale group with this name already exists'
      });
    }

    const scaleGroup = await prisma.scaleGroup.create({
      data: {
        name,
        description,
        schoolId,
        active: true
      }
    });

    res.json({
      success: true,
      data: scaleGroup,
      message: 'Scale group created successfully'
    });

  } catch (error: any) {
    console.error('Error creating scale group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create scale group',
      error: error.message
    });
  }
};

/**
 * Update a scale group
 * PUT /api/grading/scale-groups/:id
 */
export const updateScaleGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, active, isDefault } = req.body;
    const schoolId = req.user?.schoolId;

    // Verify ownership
    const existing = await prisma.scaleGroup.findFirst({
      where: { id, schoolId, archived: false }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Scale group not found'
      });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.scaleGroup.updateMany({
        where: {
          schoolId,
          archived: false,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const updated = await prisma.scaleGroup.update({
      where: { id },
      data: {
        name,
        description,
        active,
        isDefault
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Scale group updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating scale group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update scale group',
      error: error.message
    });
  }
};

/**
 * Delete a scale group
 * DELETE /api/grading/scale-groups/:id
 */
export const deleteScaleGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    const userId = req.user?.userId;

    // Verify ownership
    const existing = await prisma.scaleGroup.findFirst({
      where: { id, schoolId, archived: false }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Scale group not found'
      });
    }

    // Soft delete
    await prisma.scaleGroup.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date(),
        archivedBy: userId
      }
    });

    res.json({
      success: true,
      message: 'Scale group deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting scale group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scale group',
      error: error.message
    });
  }
};

// ============================================
// SCALE GROUP OPERATIONS
// ============================================

/**
 * Generate grading systems for all grades in a scale group
 * POST /api/grading/scale-groups/:id/generate-grades
 */
export const generateGradesForScaleGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { grades, ranges } = req.body;
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify scale group ownership
    const scaleGroup = await prisma.scaleGroup.findFirst({
      where: { id, schoolId, archived: false }
    });

    if (!scaleGroup) {
      return res.status(404).json({
        success: false,
        message: 'Scale group not found'
      });
    }

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Grades array is required'
      });
    }

    if (!ranges || !Array.isArray(ranges) || ranges.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ranges array is required'
      });
    }

    const created = [];

    for (const grade of grades) {
      // Check if already exists
      const existing = await prisma.gradingSystem.findFirst({
        where: {
          scaleGroupId: id,
          grade,
          schoolId,
          archived: false
        }
      });

      if (existing) {
        continue; // Skip if already exists
      }

      const system = await prisma.gradingSystem.create({
        data: {
          name: `${grade.replace('_', ' ')} - All Subjects`,
          type: 'SUMMATIVE',
          scaleGroupId: id,
          grade,
          learningArea: null, // NULL = all subjects
          schoolId,
          active: true,
          ranges: {
            create: ranges.map((r: any) => ({
              label: r.label || r.rating,
              minPercentage: parseFloat(r.minPercentage || r.mark || 0),
              maxPercentage: parseFloat(r.maxPercentage || 100),
              points: parseInt(r.points || r.score || 0),
              description: r.description || r.desc || '',
              rubricRating: r.rubricRating || r.rating || null
            }))
          }
        },
        include: {
          ranges: {
            orderBy: { minPercentage: 'desc' }
          }
        }
      });

      created.push(system);
    }

    res.json({
      success: true,
      data: created,
      message: `Successfully created ${created.length} grading systems`
    });

  } catch (error: any) {
    console.error('Error generating grades for scale group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate grading systems',
      error: error.message
    });
  }
};

/**
 * Get grading system for a test based on scale group and grade
 * GET /api/grading/scale-groups/:id/for-test?grade=GRADE_1&learningArea=Mathematics
 */
export const getScaleForTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { grade, learningArea } = req.query;
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!grade) {
      return res.status(400).json({
        success: false,
        message: 'Grade parameter is required'
      });
    }

    // First, try to find a scale specific to the learning area
    let scale = await prisma.gradingSystem.findFirst({
      where: {
        scaleGroupId: id,
        grade: grade as any,
        learningArea: learningArea as string,
        schoolId,
        active: true,
        archived: false
      },
      include: {
        ranges: {
          orderBy: { minPercentage: 'desc' }
        }
      }
    });

    // If not found, look for a grade-wide scale (learningArea = null)
    if (!scale) {
      scale = await prisma.gradingSystem.findFirst({
        where: {
          scaleGroupId: id,
          grade: grade as any,
          learningArea: null, // All subjects
          schoolId,
          active: true,
          archived: false
        },
        include: {
          ranges: {
            orderBy: { minPercentage: 'desc' }
          }
        }
      });
    }

    if (!scale) {
      return res.status(404).json({
        success: false,
        message: `No grading scale found for ${grade} in this scale group`
      });
    }

    res.json({
      success: true,
      data: scale
    });

  } catch (error: any) {
    console.error('Error fetching scale for test:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch grading scale',
      error: error.message
    });
  }
};
