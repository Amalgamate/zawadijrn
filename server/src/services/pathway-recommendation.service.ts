import prisma from '../config/database';
import { aiAssistantService } from './ai-assistant.service';
import { ApiError } from '../utils/error.util';
import { Term } from '@prisma/client';

type RecommendedPathwayCode = 'STEM' | 'SOCIAL_SCIENCES' | 'ARTS_SPORTS';

function normalizePrediction(predictedPathway: string): RecommendedPathwayCode | null {
  const p = String(predictedPathway || '').toLowerCase();
  if (p === 'stem') return 'STEM';
  if (p.includes('social')) return 'SOCIAL_SCIENCES';
  if (p.includes('arts')) return 'ARTS_SPORTS';
  return null;
}

function pickN<T>(arr: T[], n: number) {
  return arr.slice(0, Math.max(0, n));
}

export async function recommendSeniorPathwayAndSubjects(opts: {
  learnerId: string;
  term: Term;
  academicYear: number;
  targetGradeLevel?: 'GRADE10' | 'GRADE11' | 'GRADE12';
}) {
  const { learnerId, term, academicYear } = opts;
  const targetGradeLevel = opts.targetGradeLevel || 'GRADE10';

  const learner = await prisma.learner.findUnique({
    where: { id: learnerId },
    select: { id: true, firstName: true, lastName: true, grade: true, institutionType: true },
  });
  if (!learner) throw new ApiError(404, 'Learner not found');

  // Recommendation is based on Grade 7–9 only.
  const eligible = ['GRADE_7', 'GRADE_8', 'GRADE_9'].includes(String(learner.grade));
  if (!eligible) {
    throw new ApiError(400, 'Recommendations are available for Grade 7–9 learners only (to guide Senior Secondary pathway selection).');
  }

  const prediction = await aiAssistantService.generatePathwayPrediction(learnerId, term as any, academicYear);
  const pathwayCode = normalizePrediction(prediction?.predictedPathway);
  if (!pathwayCode) {
    return {
      success: true,
      data: {
        learner,
        prediction,
        recommendation: null,
        message: 'Insufficient data to generate a recommendation. Ensure summative results exist for this term.',
      }
    };
  }

  const corePathway = await prisma.pathway.findUnique({ where: { code: 'CORE' }, select: { id: true, code: true, name: true } });
  const chosenPathway = await prisma.pathway.findUnique({ where: { code: pathwayCode }, select: { id: true, code: true, name: true } });
  if (!corePathway || !chosenPathway) throw new ApiError(500, 'Pathway catalog not seeded');

  // Fetch categories + constraints for selected pathway
  const categories = await prisma.subjectCategory.findMany({
    where: { pathwayId: chosenPathway.id, active: true },
    select: { id: true, code: true, name: true, minSelect: true, maxSelect: true },
    orderBy: { name: 'asc' },
  });

  // Fetch SS learning areas for the *catalog grade level* to recommend from (GRADE10 default)
  const coreAreas = await prisma.learningArea.findMany({
    where: {
      institutionType: 'SECONDARY',
      gradeLevel: targetGradeLevel,
      pathwayId: corePathway.id,
      active: undefined as any, // keep prisma happy if schema differs in prod
    } as any,
    select: { id: true, name: true, shortName: true, isCore: true, categoryId: true },
    orderBy: { name: 'asc' },
  });

  const pathwayAreas = await prisma.learningArea.findMany({
    where: {
      institutionType: 'SECONDARY',
      gradeLevel: targetGradeLevel,
      pathwayId: chosenPathway.id,
    },
    select: { id: true, name: true, shortName: true, isCore: true, categoryId: true },
    orderBy: { name: 'asc' },
  });

  // Simple deterministic suggestion:
  // - Always include all core areas
  // - For each category, include minSelect (or 1 if minSelect=0 and maxSelect>0) up to maxSelect (bounded)
  const suggested: Array<{ learningAreaId: string; name: string; categoryId: string | null }> = [];

  for (const a of coreAreas) suggested.push({ learningAreaId: a.id, name: a.name, categoryId: a.categoryId ?? null });

  for (const c of categories) {
    const inCat = pathwayAreas.filter(a => a.categoryId === c.id);
    const want = c.minSelect > 0 ? c.minSelect : (c.maxSelect ? 1 : 0);
    const take = c.maxSelect != null ? Math.min(want, c.maxSelect) : want;
    for (const a of pickN(inCat, take)) {
      suggested.push({ learningAreaId: a.id, name: a.name, categoryId: a.categoryId ?? null });
    }
  }

  // De-dup (core + pathway overlaps)
  const seen = new Set<string>();
  const uniqueSuggested = suggested.filter(s => {
    if (seen.has(s.learningAreaId)) return false;
    seen.add(s.learningAreaId);
    return true;
  });

  return {
    success: true,
    data: {
      learner,
      prediction,
      recommendation: {
        pathway: chosenPathway,
        targetGradeLevel,
        suggestedSubjects: uniqueSuggested,
        constraints: categories,
      },
    }
  };
}

