import { Request, Response } from 'express';
import prisma from '../config/database';
import { gradingService } from '../services/grading.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../utils/error.util';

import logger from '../utils/logger';
export const gradingController = {
  // Get all grading systems
  getGradingSystems: async (req: AuthRequest, res: Response) => {
    try {
      // Ensure defaults exist
      await gradingService.getGradingSystem('SUMMATIVE');
      await gradingService.getGradingSystem('CBC');

      const systems = await prisma.gradingSystem.findMany({
        where: { archived: false },
        include: { ranges: { orderBy: { minPercentage: 'desc' } } }
      });

      res.json(systems);
    } catch (error) {
      logger.error('Error fetching grading systems:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({
          error: 'Failed to fetch grading systems',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  },

  // Create grading system
  createGradingSystem: async (req: Request, res: Response) => {
    try {
      const { name, type, ranges, grade, learningArea, scaleGroupId } = req.body;

      const system = await prisma.gradingSystem.create({
        data: {
          name,
          type,
          grade,
          learningArea,
          scaleGroupId,
          active: true,
          ranges: {
            create: (ranges || []).map((r: any) => ({
              minPercentage: parseFloat(r.minPercentage),
              maxPercentage: parseFloat(r.maxPercentage),
              label: r.label,
              points: r.points ? parseInt(r.points) : null,
              color: r.color,
              description: r.description,
              summativeGrade: r.summativeGrade,
              rubricRating: r.rubricRating
            }))
          }
        },
        include: { ranges: true }
      });

      res.json(system);
    } catch (error) {
      logger.error('Error creating grading system:', error);
      res.status(500).json({
        error: 'Failed to create grading system',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  // Update grading system
  updateGradingSystem: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, active, isDefault, type, ranges, grade, learningArea, scaleGroupId } = req.body;

      const current = await prisma.gradingSystem.findUnique({ where: { id } });
      if (!current) {
        throw new ApiError(404, 'Grading system not found');
      }

      // If setting as default, unset others of same type
      if (isDefault) {
        await prisma.gradingSystem.updateMany({
          where: {
            type: current.type,
            id: { not: id }
          },
          data: { isDefault: false }
        });
      }

      const system = await prisma.$transaction(async (tx) => {
        const updatedSystem = await tx.gradingSystem.update({
          where: { id },
          data: {
            name,
            active,
            isDefault,
            type,
            grade,
            learningArea,
            scaleGroupId
          }
        });

        if (ranges) {
          await tx.gradingRange.deleteMany({ where: { systemId: id } });
          if (ranges.length > 0) {
            await tx.gradingRange.createMany({
              data: ranges.map((r: any) => ({
                systemId: id,
                minPercentage: parseFloat(r.minPercentage),
                maxPercentage: parseFloat(r.maxPercentage),
                label: r.label,
                points: r.points ? parseInt(r.points) : null,
                color: r.color,
                description: r.description,
                summativeGrade: r.summativeGrade,
                rubricRating: r.rubricRating
              }))
            });
          }
        }

        return tx.gradingSystem.findUnique({
          where: { id },
          include: { ranges: { orderBy: { minPercentage: 'desc' } } }
        });
      });

      res.json(system);
    } catch (error) {
      logger.error('Error updating grading system:', error);
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to update grading system' });
      }
    }
  },

  // Delete grading system
  deleteGradingSystem: async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

      const current = await prisma.gradingSystem.findUnique({ where: { id } });
      if (!current) {
        throw new ApiError(404, 'Grading system not found');
      }

      if (isSuperAdmin) {
        await prisma.gradingSystem.delete({ where: { id } });
        res.json({ success: true, message: 'Grading system permanently deleted' });
      } else {
        await prisma.gradingSystem.update({
          where: { id },
          data: {
            archived: true,
            archivedAt: new Date(),
            archivedBy: req.user?.userId,
            active: false
          }
        });
        res.json({ success: true, message: 'Grading system archived successfully' });
      }
    } catch (error) {
      logger.error('Error deleting grading system:', error);
      res.status(500).json({ error: 'Failed to delete grading system' });
    }
  },

  // Update grading range
  updateGradingRange: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { minPercentage, maxPercentage, label, points, color, description, summativeGrade, rubricRating } = req.body;

      const updatedRange = await prisma.gradingRange.update({
        where: { id },
        data: {
          minPercentage: minPercentage !== undefined ? parseFloat(minPercentage) : undefined,
          maxPercentage: maxPercentage !== undefined ? parseFloat(maxPercentage) : undefined,
          label,
          points: points !== undefined ? parseInt(points) : undefined,
          color,
          description,
          summativeGrade,
          rubricRating
        }
      });

      res.json(updatedRange);
    } catch (error) {
      logger.error('Error updating grading range:', error);
      res.status(500).json({ error: 'Failed to update grading range' });
    }
  },

  // Create grading range
  createGradingRange: async (req: Request, res: Response) => {
    try {
      const { systemId, minPercentage, maxPercentage, label, points, color, description, summativeGrade, rubricRating } = req.body;

      const range = await prisma.gradingRange.create({
        data: {
          systemId,
          minPercentage: parseFloat(minPercentage),
          maxPercentage: parseFloat(maxPercentage),
          label,
          points: points ? parseInt(points) : null,
          color,
          description,
          summativeGrade,
          rubricRating
        }
      });

      res.json(range);
    } catch (error) {
      logger.error('Error creating grading range:', error);
      res.status(500).json({ error: 'Failed to create grading range' });
    }
  },

  // Delete grading range
  deleteGradingRange: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await prisma.gradingRange.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      logger.error('Error deleting grading range:', error);
      res.status(500).json({ error: 'Failed to delete grading range' });
    }
  }
};
