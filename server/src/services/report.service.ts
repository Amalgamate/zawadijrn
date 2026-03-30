import { Term, DetailedRubricRating, SummativeGrade } from '@prisma/client';
import prisma from '../config/database';
import * as rubricUtil from '../utils/rubric.util';
import { gradingService } from './grading.service';
import { calculationService } from './calculation.service';
import { aiAssistantService } from './ai-assistant.service';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface LearnerInfo {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  admissionNumber: string;
  grade: string;
  stream: string | null;
  dateOfBirth: Date | null;
  gender: string;
  parent?: {
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  } | null;
}

export interface FormativeAssessmentData {
  id: string;
  learningArea: string;
  strand: string | null;
  subStrand: string | null;
  detailedRating: DetailedRubricRating | null;
  percentage: number | null;
  points: number | null;
  strengths: string | null;
  areasImprovement: string | null;
  remarks: string | null;
  teacher: {
    firstName: string;
    lastName: string;
  };
  type?: string;
}

export interface SummativeResultData {
  id: string;
  marksObtained: number;
  percentage: number;
  grade: SummativeGrade;
  status: string;
  position: number | null;
  outOf: number | null;
  teacherComment: string | null;
  test: {
    title: string;
    learningArea: string;
    totalMarks: number;
    passMarks: number;
    testDate: Date;
  };
}

export interface CoreCompetencyData {
  communication: DetailedRubricRating;
  communicationComment: string | null;
  criticalThinking: DetailedRubricRating;
  criticalThinkingComment: string | null;
  creativity: DetailedRubricRating;
  creativityComment: string | null;
  collaboration: DetailedRubricRating;
  collaborationComment: string | null;
  citizenship: DetailedRubricRating;
  citizenshipComment: string | null;
  learningToLearn: DetailedRubricRating;
  learningToLearnComment: string | null;
  assessor?: {
    firstName: string;
    lastName: string;
  };
}

export interface ValuesData {
  love: DetailedRubricRating;
  responsibility: DetailedRubricRating;
  respect: DetailedRubricRating;
  unity: DetailedRubricRating;
  peace: DetailedRubricRating;
  patriotism: DetailedRubricRating;
  integrity: DetailedRubricRating;
  comment: string | null;
}

export interface CoCurricularData {
  id: string;
  activityName: string;
  activityType: string;
  performance: DetailedRubricRating;
  achievements: string | null;
  remarks: string | null;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  sick: number;
  attendancePercentage: number;
}

export interface TermlyReportData {
  learner: LearnerInfo;
  term: Term;
  academicYear: number;
  formative: {
    assessments: FormativeAssessmentData[];
    summary: any;
  };
  summative: {
    results: SummativeResultData[];
    summary: any;
  };
  attendance: AttendanceSummary;
  coreCompetencies: CoreCompetencyData | null;
  values: ValuesData | null;
  coCurricular: CoCurricularData[];
  comments: any;
  overallPerformance: any;
  pathwayPrediction?: any;
  generatedDate: Date;
}

// ============================================
// GRADES ELIGIBLE FOR PATHWAY PREDICTION
// Client requirement: strictly Grade 7, 8, 9 only.
// ============================================
const PATHWAY_ELIGIBLE_GRADES = ['GRADE_7', 'GRADE_8', 'GRADE_9'] as const;

// ============================================
// TERM → APPROXIMATE DATE RANGES
// Used to filter attendance when no TermConfig row exists.
// Term 1 = Jan–Apr, Term 2 = May–Aug, Term 3 = Sep–Dec.
// ============================================
function termDateRange(term: Term, academicYear: number): { gte: Date; lte: Date } {
  const ranges: Record<Term, [number, number, number, number]> = {
    TERM_1: [1, 1, 4, 30],
    TERM_2: [5, 1, 8, 31],
    TERM_3: [9, 1, 12, 31],
  };
  const [startMonth, startDay, endMonth, endDay] = ranges[term];
  return {
    gte: new Date(academicYear, startMonth - 1, startDay),
    lte: new Date(academicYear, endMonth - 1, endDay, 23, 59, 59),
  };
}

// ============================================
// MAIN SERVICE FUNCTION
// ============================================

