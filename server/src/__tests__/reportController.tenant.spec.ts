
import { Request, Response } from 'express';
import { getFormativeReport } from '../controllers/reportController';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';

// Mock prisma
jest.mock('../config/database', () => ({
  learner: {
    findUnique: jest.fn()
  },
  formativeAssessment: {
    findMany: jest.fn()
  },
  summativeResult: {
    findMany: jest.fn()
  },
  termlyReportComment: {
    findUnique: jest.fn()
  },
  gradingSystem: {
    findFirst: jest.fn()
  }
}));

// Mock grading service
jest.mock('../services/grading.service', () => ({
  gradingService: {
    getGradingSystem: jest.fn().mockResolvedValue({ ranges: [] })
  }
}));

describe('ReportController Tenant Scoping', () => {
  let mockReq: any;
  let mockRes: any;
  let next: jest.Mock;

  beforeEach(() => {
    mockReq = {
      params: { learnerId: 'learner-123' },
      query: { term: 'TERM_1', academicYear: '2025' },
      user: {
        userId: 'user-123',
        role: 'TEACHER',
        schoolId: 'school-A',
        branchId: null
      }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  it('should allow access when user schoolId matches learner schoolId', async () => {
    // Mock learner found in same school
    (prisma.learner.findUnique as jest.Mock).mockResolvedValue({
      id: 'learner-123',
      firstName: 'John',
      lastName: 'Doe',
      schoolId: 'school-A',
      branchId: 'branch-A'
    });

    (prisma.formativeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    await getFormativeReport(mockReq, mockRes);

    expect(prisma.learner.findUnique).toHaveBeenCalled();
    // Should proceed to fetch assessments (or whatever next step is)
    // If it failed auth, it would throw or return 403
    expect(prisma.formativeAssessment.findMany).toHaveBeenCalled();
  });

  it('should deny access when user schoolId does not match learner schoolId', async () => {
    // Mock learner in different school
    (prisma.learner.findUnique as jest.Mock).mockResolvedValue({
      id: 'learner-123',
      firstName: 'John',
      lastName: 'Doe',
      schoolId: 'school-B',
      branchId: 'branch-B'
    });

    await getFormativeReport(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Unauthorized access to learner report'
    }));
    
    expect(prisma.learner.findUnique).toHaveBeenCalled();
    expect(prisma.formativeAssessment.findMany).not.toHaveBeenCalled();
  });

  it('should allow SUPER_ADMIN access (no schoolId)', async () => {
    mockReq.user.role = 'SUPER_ADMIN';
    mockReq.user.schoolId = null;

    // Mock learner in any school
    (prisma.learner.findUnique as jest.Mock).mockResolvedValue({
      id: 'learner-123',
      firstName: 'John',
      lastName: 'Doe',
      schoolId: 'school-B', // Different from "null"
      branchId: 'branch-B'
    });

    (prisma.formativeAssessment.findMany as jest.Mock).mockResolvedValue([]);

    await getFormativeReport(mockReq, mockRes);

    expect(prisma.learner.findUnique).toHaveBeenCalled();
    expect(prisma.formativeAssessment.findMany).toHaveBeenCalled();
  });
  
  it('should deny access when user branchId does not match learner branchId', async () => {
      mockReq.user.branchId = 'branch-A';
      
      // Mock learner in same school but different branch
      (prisma.learner.findUnique as jest.Mock).mockResolvedValue({
        id: 'learner-123',
        firstName: 'John',
        lastName: 'Doe',
        schoolId: 'school-A',
        branchId: 'branch-B' // Different branch
      });
  
      await getFormativeReport(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Unauthorized access to learner report'
      }));
  
      expect(prisma.learner.findUnique).toHaveBeenCalled();
      expect(prisma.formativeAssessment.findMany).not.toHaveBeenCalled();
    });
});
