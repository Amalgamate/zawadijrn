import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/permissions.middleware';
import { configService } from '../services/config.service';
import { calculationService } from '../services/calculation.service';
import { Term, FormativeAssessmentType, Grade } from '@prisma/client';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';

// Helper to safely parse dates
const safeParseDate = (dateVal: any, defaultDate: Date): Date => {
  if (!dateVal) return defaultDate;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? defaultDate : d;
};

const GRADE_OPTIONS = [
  'PLAYGROUP', 'PP1', 'PP2',
  'GRADE_1', 'GRADE_2', 'GRADE_3',
  'GRADE_4', 'GRADE_5', 'GRADE_6',
  'GRADE_7', 'GRADE_8', 'GRADE_9',
];

export const getTermConfigs = async (req: Request, res: Response) => {
  const configs = await configService.getTermConfigs();
  res.json({ success: true, data: configs });
};

export const getSpecificTermConfig = async (req: Request, res: Response) => {
  const { term, year } = req.params;
  const config = await configService.getTermConfig({
    term: term as Term,
    academicYear: parseInt(year),
  });
  res.json({ success: true, data: config });
};

export const getActiveTermConfig = async (req: Request, res: Response) => {
  const config = await configService.getActiveTermConfig();
  if (!config) throw new ApiError(404, 'No active term');
  res.json({ success: true, data: config });
};

export const upsertTermConfig = async (req: AuthRequest, res: Response) => {
  const { academicYear, term, startDate, endDate, formativeWeight, summativeWeight, isActive } = req.body;

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
    createdBy: req.user!.userId,
  });
  res.json({ success: true, data: config });
};

export const updateTermConfig = async (req: Request, res: Response) => {
  const { id } = req.params;
  const config = await configService.updateTermConfig(id, req.body);
  res.json({ success: true, data: config });
};

export const getAggregationConfigs = async (req: Request, res: Response) => {
  const configs = await configService.getAggregationConfigs();
  res.json({ success: true, data: configs });
};

export const getSpecificAggregationConfig = async (req: Request, res: Response) => {
  const { assessmentType } = req.params;
  const { grade, learningArea } = req.query;
  const config = await configService.getAggregationConfig({
    assessmentType: assessmentType as FormativeAssessmentType,
    grade: grade as unknown as Grade | undefined,
    learningArea: learningArea as string | undefined,
  });
  res.json({ success: true, data: config });
};

export const createAggregationConfig = async (req: AuthRequest, res: Response) => {
  const config = await configService.createAggregationConfig({
    ...req.body,
    createdBy: req.user!.userId,
  });
  res.status(201).json({ success: true, data: config });
};

export const updateAggregationConfig = async (req: Request, res: Response) => {
  const config = await configService.updateAggregationConfig(req.params.id, req.body);
  res.json({ success: true, data: config });
};

export const deleteAggregationConfig = async (req: Request, res: Response) => {
  await configService.deleteAggregationConfig(req.params.id);
  res.json({ success: true, message: 'Deleted' });
};

export const getStreamConfigs = async (req: Request, res: Response) => {
  const configs = await configService.getStreamConfigs();
  res.json({ success: true, data: configs });
};

export const upsertStreamConfig = async (req: AuthRequest, res: Response) => {
  const config = await configService.upsertStreamConfig(req.body);
  res.json({ success: true, data: config });
};

export const deleteStreamConfig = async (req: Request, res: Response) => {
  await configService.deleteStreamConfig(req.params.id);
  res.json({ success: true, message: 'Deleted' });
};

export const getClasses = async (req: Request, res: Response) => {
  const classes = await configService.getClasses();
  res.json({ success: true, data: classes });
};

export const upsertClass = async (req: AuthRequest, res: Response) => {
  const cls = await configService.upsertClass({ ...req.body });
  res.json({ success: true, data: cls });
};

export const deleteClass = async (req: Request, res: Response) => {
  await configService.deleteClass(req.params.id);
  res.json({ success: true, message: 'Deleted' });
};

export const getGrades = async (req: Request, res: Response) => {
  res.json({ success: true, data: GRADE_OPTIONS });
};

export const getConfigurationSummary = async (req: Request, res: Response) => {
  const activeTerm = await configService.getActiveTermConfig();
  const students = await prisma.learner.count({ where: { status: 'ACTIVE' } });
  const classes = await prisma.class.count({ where: { archived: false } });
  res.json({ success: true, data: { activeTerm, stats: { students, classes } } });
};

export const getAvailableStrategies = async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      { id: 'SIMPLE_AVERAGE', name: 'Simple Average', description: 'Calculates the mean of all scores' },
      { id: 'BEST_N', name: 'Best N Scores', description: 'Takes the top N scores' },
      { id: 'DROP_LOWEST_N', name: 'Drop Lowest N', description: 'Excludes the bottom N scores' },
    ],
  });
};

export const recalculateClassScores = async (req: Request, res: Response) => {
  const { classId, term, academicYear } = req.body;
  await calculationService.recalculateClassScores({ classId, term, academicYear });
  res.json({ success: true, message: 'Recalculation started' });
};

export const seedStreams = async (req: Request, res: Response) => {
  const streams = ['A', 'B', 'C', 'D'];
  for (const s of streams) await configService.upsertStreamConfig({ name: s });
  res.json({ success: true, message: 'Streams seeded' });
};

export const seedClasses = async (req: AuthRequest, res: Response) => {
  const year = new Date().getFullYear();
  const term: Term = 'TERM_1';
  const grades = [
    'PLAYGROUP', 'PP1', 'PP2',
    'GRADE_1', 'GRADE_2', 'GRADE_3',
    'GRADE_4', 'GRADE_5', 'GRADE_6',
    'GRADE_7', 'GRADE_8', 'GRADE_9',
  ];

  const results = [];
  let skipped = 0;
  for (const grade of grades) {
    const stream = 'A';
    const name = `${grade.replace('_', ' ')} ${stream}`;

    const existing = await prisma.class.findFirst({
      where: { grade, stream, academicYear: year, term },
    });

    if (!existing) {
      const totalClasses = await prisma.class.count();
      const classCode = `CLS-${String(totalClasses + 1).padStart(5, '0')}`;

      const newClass = await prisma.class.create({
        data: { classCode, name, grade, stream, academicYear: year, term, active: true },
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
    data: results,
  });
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
  recalculateClassScores,
  seedStreams,
  seedClasses,
};
