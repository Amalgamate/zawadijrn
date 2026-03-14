/**
 * Learning Area Controller
 * Handles CRUD operations for learning areas
 */

import { Request, Response, Router } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/learning-areas
 * Get all learning areas for a school
 */
export const getLearningAreas = async (req: AuthRequest, res: Response) => {
  try {
    const learningAreas = await prisma.learningArea.findMany({
      orderBy: [
        { gradeLevel: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ success: true, data: learningAreas });
  } catch (error: any) {
    console.error('Error fetching learning areas:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch learning areas' });
  }
};

/**
 * GET /api/learning-areas/:id
 * Get a specific learning area
 */
export const getLearningArea = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const learningArea = await prisma.learningArea.findUnique({
      where: { id }
    });

    if (!learningArea) {
      return res.status(404).json({ success: false, error: 'Learning area not found' });
    }

    res.json({ success: true, data: learningArea });
  } catch (error: any) {
    console.error('Error fetching learning area:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch learning area' });
  }
};

/**
 * POST /api/learning-areas
 * Create a new learning area
 */
export const createLearningArea = async (req: AuthRequest, res: Response) => {
  try {
    const { name, shortName, gradeLevel, icon, color, description } = req.body;

    if (!name || !gradeLevel) {
      return res.status(400).json({ success: false, error: 'Name and grade level are required' });
    }

    // Check for duplicates
    const existing = await prisma.learningArea.findFirst({
      where: {
        name,
        gradeLevel
      }
    });

    if (existing) {
      return res.status(409).json({ success: false, error: 'Learning area already exists' });
    }

    const learningArea = await prisma.learningArea.create({
      data: {
        name,
        shortName: shortName || name.split(' ')[0],
        gradeLevel,
        icon: icon || '📚',
        color: color || '#3b82f6',
        description
      }
    });

    res.status(201).json({ success: true, data: learningArea });
  } catch (error: any) {
    console.error('Error creating learning area:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create learning area' });
  }
};

/**
 * PUT /api/learning-areas/:id
 * Update a learning area
 */
export const updateLearningArea = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, shortName, gradeLevel, icon, color, description } = req.body;

    const learningArea = await prisma.learningArea.findUnique({
      where: { id }
    });

    if (!learningArea) {
      return res.status(404).json({ success: false, error: 'Learning area not found' });
    }

    // Check if name already exists (excluding current record)
    if (name && name !== learningArea.name) {
      const existing = await prisma.learningArea.findFirst({
        where: {
          name,
          gradeLevel: gradeLevel || learningArea.gradeLevel,
          NOT: { id }
        }
      });

      if (existing) {
        return res.status(409).json({ success: false, error: 'Learning area name already exists' });
      }
    }

    const updated = await prisma.learningArea.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(shortName && { shortName }),
        ...(gradeLevel && { gradeLevel }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(description !== undefined && { description })
      }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating learning area:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update learning area' });
  }
};

/**
 * DELETE /api/learning-areas/:id
 * Delete a learning area
 */
export const deleteLearningArea = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const learningArea = await prisma.learningArea.findUnique({
      where: { id }
    });

    if (!learningArea) {
      return res.status(404).json({ success: false, error: 'Learning area not found' });
    }

    await prisma.learningArea.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Learning area deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting learning area:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete learning area' });
  }
};

/**
 * POST /api/learning-areas/seed
 * Seed learning areas from constants (for initial setup)
 */
export const seedLearningAreas = async (req: AuthRequest, res: Response) => {
  try {

    // Official CBC Per-Grade Mapping
    const gradeMappings: { [key: string]: string[] } = {
      'CRECHE': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
      'PLAYGROUP': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
      'RECEPTION': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
      'TRANSITION': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
      'PP1': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
      'PP2': ['Language Activities', 'Mathematical Activities', 'Environmental Activities', 'Creative Activities', 'Religious Activities', 'Pastoral Programme of Instruction (PPI)'],
      'GRADE_1': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
      'GRADE_2': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
      'GRADE_3': ['English', 'Kiswahili', 'Indigenous Language', 'Mathematical Activities', 'Environmental Activities', 'Religious Education', 'Creative Activities'],
      'GRADE_4': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
      'GRADE_5': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
      'GRADE_6': ['English', 'Kiswahili', 'Science and Technology', 'Social Studies', 'Mathematics', 'Agriculture', 'Creative Arts', 'Religious Education'],
      'GRADE_7': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports'],
      'GRADE_8': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports'],
      'GRADE_9': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Social Studies', 'Religious Education', 'Pre-Technical Studies', 'Agriculture', 'Creative Arts & Sports']
    };

    const colors: { [key: string]: string } = {
      'Pre-Primary': '#8b5cf6', 'Lower Primary': '#3b82f6', 'Upper Primary': '#2563eb', 'Junior School': '#10b981'
    };

    const icons: { [key: string]: string } = {
      'Pre-Primary': '🎨', 'Lower Primary': '📘', 'Upper Primary': '🧪', 'Junior School': '📗'
    };

    const shortNameMapping: { [key: string]: string } = {
      'English': 'ENG',
      'Kiswahili': 'KISW',
      'Mathematics': 'MATH',
      'Mathematical Activities': 'MATH',
      'Language Activities': 'LANG',
      'Environmental Activities': 'ENV',
      'Creative Activities': 'CREA',
      'Religious Education': 'RE',
      'Religious Activities': 'REL',
      'Science and Technology': 'SCI',
      'Social Studies': 'SOC',
      'Agriculture': 'AGRI',
      'Creative Arts': 'ARTS',
      'Integrated Science': 'INT_SCI',
      'Pre-Technical Studies': 'PRE-TECH',
      'Creative Arts & Sports': 'ARTS'
    };

    const rowsToSeed: Array<{
      name: string;
      shortName: string;
      gradeLevel: string;
      icon: string;
      color: string;
    }> = [];

    for (const [grade, areas] of Object.entries(gradeMappings)) {
      let visualGroup = 'Lower Primary';
      if (['CRECHE', 'PLAYGROUP', 'RECEPTION', 'TRANSITION', 'PP1', 'PP2'].includes(grade)) visualGroup = 'Pre-Primary';
      if (['GRADE_4', 'GRADE_5', 'GRADE_6'].includes(grade)) visualGroup = 'Upper Primary';
      if (['GRADE_7', 'GRADE_8', 'GRADE_9'].includes(grade)) visualGroup = 'Junior School';

      for (const area of areas) {
        rowsToSeed.push({
          name: area,
          shortName: shortNameMapping[area] || area.substring(0, 5).toUpperCase(),
          gradeLevel: grade,
          icon: icons[visualGroup] || '📚',
          color: colors[visualGroup] || '#3b82f6'
        });
      }
    }

    const total = rowsToSeed.length;
    const result = await prisma.learningArea.createMany({
      data: rowsToSeed,
      skipDuplicates: true
    });

    const created = result.count;
    const skipped = Math.max(total - created, 0);

    res.json({
      success: true,
      message: 'Learning areas seeded successfully',
      created,
      skipped
    });
  } catch (error: any) {
    console.error('Error seeding learning areas:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to seed learning areas' });
  }
};

export default router;
