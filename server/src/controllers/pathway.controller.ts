import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { ApiError } from '../utils/error.util';
import { seedSeniorPathways } from '../services/ss-pathways.seed';
import { runSeniorPathwayIntegrityCheck } from '../services/pathway-integrity.service';
import { hasFinalizedTransitionDecision } from '../services/pathway-transition-decision.service';

type SelectionItem = { learningAreaId: string; active?: boolean };

const normalizeGradeLevel = (value?: string | null): string => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  return raw.replace(/^GRADE_(\d+)$/, 'GRADE$1');
};

function assertSecondaryLearner(learner: { institutionType: any }) {
  if (learner.institutionType !== 'SECONDARY') {
    throw new ApiError(400, 'Pathways are only supported for Senior Secondary (SECONDARY) learners');
  }
}

async function getCategoryConstraints(pathwayId: string) {
  const categories = await prisma.subjectCategory.findMany({
    where: { pathwayId, active: true },
    select: { id: true, code: true, name: true, minSelect: true, maxSelect: true },
    orderBy: { name: 'asc' },
  });
  return categories;
}

function validateSelections({
  categories,
  selectedAreas,
}: {
  categories: Array<{ id: string; code: string; name: string; minSelect: number; maxSelect: number | null }>;
  selectedAreas: Array<{ id: string; categoryId: string | null; isCore: boolean }>;
}) {
  const errors: Array<{ code: string; message: string; details?: any }> = [];

  const countsByCategory = new Map<string, number>();
  for (const a of selectedAreas) {
    if (!a.categoryId) continue;
    countsByCategory.set(a.categoryId, (countsByCategory.get(a.categoryId) || 0) + 1);
  }

  for (const c of categories) {
    const n = countsByCategory.get(c.id) || 0;
    if (n < c.minSelect) {
      errors.push({
        code: 'CATEGORY_MIN',
        message: `Category "${c.name}" requires at least ${c.minSelect} subject(s).`,
        details: { categoryId: c.id, categoryCode: c.code, requiredMin: c.minSelect, selected: n },
      });
    }
    if (c.maxSelect != null && n > c.maxSelect) {
      errors.push({
        code: 'CATEGORY_MAX',
        message: `Category "${c.name}" allows at most ${c.maxSelect} subject(s).`,
        details: { categoryId: c.id, categoryCode: c.code, allowedMax: c.maxSelect, selected: n },
      });
    }
  }

  const coreSelected = selectedAreas.filter(a => a.isCore).length;
  if (coreSelected === 0) {
    errors.push({
      code: 'CORE_REQUIRED',
      message: 'Core subjects are required. Please include the core learning areas.',
    });
  }

  return errors;
}

