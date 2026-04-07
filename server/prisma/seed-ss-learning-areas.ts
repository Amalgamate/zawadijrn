import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GRADES = ['GRADE10', 'GRADE11', 'GRADE12'] as const;

const SS_CORE = [
  'English',
  'Kiswahili',
  'Kenya Sign Language',
  'Community Service Learning',
  'Physical Education',
];

const SS_STEM = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Agriculture',
  'Computer Science',
  'Foods & Nutrition',
  'Home Management',
  'Electrical Technology',
  'Mechanical Technology',
  'Electronics Technology',
  'Construction Technology',
  'Wood Technology',
  'Aviation Technology',
  'Marine & Fisheries Technology',
  'Mechatronics',
  'Media Technology',
  'Hairdressing & Beauty',
  'Culinary Arts',
  'Plumbing',
  'Welding & Fabrication',
  'Motor Vehicle Mechanics',
  'Graphic Design & Animation',
  'Photography',
  'Tourism & Travel',
  'Carpentry & Joinery',
  'Fashion & Garment Making',
  'Electrical Installation',
];

const SS_SOCIAL = [
  'History & Citizenship',
  'Geography',
  'CRE',
  'IRE',
  'HRE',
  'Business Studies',
  'Economics',
  'Literature in English',
  'Fasihi ya Kiswahili',
  'Indigenous Languages',
  'French',
  'German',
  'Arabic',
  'Mandarin',
];

const SS_ARTS_SPORTS = [
  'Fine Art',
  'Applied Art',
  'Crafts',
  'Film & Digital Media',
  'Music',
  'Dance',
  'Theatre & Elocution',
  'Human Physiology',
  'Anatomy & Nutrition',
  'Sports Ethics',
  'Athletics',
  'Ball Games',
  'Gymnastics',
  'Water Sports',
  'Martial Arts',
  'Boxing',
  'Outdoor Pursuits',
];

const shortNameMapping: Record<string, string> = {
  English: 'ENG',
  Kiswahili: 'KISW',
  'Kenya Sign Language': 'KSL',
  'Community Service Learning': 'CSL',
  'Physical Education': 'PE',
  Mathematics: 'MATH',
  Physics: 'PHY',
  Chemistry: 'CHEM',
  Biology: 'BIO',
  Agriculture: 'AGRI',
  'Computer Science': 'CS',
  'Foods & Nutrition': 'FN',
  'Home Management': 'HM',
  'History & Citizenship': 'HIST',
  Geography: 'GEO',
  CRE: 'CRE',
  IRE: 'IRE',
  HRE: 'HRE',
  'Business Studies': 'BST',
  Economics: 'ECON',
  'Literature in English': 'LIT',
  'Fasihi ya Kiswahili': 'FAS',
  French: 'FRE',
  German: 'GER',
  Arabic: 'ARB',
  Mandarin: 'MAN',
};

function toShort(name: string) {
  return shortNameMapping[name] || name.substring(0, 5).toUpperCase();
}

function getPathway(name: string) {
  if (SS_CORE.includes(name)) return 'CORE';
  if (SS_STEM.includes(name)) return 'STEM';
  if (SS_SOCIAL.includes(name)) return 'SOCIAL_SCIENCES';
  if (SS_ARTS_SPORTS.includes(name)) return 'ARTS_SPORTS';
  return undefined;
}

function getCategoryCode(name: string) {
  if (SS_CORE.includes(name)) return 'CORE';
  if (['Mathematics', 'Physics', 'Chemistry', 'Biology'].includes(name)) return 'PURE_SCIENCES';
  if (['Agriculture', 'Computer Science', 'Foods & Nutrition', 'Home Management'].includes(name)) return 'APPLIED_SCIENCES';
  if ([
    'Electrical Technology',
    'Mechanical Technology',
    'Electronics Technology',
    'Construction Technology',
    'Wood Technology',
    'Aviation Technology',
    'Marine & Fisheries Technology',
    'Mechatronics',
    'Media Technology',
  ].includes(name)) return 'TECH_ENGINEERING';
  if ([
    'Hairdressing & Beauty',
    'Culinary Arts',
    'Plumbing',
    'Welding & Fabrication',
    'Motor Vehicle Mechanics',
    'Graphic Design & Animation',
    'Photography',
    'Tourism & Travel',
    'Carpentry & Joinery',
    'Fashion & Garment Making',
    'Electrical Installation',
  ].includes(name)) return 'CTS';
  if (['History & Citizenship', 'Geography', 'CRE', 'IRE', 'HRE'].includes(name)) return 'HUMANITIES';
  if (['Business Studies', 'Economics'].includes(name)) return 'BUSINESS_ECONOMICS';
  if ([
    'Literature in English',
    'Fasihi ya Kiswahili',
    'Indigenous Languages',
    'French',
    'German',
    'Arabic',
    'Mandarin',
    'Kenya Sign Language',
  ].includes(name)) return 'LANGUAGES';
  if (['Fine Art', 'Applied Art', 'Crafts', 'Film & Digital Media'].includes(name)) return 'ARTS';
  if (['Music', 'Dance', 'Theatre & Elocution'].includes(name)) return 'PERFORMING';
  if (['Human Physiology', 'Anatomy & Nutrition', 'Sports Ethics'].includes(name)) return 'SPORTS_SCIENCE';
  if (['Athletics', 'Ball Games', 'Gymnastics', 'Water Sports', 'Martial Arts', 'Boxing', 'Outdoor Pursuits'].includes(name)) return 'SPORTS_OPTIONS';
  return undefined;
}

async function main() {
  console.log('🎓 Seeding Senior Secondary learning areas (CBC pathways catalog)...');

  const pathways = await prisma.pathway.findMany({ where: { active: true }, select: { id: true, code: true } });
  const pathwayIds = pathways.reduce((a, p) => { a[p.code] = p.id; return a; }, {} as Record<string, string>);
  const categories = await prisma.subjectCategory.findMany({ where: { active: true }, select: { id: true, code: true, pathway: { select: { code: true } } } });
  const categoryIds = categories.reduce((a, c) => { a[`${c.pathway.code}::${c.code}`] = c.id; return a; }, {} as Record<string, string>);

  const allSubjects = Array.from(new Set([...SS_CORE, ...SS_STEM, ...SS_SOCIAL, ...SS_ARTS_SPORTS]));

  const rows = [];
  for (const gradeLevel of GRADES) {
    for (const name of allSubjects) {
      const pathway = getPathway(name);
      const categoryCode = getCategoryCode(name);
      const pathwayId = pathway ? pathwayIds[pathway] : undefined;
      const categoryId = pathway && categoryCode ? categoryIds[`${pathway}::${categoryCode}`] : undefined;

      rows.push({
        name,
        shortName: toShort(name),
        gradeLevel,
        institutionType: 'SECONDARY' as const,
        isCore: pathway === 'CORE',
        pathway,
        category: categoryCode,
        pathwayId: pathwayId || null,
        categoryId: categoryId || null,
        icon: '🎓',
        color: '#6366f1',
      });
    }
  }

  const result = await prisma.learningArea.createMany({ data: rows as any, skipDuplicates: true });
  console.log(`✅ Done. Created ${result.count} (skipDuplicates enabled).`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

