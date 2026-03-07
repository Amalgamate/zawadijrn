/**
 * Report Controller
 * Handles comprehensive assessment reporting
 */

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Term } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { gradingService } from '../services/grading.service';
import * as reportService from '../services/report.service';
import { pdfService } from '../services/pdf.service';

export const reportController = {
  /**
   * Get Comprehensive Formative Report for a Learner
   */
  getFormativeReport: async (req: AuthRequest, res: Response) => {
    try {
      const { learnerId } = req.params;
      const { term, academicYear } = req.query;

      if (!term || !academicYear) {
        throw new ApiError(400, 'Term and academic year are required');
      }

      const learner = await prisma.learner.findUnique({
        where: { id: learnerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          middleName: true,
          admissionNumber: true,
          grade: true,
          stream: true,
          dateOfBirth: true,
          gender: true
        }
      });

      if (!learner) {
        throw new ApiError(404, 'Learner not found');
      }

      // Get all formative assessments for this term
      const assessments = await prisma.formativeAssessment.findMany({
        where: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear as string)
        },
        include: {
          teacher: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          learningArea: 'asc'
        }
      });

      // Calculate summary statistics
      const summary = calculateFormativeSummary(assessments);

      // Get class teacher comment
      const teacherComment = await prisma.termlyReportComment.findFirst({
        where: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear as string)
        }
      });

      res.json({
        success: true,
        data: {
          learner,
          term,
          academicYear: parseInt(academicYear as string),
          assessments,
          summary,
          teacherComment,
          generatedDate: new Date(),
          totalAssessments: assessments.length
        }
      });

    } catch (error: any) {
      console.error('Error generating formative report:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to generate formative report'
      });
    }
  },

  /**
   * Get Comprehensive Summative Report for a Learner
   */
  getSummativeReport: async (req: AuthRequest, res: Response) => {
    try {
      const { learnerId } = req.params;
      const { term, academicYear } = req.query;

      if (!term || !academicYear) {
        throw new ApiError(400, 'Term and academic year are required');
      }

      const learner = await prisma.learner.findUnique({
        where: { id: learnerId },
        include: {
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          }
        }
      });

      if (!learner) {
        throw new ApiError(404, 'Learner not found');
      }

      // Fetch grading system
      const gradingSystem = await gradingService.getGradingSystem('SUMMATIVE');
      const ranges = gradingSystem?.ranges || [];

      // Get all summative results for this term
      const results = await prisma.summativeResult.findMany({
        where: {
          learnerId,
          test: {
            term: term as Term,
            academicYear: parseInt(academicYear as string)
          }
        },
        include: {
          test: {
            select: {
              title: true,
              learningArea: true,
              testDate: true,
              totalMarks: true,
              passMarks: true
            }
          },
          recorder: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          test: { learningArea: 'asc' }
        }
      });

      const subjectSummary = calculateSubjectSummary(results, ranges);

      res.json({
        success: true,
        data: {
          learner,
          term,
          academicYear: parseInt(academicYear as string),
          results,
          subjectSummary,
          generatedDate: new Date()
        }
      });

    } catch (error: any) {
      console.error('Error generating summative report:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to generate summative report'
      });
    }
  },

  /**
   * Get Complete Termly Report for a Learner
   */
  getTermlyReport: async (req: AuthRequest, res: Response) => {
    try {
      const { learnerId } = req.params;
      const { term, academicYear } = req.query;

      if (!term || !academicYear) {
        throw new ApiError(400, 'Term and academic year are required');
      }

      const report = await reportService.generateTermlyReport(
        learnerId,
        term as Term,
        parseInt(academicYear as string)
      );

      res.json({
        success: true,
        data: report
      });

    } catch (error: any) {
      console.error('Error generating termly report:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to generate termly report'
      });
    }
  },

  /**
   * Get Class Performance Analytics
   */
  getClassAnalytics: async (req: AuthRequest, res: Response) => {
    try {
      const { classId } = req.params;
      const { term, academicYear } = req.query;

      if (!term || !academicYear) {
        throw new ApiError(400, 'Term and academic year are required');
      }

      const yearValue = parseInt(academicYear as string);

      const classInfo = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          enrollments: { where: { active: true } }
        }
      });

      if (!classInfo) {
        throw new ApiError(404, 'Class not found');
      }

      const learnerIds = classInfo.enrollments.map((e: any) => e.learnerId);

      const [formative, summative] = await Promise.all([
        prisma.formativeAssessment.findMany({
          where: { learnerId: { in: learnerIds }, term: term as Term, academicYear: yearValue }
        }),
        prisma.summativeResult.findMany({
          where: { learnerId: { in: learnerIds }, test: { term: term as Term, academicYear: yearValue } },
          include: { test: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          class: classInfo,
          formative: analyzeFormativePerformance(formative),
          summative: analyzeSummativePerformance(summative)
        }
      });

    } catch (error: any) {
      console.error('Error generating class analytics:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to generate class analytics'
      });
    }
  },

  /**
   * Get Individual Learner Analytics
   */
  getLearnerAnalytics: async (req: AuthRequest, res: Response) => {
    try {
      const { learnerId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        throw new ApiError(400, 'Academic year is required');
      }

      res.json({
        success: true,
        data: {
          learnerId,
          academicYear: parseInt(academicYear as string),
          message: 'Learner analytics coming soon'
        }
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to get learner analytics'
      });
    }
  },

  /**
   * Generate PDF Report
   */
  generatePdf: async (req: AuthRequest, res: Response) => {
    try {
      const { html, fileName, filename, options } = req.body;

      if (!html) {
        throw new ApiError(400, 'HTML content is required');
      }

      const pdfBuffer = await pdfService.generatePdf(html, options);
      const outputName = fileName || filename || 'report.pdf';

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${outputName}`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send the buffer directly
      res.end(pdfBuffer);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Failed to generate PDF'
      });
    }
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateFormativeSummary(assessments: any[]) {
  const distribution: any = { EE: 0, ME: 0, AE: 0, BE: 0 };
  let totalPoints = 0;

  assessments.forEach(a => {
    if (a.overallRating) {
      distribution[a.overallRating] = (distribution[a.overallRating] || 0) + 1;
    }
    if (a.points) totalPoints += a.points;
  });

  return {
    distribution,
    averagePoints: assessments.length > 0 ? totalPoints / assessments.length : 0
  };
}

function calculateSubjectSummary(results: any[], ranges: any[]) {
  const summary: any = {};

  results.forEach(r => {
    const area = r.test.learningArea;
    if (!summary[area]) {
      summary[area] = { tests: [], averagePercentage: 0 };
    }
    summary[area].tests.push(r);
  });

  Object.keys(summary).forEach(area => {
    const tests = summary[area].tests;
    summary[area].averagePercentage = tests.reduce((sum: number, t: any) => sum + t.percentage, 0) / tests.length;
    summary[area].grade = gradingService.calculateGradeSync(summary[area].averagePercentage, ranges);
  });

  return summary;
}

function analyzeFormativePerformance(assessments: any[]) {
  // Implementation of formative analysis
  return { count: assessments.length };
}

function analyzeSummativePerformance(results: any[]) {
  // Implementation of summative analysis
  return { count: results.length };
}
