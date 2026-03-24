import express, { Request, Response } from 'express';
import { execSync } from 'child_process';

const router = express.Router();

/**
 * POST /api/migrations/run
 * Manually trigger Prisma migrations
 */
router.post('/run', async (_req: Request, res: Response) => {
  try {
    console.log('🔄 Starting database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'pipe' });
    console.log('✅ Migrations completed successfully');
    res.json({ 
      success: true, 
      message: 'All pending migrations executed successfully' 
    });
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * GET /api/migrations/status
 * Check if tables exist in the database
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const prisma = require('../config/database').default;
    
    // Try to count users to verify tables exist
    const userCount = await prisma.user.count();
    
    res.json({ 
      success: true, 
      message: 'Database tables exist',
      tables_confirmed: true,
      user_count: userCount
    });
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      res.status(503).json({
        success: false,
        message: 'Database tables have not been created yet - migrations needed',
        tables_confirmed: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message,
        tables_confirmed: false
      });
    }
  }
});

/**
 * POST /api/migrations/create-admin
 * Create a super admin user
 */
router.post('/create-admin', async (_req: Request, res: Response) => {
  try {
    const prisma = require('../config/database').default;
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@zawadijunioracademy.co.ke',
        password: '$2a$10$P.gWdFVLw7H7bQZJ8H5y6OQhUx8XJ9k2nLv0n5Z3w5K9mM2L0q5Be',
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
      },
    });

    res.json({
      success: true,
      message: 'Super admin created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
});

export default router;