export async function generateTermlyReport(
  learnerId: string,
  term: Term,
  academicYear: number
): Promise<TermlyReportData> {
  const learner = await fetchLearnerInfo(learnerId);

  const summativeSystem = await gradingService.getGradingSystem('SUMMATIVE');
  const cbcSystem = await gradingService.getGradingSystem('CBC');

  const enrollment = await prisma.classEnrollment.findFirst({
    where: { learnerId, active: true },
    orderBy: { enrolledAt: 'desc' }
  });
  const classId = enrollment?.classId || '';

  const [
    formativeAssessments,
    summativeResults,
    attendanceRecords,
    coreCompetencies,
    valuesAssessment,
    coCurricularActivities,
    reportComments
  ] = await Promise.all([
    fetchFormativeAssessments(learnerId, term, academicYear),
    fetchSummativeResults(learnerId, term, academicYear),
    fetchAttendanceRecords(learnerId, term, academicYear),
    fetchCoreCompetencies(learnerId, term, academicYear),
    fetchValuesAssessment(learnerId, term, academicYear),
    fetchCoCurricularActivities(learnerId, term, academicYear),
    fetchReportComments(learnerId, term, academicYear)
  ]);

  if (!cbcSystem || !summativeSystem) {
    throw new Error('Grading systems not initialized');
  }

  const formativeSummary = await calculateFormativeSummaryWithService(
    learnerId,
    classId,
    term,
    academicYear,
    formativeAssessments,
    cbcSystem.ranges
  );

  const summativeSummary = calculateSummativeSummary(summativeResults, summativeSystem.ranges, cbcSystem.ranges);
  const attendanceSummary = calculateAttendanceSummary(attendanceRecords);

  const overallPerformance = await calculateOverallPerformanceWithWeights(
    learnerId,
    classId,
    term,
    academicYear,
    formativeSummary,
    summativeSummary,
    coreCompetencies,
    valuesAssessment,
    attendanceSummary
  );

  // ── Pathway prediction — Grade 7, 8, 9 only (client requirement) ──────────
  let pathwayPrediction: any = null;

  if (PATHWAY_ELIGIBLE_GRADES.includes(learner.grade as any)) {
    try {
      pathwayPrediction = await aiAssistantService.generatePathwayPrediction(
        learnerId,
        term as string,
        academicYear
      );
    } catch (e: any) {
      console.warn('[PathwayPrediction] Failed:', e?.message || e);
      // Deterministic service — this only fires on unexpected DB errors.
      // Return a neutral pending state rather than crashing the whole report.
      pathwayPrediction = {
        predictedPathway: 'Analysis Pending',
        confidence: 0,
        justification:
          'Could not compute pathway analysis. Please ensure all subject results are recorded for this term.',
        careerRecommendations: ['Contact the class teacher for guidance'],
        growthAreas: ['Ensure all subject scores are entered for this term'],
        clusterBreakdown: { STEM: 0, Social: 0, Arts: 0 },
      };
    }
  }

  return {
    learner,
    term,
    academicYear,
    formative: {
      assessments: formativeAssessments,
      summary: formativeSummary
    },
    summative: {
      results: summativeResults,
      summary: summativeSummary
    },
    attendance: attendanceSummary,
    coreCompetencies,
    values: valuesAssessment,
    coCurricular: coCurricularActivities,
    comments: reportComments
      ? {
          classTeacher: reportComments.classTeacherComment,
          classTeacherName: reportComments.classTeacherName,
          classTeacherDate: reportComments.classTeacherDate,
          headTeacher: reportComments.headTeacherComment,
          headTeacherName: reportComments.headTeacherName,
          headTeacherDate: reportComments.headTeacherDate,
          nextTermOpens: reportComments.nextTermOpens,
        }
      : null,
    overallPerformance,
    pathwayPrediction,
    generatedDate: new Date(),
  };
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

async function fetchLearnerInfo(learnerId: string): Promise<LearnerInfo> {
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
      gender: true,
      parent: {
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          email: true
        }
      }
    }
  });

  if (!learner) throw new Error(`Learner not found`);
  return learner as LearnerInfo;
}

async function fetchFormativeAssessments(learnerId: string, term: Term, academicYear: number) {
  return await prisma.formativeAssessment.findMany({
    where: { learnerId, term, academicYear },
    include: { teacher: { select: { firstName: true, lastName: true } } },
    orderBy: { learningArea: 'asc' }
  });
}

async function fetchSummativeResults(learnerId: string, term: Term, academicYear: number) {
  return await prisma.summativeResult.findMany({
    where: { learnerId, test: { term, academicYear } },
    include: {
      test: {
        select: {
          title: true,
          learningArea: true,
          totalMarks: true,
          passMarks: true,
          testDate: true,
        }
      },
      recorder: { select: { firstName: true, lastName: true } }
    },
    orderBy: [
      { test: { learningArea: 'asc' } },
      { test: { testDate: 'asc' } }
    ]
  });
}

/**
 * Fetch attendance records scoped to a specific term.
 *
 * Strategy (in priority order):
 * 1. Look up the TermConfig for the exact term/year — if it has startDate/endDate,
 *    use them for a precise date filter.
 * 2. Fall back to the hard-coded approximate ranges (Jan–Apr / May–Aug / Sep–Dec)
 *    when no TermConfig row exists yet.
 *
 * This ensures the attendance count on a Term 1 report never includes
 * Term 2 or Term 3 records.
 */
async function fetchAttendanceRecords(learnerId: string, term: Term, academicYear: number) {
  // 1. Try to use configured term dates
  const termConfig = await prisma.termConfig.findFirst({
    where: { term, academicYear },
    select: { startDate: true, endDate: true },
  });

  const dateFilter = termConfig
    ? { gte: termConfig.startDate, lte: termConfig.endDate }
    : termDateRange(term, academicYear);

  return await prisma.attendance.findMany({
    where: {
      learnerId,
      date: dateFilter,
    },
    orderBy: { date: 'asc' },
  });
}