export const pathwayController = {
  seedPathwaysCatalog: async (_req: AuthRequest, res: Response) => {
    await seedSeniorPathways(prisma as any);
    const integrity = await runSeniorPathwayIntegrityCheck();
    res.json({
      success: true,
      message: 'Senior secondary pathways seeded successfully',
      integrity,
    });
  },

  getCatalogIntegrity: async (_req: AuthRequest, res: Response) => {
    const integrity = await runSeniorPathwayIntegrityCheck();
    res.json({ success: integrity.success, data: integrity });
  },

  listPathways: async (_req: AuthRequest, res: Response) => {
    const pathways = await prisma.pathway.findMany({
      where: { active: true },
      select: { id: true, code: true, name: true, description: true },
      orderBy: [{ code: 'asc' }],
    });
    res.json({ success: true, data: pathways });
  },

  getPathwayCategories: async (req: AuthRequest, res: Response) => {
    const { code } = req.params;
    const pathway = await prisma.pathway.findUnique({ where: { code }, select: { id: true, code: true, name: true } });
    if (!pathway) throw new ApiError(404, 'Pathway not found');

    const categories = await getCategoryConstraints(pathway.id);
    res.json({ success: true, data: { pathway, categories } });
  },

  setLearnerPathway: async (req: AuthRequest, res: Response) => {
    const { learnerId } = req.params;
    const { pathwayCode } = req.body as { pathwayCode?: string };
    if (!pathwayCode) throw new ApiError(400, 'Missing pathwayCode');

    const learner = await prisma.learner.findUnique({ where: { id: learnerId }, select: { id: true, institutionType: true } });
    if (!learner) throw new ApiError(404, 'Learner not found');
    assertSecondaryLearner(learner);

    const pathway = await prisma.pathway.findUnique({ where: { code: String(pathwayCode) }, select: { id: true, code: true, name: true } });
    if (!pathway) throw new ApiError(404, 'Pathway not found');

    await prisma.learner.update({ where: { id: learnerId }, data: { pathwayId: pathway.id } });
    res.json({ success: true, message: 'Pathway selected', data: pathway });
  },

  setLearnerSubjects: async (req: AuthRequest, res: Response) => {
    const { learnerId } = req.params;
    const { selections } = req.body as { selections?: SelectionItem[] };
    if (!Array.isArray(selections)) throw new ApiError(400, 'Missing selections[]');

    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      select: { id: true, institutionType: true, pathwayId: true, grade: true },
    });
    if (!learner) throw new ApiError(404, 'Learner not found');
    assertSecondaryLearner(learner);
    if (!learner.pathwayId) throw new ApiError(400, 'Learner must select a pathway first');

    const subjectSelectionLocked = await hasFinalizedTransitionDecision(learnerId);
    if (subjectSelectionLocked) {
      throw new ApiError(409, 'Subject selection is locked after pathway approval');
    }

    const activeSelections = selections
      .filter(s => s && s.learningAreaId)
      .map(s => ({ learningAreaId: String(s.learningAreaId), active: s.active !== false }));

    const areaIds = Array.from(new Set(activeSelections.map(s => s.learningAreaId)));
    const normalizedLearnerGrade = normalizeGradeLevel(learner.grade);
    const gradeAliases = normalizedLearnerGrade
      ? [normalizedLearnerGrade, normalizedLearnerGrade.replace(/^GRADE(\d+)$/, 'GRADE_$1')]
      : [];

    const areas = await prisma.learningArea.findMany({
      where: {
        id: { in: areaIds },
        institutionType: 'SECONDARY',
        ...(gradeAliases.length ? { gradeLevel: { in: Array.from(new Set(gradeAliases)) } } : {}),
      },
      select: { id: true, categoryId: true, pathwayId: true, isCore: true },
    });

    const missing = areaIds.filter(id => !areas.some(a => a.id === id));
    if (missing.length) throw new ApiError(400, `Some learningAreaId values are invalid for this learner: ${missing.join(', ')}`);

    const categories = await getCategoryConstraints(learner.pathwayId);
    const errors = validateSelections({ categories, selectedAreas: areas });
    if (errors.length) {
      return res.status(400).json({ success: false, message: 'Invalid subject selection', errors });
    }

    // Upsert selections; deactivate any not included
    await prisma.$transaction(async (tx) => {
      await tx.learnerSubjectSelection.updateMany({
        where: { learnerId },
        data: { active: false },
      });

      for (const sel of activeSelections) {
        await tx.learnerSubjectSelection.upsert({
          where: { learnerId_learningAreaId: { learnerId, learningAreaId: sel.learningAreaId } },
          update: { active: sel.active },
          create: { learnerId, learningAreaId: sel.learningAreaId, active: sel.active },
        });
      }
    });

    res.json({ success: true, message: 'Subject selection saved' });
  },

  getLearnerPathwayAndSubjects: async (req: AuthRequest, res: Response) => {
    const { learnerId } = req.params;
    const [learner, subjectSelectionLocked] = await Promise.all([
      prisma.learner.findUnique({
      where: { id: learnerId },
      select: {
        id: true,
        institutionType: true,
        grade: true,
        pathway: { select: { id: true, code: true, name: true } },
        subjectSelections: {
          where: { active: true },
          select: { learningArea: { select: { id: true, name: true, shortName: true, isCore: true, pathway: true, category: true } } },
          orderBy: { createdAt: 'asc' },
        },
      }
      }),
      hasFinalizedTransitionDecision(learnerId),
    ]);
    if (!learner) throw new ApiError(404, 'Learner not found');
    assertSecondaryLearner(learner);
    res.json({ success: true, data: { ...learner, subjectSelectionLocked } });
  },
};
