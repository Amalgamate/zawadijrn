import prisma from '../config/database';

type IntegrityIssue = {
  severity: 'warning' | 'error';
  code: string;
  message: string;
  details?: Record<string, any>;
};

export async function runSeniorPathwayIntegrityCheck() {
  const issues: IntegrityIssue[] = [];

  const pathways = await prisma.pathway.findMany({
    where: { active: true },
    select: { id: true, code: true, name: true },
  });
  const pathwayById = new Map(pathways.map((p) => [p.id, p.code]));

  const categories = await prisma.subjectCategory.findMany({
    where: { active: true },
    select: { id: true, pathwayId: true, code: true, name: true },
  });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const secondaryAreas = await prisma.learningArea.findMany({
    where: { institutionType: 'SECONDARY' },
    select: { id: true, name: true, gradeLevel: true, pathwayId: true, categoryId: true, isCore: true },
    orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
  });

  const grouped = new Map<string, typeof secondaryAreas>();
  for (const area of secondaryAreas) {
    const key = `${String(area.gradeLevel || '').toUpperCase()}::${String(area.name || '').trim().toUpperCase()}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(area);
  }

  for (const [key, rows] of grouped.entries()) {
    if (rows.length <= 1) continue;
    const mappingSet = new Set(
      rows.map((r) => `${r.pathwayId || 'none'}::${r.categoryId || 'none'}::${r.isCore ? 'core' : 'pathway'}`)
    );
    if (mappingSet.size > 1) {
      issues.push({
        severity: 'error',
        code: 'CONFLICTING_SUBJECT_MAPPING',
        message: `Conflicting pathway/category mapping detected for "${key}".`,
        details: {
          learningAreaIds: rows.map((r) => r.id),
          variants: rows.map((r) => ({
            id: r.id,
            pathwayCode: r.pathwayId ? pathwayById.get(r.pathwayId) : null,
            categoryCode: r.categoryId ? categoryById.get(r.categoryId)?.code : null,
            isCore: r.isCore,
          })),
        },
      });
    }
  }

  const orphanPathwayAreas = secondaryAreas.filter((a) => !a.isCore && !a.pathwayId);
  if (orphanPathwayAreas.length > 0) {
    issues.push({
      severity: 'warning',
      code: 'ORPHAN_SECONDARY_SUBJECTS',
      message: 'Some secondary non-core subjects are missing pathway linkage.',
      details: { learningAreaIds: orphanPathwayAreas.map((a) => a.id).slice(0, 50), count: orphanPathwayAreas.length },
    });
  }

  return {
    success: issues.filter((i) => i.severity === 'error').length === 0,
    checkedAt: new Date().toISOString(),
    counts: {
      pathways: pathways.length,
      categories: categories.length,
      secondaryLearningAreas: secondaryAreas.length,
      issues: issues.length,
      errors: issues.filter((i) => i.severity === 'error').length,
      warnings: issues.filter((i) => i.severity === 'warning').length,
    },
    issues,
  };
}