async function fetchCoreCompetencies(learnerId: string, term: Term, academicYear: number) {
  return await prisma.coreCompetency.findFirst({
    where: { learnerId, term, academicYear },
    include: { assessor: { select: { firstName: true, lastName: true } } }
  });
}

async function fetchValuesAssessment(learnerId: string, term: Term, academicYear: number) {
  return await prisma.valuesAssessment.findFirst({
    where: { learnerId, term, academicYear }
  });
}

async function fetchCoCurricularActivities(learnerId: string, term: Term, academicYear: number) {
  return await prisma.coCurricularActivity.findMany({
    where: { learnerId, term, academicYear },
    orderBy: { activityName: 'asc' }
  });
}

async function fetchReportComments(learnerId: string, term: Term, academicYear: number) {
  return await prisma.termlyReportComment.findFirst({
    where: { learnerId, term, academicYear }
  });
}

// ============================================
// CALCULATION HELPERS
// ============================================

async function calculateFormativeSummaryWithService(
  learnerId: string,
  classId: string,
  term: Term,
  academicYear: number,
  assessments: any[],
  ranges?: any[]
) {
  if (assessments.length === 0) return { averagePercentage: 0, byLearningArea: [] };

  const result = await calculationService.calculateOverallFormativeScore({ learnerId, classId, term, academicYear });
  const averagePercentage = Math.round(result.averagePercentage);

  const areaMap = new Map<string, number[]>();
  assessments.forEach(a => {
    if (a.percentage !== null) {
      if (!areaMap.has(a.learningArea)) areaMap.set(a.learningArea, []);
      areaMap.get(a.learningArea)!.push(a.percentage);
    }
  });

  const byLearningArea = Array.from(areaMap.entries()).map(([area, percentages]) => {
    const avg = Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);
    return {
      learningArea: area,
      percentage: avg,
      rating: ranges ? gradingService.calculateRatingSync(avg, ranges) : rubricUtil.percentageToDetailedRating(avg)
    };
  });

  return { averagePercentage, byLearningArea };
}

function calculateSummativeSummary(results: any[], summativeRanges?: any[], cbcRanges?: any[]) {
  if (results.length === 0) return { overallPercentage: 0, bySubject: [] };
  const overallPercentage = Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length);

  const subjectMap = new Map<string, { percentages: number[], cbcGrades: string[] }>();
  results.forEach(r => {
    const area = r.test.learningArea;
    if (!subjectMap.has(area)) {
      subjectMap.set(area, { percentages: [], cbcGrades: [] });
    }
    const data = subjectMap.get(area)!;
    data.percentages.push(r.percentage);
    if (r.cbcGrade) data.cbcGrades.push(r.cbcGrade);
  });

  const bySubject = Array.from(subjectMap.entries()).map(([subject, data]) => {
    const avg = Math.round(data.percentages.reduce((sum, p) => sum + p, 0) / data.percentages.length);
    
    // Use stored cbcGrade if all results for this subject have it, otherwise calculate from avg
    let cbcGrade = data.cbcGrades.length === data.percentages.length && data.cbcGrades.length > 0
      ? data.cbcGrades[0] // Simplify: just pick the first one if they match, or just calculate from average
      : (cbcRanges ? gradingService.calculateRatingSync(avg, cbcRanges) : 'ME');

    // If multiple tests for one subject, calculate CBC grade from the average percentage
    if (data.percentages.length > 1 && cbcRanges) {
      cbcGrade = gradingService.calculateRatingSync(avg, cbcRanges);
    }

    return {
      subject,
      averagePercentage: avg,
      grade: summativeRanges ? gradingService.calculateGradeSync(avg, summativeRanges) : 'E',
      cbcGrade
    };
  });

  return { overallPercentage, bySubject };
}

function calculateAttendanceSummary(records: any[]): AttendanceSummary {
  const totalDays = records.length;
  if (totalDays === 0) {
    return {
      totalDays: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sick: 0,
      attendancePercentage: 0
    };
  }

  const present  = records.filter(r => r.status === 'PRESENT').length;
  const absent   = records.filter(r => r.status === 'ABSENT').length;
  const late     = records.filter(r => r.status === 'LATE').length;
  const excused  = records.filter(r => r.status === 'EXCUSED').length;
  const sick     = records.filter(r => r.status === 'SICK').length;

  return {
    totalDays,
    present,
    absent,
    late,
    excused,
    sick,
    attendancePercentage: Math.round((present / totalDays) * 100)
  };
}

async function calculateOverallPerformanceWithWeights(
  learnerId: string,
  classId: string,
  term: Term,
  academicYear: number,
  formative: any,
  summative: any,
  competencies: any,
  values: any,
  attendance: any
) {
  let academicAverage = 0;
  if (formative.averagePercentage && summative.overallPercentage) {
    const result = await calculationService.calculateFinalScore({
      learnerId, classId, term, academicYear,
      formativeScore: formative.averagePercentage,
      summativeScore: summative.overallPercentage
    });
    academicAverage = Math.round(result.finalScore);
  } else {
    academicAverage = formative.averagePercentage || summative.overallPercentage || 0;
  }

  return { academicAverage };
}
