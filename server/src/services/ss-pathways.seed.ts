import { PrismaClient } from '@prisma/client';

type PathwayCode = 'STEM' | 'SOCIAL_SCIENCES' | 'ARTS_SPORTS' | 'CORE';

const PATHWAYS: Array<{ code: PathwayCode; name: string; description?: string }> = [
  { code: 'CORE', name: 'Core (All Students)', description: 'Compulsory learning areas for all students' },
  { code: 'STEM', name: 'STEM', description: 'Science, Technology, Engineering and Mathematics' },
  { code: 'SOCIAL_SCIENCES', name: 'Social Sciences', description: 'Humanities, business, economics, and languages' },
  { code: 'ARTS_SPORTS', name: 'Arts & Sports Science', description: 'Arts, performing arts, and sports science' },
];

const CATEGORIES: Record<PathwayCode, Array<{ code: string; name: string; minSelect: number; maxSelect?: number }>> = {
  CORE: [{ code: 'CORE', name: 'Core', minSelect: 4, maxSelect: 5 }],
  STEM: [
    { code: 'PURE_SCIENCES', name: 'Pure Sciences', minSelect: 2, maxSelect: 4 },
    { code: 'APPLIED_SCIENCES', name: 'Applied Sciences', minSelect: 0, maxSelect: 4 },
    { code: 'TECH_ENGINEERING', name: 'Technical & Engineering', minSelect: 0, maxSelect: 4 },
    { code: 'CTS', name: 'Career & Technology Studies (CTS)', minSelect: 0, maxSelect: 4 },
  ],
  SOCIAL_SCIENCES: [
    { code: 'HUMANITIES', name: 'Humanities', minSelect: 1, maxSelect: 4 },
    { code: 'BUSINESS_ECONOMICS', name: 'Business & Economics', minSelect: 0, maxSelect: 3 },
    { code: 'LANGUAGES', name: 'Languages', minSelect: 0, maxSelect: 4 },
  ],
  ARTS_SPORTS: [
    { code: 'ARTS', name: 'Arts', minSelect: 0, maxSelect: 4 },
    { code: 'PERFORMING', name: 'Performing Arts', minSelect: 0, maxSelect: 4 },
    { code: 'SPORTS_SCIENCE', name: 'Sports Science', minSelect: 0, maxSelect: 3 },
    { code: 'SPORTS_OPTIONS', name: 'Sports Options', minSelect: 0, maxSelect: 4 },
  ],
};

export async function seedSeniorPathways(prisma: PrismaClient) {
  const pathwayIdByCode = new Map<PathwayCode, string>();

  for (const p of PATHWAYS) {
    const row = await prisma.pathway.upsert({
      where: { code: p.code },
      update: { name: p.name, description: p.description ?? null, active: true },
      create: { code: p.code, name: p.name, description: p.description ?? null, active: true },
      select: { id: true, code: true },
    });
    pathwayIdByCode.set(row.code as PathwayCode, row.id);
  }

  for (const pathwayCode of Object.keys(CATEGORIES) as PathwayCode[]) {
    const pathwayId = pathwayIdByCode.get(pathwayCode);
    if (!pathwayId) continue;

    for (const c of CATEGORIES[pathwayCode]) {
      await prisma.subjectCategory.upsert({
        where: { pathwayId_code: { pathwayId, code: c.code } },
        update: { name: c.name, minSelect: c.minSelect, maxSelect: c.maxSelect ?? null, active: true },
        create: { pathwayId, code: c.code, name: c.name, minSelect: c.minSelect, maxSelect: c.maxSelect ?? null, active: true },
      });
    }
  }
}

