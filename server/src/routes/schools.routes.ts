/**
 * Schools Routes
 * Handles school and branch listings
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/enhanced-rateLimit.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/schools
 * List all schools with their branches
 */
router.get(
  '/',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  async (req: Request, res: Response) => {
    try {
      const schools = await prisma.school.findMany({
        where: {
          active: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      res.json(schools);
    } catch (error) {
      console.error('Error fetching schools:', error);
      res.status(500).json({ error: 'Failed to fetch schools' });
    }
  }
);

/**
 * GET /api/schools/:id
 * Get a single school
 */
router.get(
  '/:id',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const school = await prisma.school.findUnique({
        where: { id }
      });

      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }

      res.json(school);
    } catch (error) {
      console.error('Error fetching school:', error);
      res.status(500).json({ error: 'Failed to fetch school' });
    }
  }
);

/**
 * GET /api/schools/:id/branding
 * Get school branding settings
 */
router.get(
  '/:id/branding',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const school = await prisma.school.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          faviconUrl: true,
          stampUrl: true,
          brandColor: true,
          welcomeTitle: true,
          welcomeMessage: true,
          schoolType: true,
          motto: true,
          vision: true,
          mission: true,
          phone: true,
          email: true,
          website: true,
          address: true
        }
      });

      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }

      res.json(school);
    } catch (error) {
      console.error('Error fetching school branding:', error);
      res.status(500).json({ error: 'Failed to fetch school branding' });
    }
  }
);

export default router;
