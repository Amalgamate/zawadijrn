import prisma from '../config/database';

/**
 * Generates a unique, human-readable admission number
 * 
 * Format depends on school's admissionFormatType:
 * - NO_BRANCH:           ADM-{YEAR}-{SEQUENCE}
 * - BRANCH_PREFIX_START: {BRANCH_CODE}-ADM-{YEAR}-{SEQUENCE}
 * - BRANCH_PREFIX_MIDDLE: ADM-{BRANCH_CODE}-{YEAR}-{SEQUENCE}
 * - BRANCH_PREFIX_END:   ADM-{YEAR}-{SEQUENCE}-{BRANCH_CODE}
 */
export async function generateAdmissionNumber(
  _branchCode: string = 'MC',
  _academicYear: number = new Date().getFullYear()
): Promise<string> {
  try {
    const admissionNumber = await prisma.$transaction(async (tx) => {
      return await findNextAvailableAdmissionNumber(tx);
    });

    return admissionNumber;
  } catch (error) {
    console.error('✗ Error generating admission number:', error);
    throw error;
  }
}

export async function getCurrentSequenceValue(academicYear: number): Promise<number | null> {
  const sequence = await prisma.admissionSequence.findUnique({ where: { academicYear } });
  return sequence ? sequence.currentValue : null;
}

export async function getNextAdmissionNumberPreview(
  _branchCode: string = 'MC',
  _academicYear: number = new Date().getFullYear()
): Promise<string | null> {
  return await findNextAvailableAdmissionNumber(prisma);
}

export async function resetSequence(academicYear: number, newValue: number = 0): Promise<void> {
  await prisma.admissionSequence.upsert({
    where: { academicYear },
    update: { currentValue: newValue },
    create: { academicYear, currentValue: newValue }
  });
}

export function extractSequenceNumber(
  admissionNumber: string,
  formatType: string = 'BRANCH_PREFIX_START',
  separator: string = '-'
): number | null {
  const escapedSeparator = separator === '.' ? '\\.' : separator;
  let pattern: RegExp;

  switch (formatType) {
    case 'NO_BRANCH':
      pattern = new RegExp(`^ADM${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})$`);
      break;
    case 'BRANCH_PREFIX_START':
      pattern = new RegExp(`^[A-Z0-9]+${escapedSeparator}ADM${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})$`);
      break;
    case 'BRANCH_PREFIX_MIDDLE':
      pattern = new RegExp(`^ADM${escapedSeparator}[A-Z0-9]+${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})$`);
      break;
    case 'BRANCH_PREFIX_END':
      pattern = new RegExp(`^ADM${escapedSeparator}\\d{4}${escapedSeparator}(\\d{3})${escapedSeparator}[A-Z0-9]+$`);
      break;
    default:
      return null;
  }

  const match = admissionNumber.match(pattern);
  return match ? parseInt(match[1], 10) : null;
}

function defaultAdmissionStart(): string {
  return '1000';
}

function incrementAdmissionNumber(admissionNumber: string, increment: number = 1): string {
  const match = admissionNumber.match(/^(.*?)(\d+)$/);
  if (!match) {
    return `${admissionNumber}${increment}`;
  }

  const prefix = match[1] ?? '';
  const numericPart = match[2] ?? '0';
  const width = numericPart.length;
  const nextNumber = Number.parseInt(numericPart, 10) + increment;
  const nextNumericPart = String(nextNumber).padStart(width, '0');
  return `${prefix}${nextNumericPart}`;
}

async function findNextAvailableAdmissionNumber(db: any): Promise<string> {
  const lastLearner = await db.learner.findFirst({
    where: { admissionNumber: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { admissionNumber: true }
  });

  const seed = lastLearner?.admissionNumber || defaultAdmissionStart();
  let candidate = lastLearner?.admissionNumber ? incrementAdmissionNumber(seed) : seed;

  // Always validate against DB and move forward until we find a free key.
  // This prevents stale preview collisions and out-of-order historical numbering issues.
  while (true) {
    const exists = await db.learner.findUnique({ where: { admissionNumber: candidate } });
    if (!exists) return candidate;
    candidate = incrementAdmissionNumber(candidate);
  }
}
