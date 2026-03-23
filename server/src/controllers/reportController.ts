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

      const assessments = await prisma.formativeAssessment.findMany({
        where: {
          learnerId,
          term: term as Term,
          academicYear: parseInt(academicYear as string)
        },
        include: {
          teacher: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { learningArea: 'asc' }
      });

      const summary = calculateFormativeSummary(assessments);

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

      const gradingSystem = await gradingService.getGradingSystem('SUMMATIVE');
      const ranges = gradingSystem?.ranges || [];

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
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: [
          { test: { learningArea: 'asc' } },
          { test: { testDate: 'asc' } }
        ]
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
          include: { test: { select: { learningArea: true, totalMarks: true } } }
        })
      ]);

      res.json({
        success: true,
        data: {
          class: classInfo,
          learnerCount: learnerIds.length,
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
   * Get Individual Learner Analytics (cross-term trends)
   */
  getLearnerAnalytics: async (req: AuthRequest, res: Response) => {
    try {
      const { learnerId } = req.params;
      const { academicYear } = req.query;

      if (!academicYear) {
        throw new ApiError(400, 'Academic year is required');
      }

      const yearValue = parseInt(academicYear as string);

      const learner = await prisma.learner.findUnique({
        where: { id: learnerId },
        select: {
          id: true, firstName: true, lastName: true,
          admissionNumber: true, grade: true, stream: true
        }
      });

      if (!learner) throw new ApiError(404, 'Learner not found');

      // Fetch all summative results for the year across all 3 terms
      const summativeResults = await prisma.summativeResult.findMany({
        where: {
          learnerId,
          test: { academicYear: yearValue, archived: false }
        },
        include: {
          test: {
            select: { learningArea: true, term: true, totalMarks: true, testType: true }
          }
        },
        orderBy: { test: { term: 'asc' } }
      });

      // Fetch all formative results for the year
      const formativeResults = await prisma.formativeAssessment.findMany({
        where: { learnerId, academicYear: yearValue, archived: false },
        orderBy: { term: 'asc' }
      });

      // Cross-term trend per learning area
      const subjectTrends: Record<string, any> = {};
      for (const r of summativeResults) {
        const area = r.test.learningArea;
        if (!subjectTrends[area]) {
          subjectTrends[area] = { learningArea: area, termResults: [] };
        }
        subjectTrends[area].termResults.push({
          term: r.test.term,
          testType: r.test.testType,
          marksObtained: r.marksObtained,
          totalMarks: r.test.totalMarks,
          percentage: r.percentage,
          grade: r.grade,
          status: r.status
        });
      }

      // Overall term averages
      const termAverages: Record<string, { totalPercentage: number; count: number; average?: number }> = {};
      for (const r of summativeResults) {
        const term = r.test.term;
        if (!termAverages[term]) termAverages[term] = { totalPercentage: 0, count: 0 };
        termAverages[term].totalPercentage += r.percentage;
        termAverages[term].count++;
      }
      for (const term of Object.keys(termAverages)) {
        const t = termAverages[term];
        t.average = t.count > 0 ? Math.round((t.totalPercentage / t.count) * 100) / 100 : 0;
      }

      // Formative summary per term
      const formativeSummary: Record<string, any> = {};
      for (const f of formativeResults) {
        const term = f.term;
        if (!formativeSummary[term]) {
          formativeSummary[term] = { EE: 0, ME: 0, AE: 0, BE: 0, total: 0 };
        }
        if (f.overallRating) {
          formativeSummary[term][f.overallRating] = (formativeSummary[term][f.overallRating] || 0) + 1;
        }
        formativeSummary[term].total++;
      }

      res.json({
        success: true,
        data: {
          learner,
          academicYear: yearValue,
          subjectTrends: Object.values(subjectTrends),
          termAverages,
          formativeSummary,
          totalSummativeResults: summativeResults.length,
          totalFormativeResults: formativeResults.length
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

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${outputName}`);
      res.setHeader('Content-Length', pdfBuffer.length);

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
  const distribution: Record<string, number> = { EE: 0, ME: 0, AE: 0, BE: 0 };
  let totalPoints = 0;
  const byLearningArea: Record<string, { EE: number; ME: number; AE: number; BE: number; count: number }> = {};

  for (const a of assessments) {
    if (a.overallRating) {
      distribution[a.overallRating] = (distribution[a.overallRating] || 0) + 1;
    }
    if (a.points) totalPoints += a.points;

    const area = a.learningArea;
    if (!byLearningArea[area]) {
      byLearningArea[area] = { EE: 0, ME: 0, AE: 0, BE: 0, count: 0 };
    }
    if (a.overallRating) {
      byLearningArea[area][a.overallRating as keyof typeof byLearningArea[string]]++;
    }
    byLearningArea[area].count++;
  }

  // Determine predominant rating per area
  const dominantRatingByArea: Record<string, string> = {};
  for (const [area, counts] of Object.entries(byLearningArea)) {
    const { count, ...ratings } = counts;
    dominantRatingByArea[area] = Object.entries(ratings).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'ME';
  }

  return {
    distribution,
    averagePoints: assessments.length > 0 ? Math.round((totalPoints / assessments.length) * 100) / 100 : 0,
    byLearningArea,
    dominantRatingByArea
  };
}

function calculateSubjectSummary(results: any[], ranges: any[]) {
  const summary: Record<string, any> = {};

  for (const r of results) {
    const area = r.test.learningArea;
    if (!summary[area]) {
      summary[area] = { learningArea: area, tests: [], averagePercentage: 0, grade: 'E', passCount: 0, failCount: 0 };
    }
    summary[area].tests.push(r);
    if (r.status === 'PASS') summary[area].passCount++;
    else summary[area].failCount++;
  }

  for (const area of Object.keys(summary)) {
    const tests = summary[area].tests as any[];
    const avg = tests.reduce((sum: number, t: any) => sum + t.percentage, 0) / tests.length;
    summary[area].averagePercentage = Math.round(avg * 100) / 100;
    summary[area].grade = gradingService.calculateGradeSync(avg, ranges);
    summary[area].passRate = tests.length > 0 ? Math.round((summary[area].passCount / tests.length) * 100) : 0;
  }

  return summary;
}

function analyzeFormativePerformance(assessments: any[]) {
  const distribution: Record<string, number> = { EE: 0, ME: 0, AE: 0, BE: 0 };
  const byLearningArea: Record<string, Record<string, number>> = {};

  for (const a of assessments) {
    if (a.overallRating) {
      distribution[a.overallRating] = (distribution[a.overallRating] || 0) + 1;
    }

    const area = a.learningArea;
    if (!byLearningArea[area]) {
      byLearningArea[area] = { EE: 0, ME: 0, AE: 0, BE: 0, total: 0 };
    }
    if (a.overallRating) {
      byLearningArea[area][a.overallRating] = (byLearningArea[area][a.overallRating] || 0) + 1;
    }
    byLearningArea[area].total = (byLearningArea[area].total || 0) + 1;
  }

  const eeRate = assessments.length > 0
    ? Math.round(((distribution.EE + distribution.ME) / assessments.length) * 100)
    : 0;

  return {
    count: assessments.length,
    distribution,
    byLearningArea,
    meetingOrExceedingRate: eeRate   // % learners rated EE or ME
  };
}

function analyzeSummativePerformance(results: any[]) {
  if (results.length === 0) {
    return { count: 0, averagePercentage: 0, passRate: 0, byLearningArea: {}, gradeDistribution: {} };
  }

  const byLearningArea: Record<string, any> = {};
  const gradeDistribution: Record<string, number> = {};

  let totalPercentage = 0;
  let passCount = 0;

  for (const r of results) {
    totalPercentage += r.percentage ?? 0;
    if (r.status === 'PASS') passCount++;

    if (r.grade) {
      gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
    }

    const area = r.test?.learningArea ?? 'Unknown';
    if (!byLearningArea[area]) {
      byLearningArea[area] = { totalPercentage: 0, count: 0, passCount: 0, average: 0, passRate: 0 };
    }
    byLearningArea[area].totalPercentage += r.percentage ?? 0;
    byLearningArea[area].count++;
    if (r.status === 'PASS') byLearningArea[area].passCount++;
  }

  for (const area of Object.keys(byLearningArea)) {
    const a = byLearningArea[area];
    a.average = Math.round((a.totalPercentage / a.count) * 100) / 100;
    a.passRate = Math.round((a.passCount / a.count) * 100);
    delete a.totalPercentage;
  }

  return {
    count: results.length,
    averagePercentage: Math.round((totalPercentage / results.length) * 100) / 100,
    passRate: Math.round((passCount / results.length) * 100),
    byLearningArea,
    gradeDistribution
  };
}
