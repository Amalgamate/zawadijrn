import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/permissions.middleware';
import { rateLimit } from '../../middleware/enhanced-rateLimit.middleware';
import { auditLog } from '../../middleware/permissions.middleware';
import { Term, TestStatus } from '@prisma/client';
import prisma from '../../config/database';
import multer from 'multer';
import { gradingService } from '../../services/grading.service';

// FIX: `exceljs` has no bundled .d.ts in some Render environments.
// Use a require() fallback with an explicit type cast so TypeScript is
// satisfied even when @types/exceljs is absent from node_modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExcelJS: typeof import('exceljs') = require('exceljs');

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function calculateStatus(percentage: number, passMark = 50): TestStatus {
    return percentage >= passMark ? 'PASS' : 'FAIL';
}

function normalizeText(v: string): string {
    return String(v || '').trim().toLowerCase();
}

/**
 * Parse an uploaded xlsx/xls/csv buffer with ExcelJS.
 * Returns an array of plain objects keyed by the header row.
 *
 * FIX: Added explicit types for the eachRow callback parameters so that
 * TypeScript does not emit TS7006 ("parameter implicitly has 'any' type").
 */
async function parseWorkbook(buffer: Buffer): Promise<Record<string, any>[]> {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);

    const ws = wb.worksheets[0];
    if (!ws) return [];

    const rows: Record<string, any>[] = [];
    let headers: string[] = [];

    ws.eachRow((row: import('exceljs').Row, rowNumber: number) => {
        const values = (row.values as any[]).slice(1); // ExcelJS uses 1-based index; index 0 is empty
        if (rowNumber === 1) {
            // Header row
            headers = values.map((v: any) => (v == null ? '' : String(v).trim()));
        } else {
            const obj: Record<string, any> = {};
            headers.forEach((h: string, i: number) => {
                const cell = values[i];
                // Unwrap rich-text objects ExcelJS sometimes returns
                obj[h] = cell && typeof cell === 'object' && 'richText' in cell
                    ? cell.richText.map((r: any) => r.text).join('')
                    : cell ?? null;
            });
            rows.push(obj);
        }
    });

    return rows;
}

/**
 * POST /api/bulk/assessments/upload
 */
router.post(
    '/upload',
    upload.single('file'),
    rateLimit({ windowMs: 60_000, maxRequests: 10 }),
    auditLog('BULK_UPLOAD_ASSESSMENTS'),
    async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const {
            academicYear,
            term,
            grade,
            columnMapping,
            admissionColumn = 'Admission Number'
        } = req.body;

        if (!academicYear || !term || !grade || !columnMapping) {
            return res.status(400).json({ success: false, error: 'Missing required parameters' });
        }

        const parsedMapping = JSON.parse(columnMapping);
        const yearInt = parseInt(academicYear);

        const data = await parseWorkbook(req.file.buffer);

        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: [] as any[]
        };

        const learningAreas = Object.values(parsedMapping) as string[];
        const testMap: Record<string, string> = {};
        const testPassMarkMap: Record<string, number> = {};
        const learningAreaIdMap: Record<string, string | null> = {};
        const institutionType = (req.user?.institutionType || 'PRIMARY_CBC') as any;
        const summativeSystem = await gradingService.getGradingSystem('SUMMATIVE');
        const summativeRanges = summativeSystem.ranges || [];

        const areaRows = await prisma.learningArea.findMany({
            where: {
                institutionType,
                gradeLevel: String(grade),
                name: { in: learningAreas.map((x) => String(x)) },
            },
            select: { id: true, name: true },
        });
        const areaByName = new Map(areaRows.map((r) => [normalizeText(r.name), r]));

        for (const la of learningAreas) {
            const resolvedArea = areaByName.get(normalizeText(String(la)));
            learningAreaIdMap[la] = resolvedArea?.id || null;
            if (!resolvedArea) {
                results.errors.push({
                    row: 1,
                    subject: la,
                    error: `Learning area "${la}" not found for ${institutionType} ${grade}. Linking by text only.`,
                });
            }

            let test = await prisma.summativeTest.findFirst({
                where: {
                    ...(resolvedArea?.id
                        ? { learningAreaId: resolvedArea.id }
                        : { learningArea: la }),
                    grade: grade as any,
                    term: term as Term,
                    academicYear: yearInt,
                    archived: false
                }
            });

            if (!test) {
                test = await prisma.summativeTest.create({
                    data: {
                        title: `${la} - ${term} ${yearInt}`,
                        learningArea: la,
                        learningAreaId: resolvedArea?.id || null,
                        grade: grade as any,
                        term: term as Term,
                        academicYear: yearInt,
                        testDate: new Date(),
                        totalMarks: 100,
                        passMarks: 50,
                        createdBy: req.user!.userId,
                        status: 'PUBLISHED',
                        published: true,
                        active: true
                    }
                });
            }
            testMap[la] = test.id;
            testPassMarkMap[la] = Number(test.passMarks ?? 50);
        }

        for (const [index, row] of data.entries()) {
            try {
                const admNo = String(row[admissionColumn] ?? row['Adm No'] ?? row['Admission Number'] ?? '').trim();
                if (!admNo) {
                    results.failed++;
                    results.errors.push({ row: index + 2, error: 'Admission number missing' });
                    continue;
                }

                const learner = await prisma.learner.findUnique({ where: { admissionNumber: admNo } });

                if (!learner) {
                    results.failed++;
                    results.errors.push({ row: index + 2, admNo, error: `Student ${admNo} not found` });
                    continue;
                }

                for (const [csvCol, laName] of Object.entries(parsedMapping)) {
                    const scoreRaw = row[csvCol];
                    if (scoreRaw === undefined || scoreRaw === null || scoreRaw === '') continue;

                    const score = parseFloat(String(scoreRaw));
                    if (isNaN(score)) {
                        results.errors.push({ row: index + 2, admNo, subject: laName, error: `Invalid score for ${laName}: ${scoreRaw}` });
                        continue;
                    }

                    const testId = testMap[laName as string];
                    const grade = gradingService.calculateGradeSync(score, summativeRanges);
                    const status = calculateStatus(score, testPassMarkMap[laName as string] ?? 50);
                    const learningAreaId = learningAreaIdMap[laName as string];

                    await prisma.summativeResult.upsert({
                        where: { testId_learnerId: { testId, learnerId: learner.id } },
                        update: {
                            marksObtained: Math.round(score),
                            percentage: score,
                            grade,
                            status,
                            recordedBy: req.user!.userId,
                        },
                        create: {
                            testId,
                            learnerId: learner.id,
                            marksObtained: Math.round(score),
                            percentage: score,
                            grade,
                            status,
                            recordedBy: req.user!.userId,
                        }
                    });

                    if (learningAreaId) {
                        await prisma.summativeTest.updateMany({
                            where: { id: testId, learningAreaId: null },
                            data: { learningAreaId },
                        });
                    }

                    results.created++;
                }

            } catch (err: any) {
                results.failed++;
                results.errors.push({ row: index + 2, error: err.message });
            }
        }

        res.json({
            success: true,
            summary: {
                totalRows: data.length,
                resultsProcessed: results.created,
                errorsFound: results.errors.length
            },
            errors: results.errors.slice(0, 50)
        });

    } catch (error: any) {
        console.error('Bulk assessment upload error:', error);
        res.status(500).json({ success: false, error: 'Failed to process bulk upload', details: error.message });
    }
});

export default router;
