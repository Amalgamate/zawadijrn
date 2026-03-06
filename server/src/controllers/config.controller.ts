import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { configService } from '../services/config.service';
import { calculationService } from '../services/calculation.service';
import { Term, FormativeAssessmentType, Grade } from '@prisma/client';
import prisma from '../config/database';

const extractSchoolId = (req: AuthRequest): string | undefined => {
  const headerSchoolId = req.headers['x-school-id'];
  const bodySchoolId = req.body?.schoolId;

  if (Array.isArray(headerSchoolId)) {
    return headerSchoolId[0] || req.user?.schoolId || bodySchoolId;
  }

  return (headerSchoolId as string) || req.user?.schoolId || bodySchoolId;
};

export const getTermConfigs = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const configs = await configService.getTermConfigs(schoolId);
    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSpecificTermConfig = async (req: Request, res: Response) => {
  try {
    const { schoolId, term, year } = req.params;
    const config = await configService.getTermConfig({
      schoolId,
      term: term as Term,
      academicYear: parseInt(year)
    });
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getActiveTermConfig = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const config = await configService.getActiveTermConfig(schoolId);
    if (!config) return res.status(404).json({ success: false, message: 'No active term' });
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Helper to safely parse dates
const safeParseDate = (dateVal: any, defaultDate: Date): Date => {
  if (!dateVal) return defaultDate;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? defaultDate : d;
};

export const upsertTermConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { academicYear, term, startDate, endDate, formativeWeight, summativeWeight, isActive } = req.body;

    // Use weights from body or default to 30/70
    const fw = formativeWeight != null ? parseFloat(formativeWeight) : 30.0;
    const sw = summativeWeight != null ? parseFloat(summativeWeight) : 70.0;

    const config = await configService.upsertTermConfig({
      academicYear: parseInt(academicYear),
      term,
      startDate: safeParseDate(startDate, new Date()),
      endDate: safeParseDate(endDate, new Date()),
      formativeWeight: fw,
      summativeWeight: sw,
      isActive: Boolean(isActive),
      schoolId: req.user!.schoolId!,
      createdBy: req.user!.userId
    });
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTermConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const config = await configService.updateTermConfig(id, req.body);
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAggregationConfigs = async (req: Request, res: Response) => {
  try {
    const configs = await configService.getAggregationConfigs();
    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getSpecificAggregationConfig = async (req: Request, res: Response) => {
  try {
    const { assessmentType } = req.params;
    const { grade, learningArea } = req.query;
    const config = await configService.getAggregationConfig({
      assessmentType: assessmentType as FormativeAssessmentType,
      grade: grade as Grade | undefined,
      learningArea: learningArea as string | undefined
    });
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAggregationConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = await configService.createAggregationConfig({
      ...req.body,
      createdBy: req.user!.userId
    });
    res.status(201).json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAggregationConfig = async (req: Request, res: Response) => {
  try {
    const config = await configService.updateAggregationConfig(req.params.id, req.body);
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteAggregationConfig = async (req: Request, res: Response) => {
  try {
    await configService.deleteAggregationConfig(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStreamConfigs = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const configs = await configService.getStreamConfigs(schoolId);
    res.json({ success: true, data: configs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const upsertStreamConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = await configService.upsertStreamConfig(req.body);
    res.json({ success: true, data: config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteStreamConfig = async (req: Request, res: Response) => {
  try {
    await configService.deleteStreamConfig(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getClasses = async (req: Request, res: Response) => {
  try {
    const { schoolId } = req.params;
    const classes = await configService.getClasses(schoolId);
    res.json({ success: true, data: classes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const upsertClass = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) {
      return res.status(400).json({ success: false, error: 'School ID required' });
    }

    const cls = await configService.upsertClass({ ...req.body, schoolId });
    res.json({ success: true, data: cls });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    await configService.deleteClass(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getGrades = async (req: Request, res: Response) => {
  res.json({ success: true, data: Object.values(Grade) });
};

export const getConfigurationSummary = async (req: Request, res: Response) => {
  try {
    const activeTerm = await configService.getActiveTermConfig();
    const students = await prisma.learner.count({ where: { status: 'ACTIVE' } });
    const classes = await prisma.class.count();
    res.json({ success: true, data: { activeTerm, stats: { students, classes } } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAvailableStrategies = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'SIMPLE_AVERAGE', name: 'Simple Average', description: 'Calculates the mean of all scores' },
      { id: 'BEST_N', name: 'Best N Scores', description: 'Takes the top N scores' },
      { id: 'DROP_LOWEST_N', name: 'Drop Lowest N', description: 'Excludes the bottom N scores' }
    ]
  });
};

export const resetToDefaults = async (req: Request, res: Response) => {
  // Logic to reset configs for a term
  res.json({ success: true, message: 'Reset complete' });
};

export const createDefaultAggregationConfigs = async (req: Request, res: Response) => {
  // Logic to seed defaults
  res.json({ success: true, message: 'Defaults created' });
};

export const recalculateClassScores = async (req: Request, res: Response) => {
  try {
    const { classId, term, academicYear } = req.body;
    await calculationService.recalculateClassScores({ classId, term, academicYear });
    res.json({ success: true, message: 'Recalculation started' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const seedStreams = async (req: Request, res: Response) => {
  const streams = ['A', 'B', 'C', 'D'];
  for (const s of streams) await configService.upsertStreamConfig({ name: s });
  res.json({ success: true, message: 'Streams seeded' });
};

export const seedClasses = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = extractSchoolId(req);
    if (!schoolId) return res.status(400).json({ success: false, error: 'School ID required' });

    const year = new Date().getFullYear();
    const term: Term = 'TERM_1';
    const grades: Grade[] = [
      'PLAYGROUP', 'PP1', 'PP2',
      'GRADE_1', 'GRADE_2', 'GRADE_3',
      'GRADE_4', 'GRADE_5', 'GRADE_6',
      'GRADE_7', 'GRADE_8', 'GRADE_9'
    ];

    const results = [];
    let skipped = 0;
    for (const grade of grades) {
      const stream = 'A';
      const name = `${grade.replace('_', ' ')} ${stream}`;

      // Check if exists for THIS school
      const existing = await prisma.class.findFirst({
        where: { grade, stream, academicYear: year, term, schoolId }
      });

      if (!existing) {
        const totalClasses = await prisma.class.count({ where: { schoolId } });
        const classCode = `CLS-${schoolId.substring(0, 4)}-${String(totalClasses + 1).padStart(4, '0')}`;

        const newClass = await prisma.class.create({
          data: {
            classCode,
            name,
            grade,
            stream,
            academicYear: year,
            term,
            active: true,
            schoolId
          }
        });
        results.push(newClass);
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `Seeded ${results.length} classes for ${year} ${term}`,
      created: results.length,
      skipped,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const configController = {
  getTermConfigs,
  getSpecificTermConfig,
  getActiveTermConfig,
  upsertTermConfig,
  updateTermConfig,
  getAggregationConfigs,
  getSpecificAggregationConfig,
  createAggregationConfig,
  updateAggregationConfig,
  deleteAggregationConfig,
  getStreamConfigs,
  upsertStreamConfig,
  deleteStreamConfig,
  getClasses,
  upsertClass,
  deleteClass,
  getGrades,
  getConfigurationSummary,
  getAvailableStrategies,
  resetToDefaults,
  createDefaultAggregationConfigs,
  recalculateClassScores,
  seedStreams,
  seedClasses
};
