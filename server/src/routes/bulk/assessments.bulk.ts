/**
 * Bulk Operations for Assessments (Scores)
 * Handles Excel/CSV import for student scores
 */

import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/permissions.middleware';
import { rateLimit } from '../../middleware/enhanced-rateLimit.middleware';
import { auditLog } from '../../middleware/permissions.middleware';
import { PrismaClient, Grade, Term, SummativeGrade, TestStatus } from '@prisma/client';
import multer from 'multer';
import * as XLSX from 'xlsx';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Helper to calculate grade based on percentage
 */
function calculateGrade(percentage: number): SummativeGrade {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'E';
}

function calculateStatus(percentage: number): TestStatus {
    return percentage >= 50 ? 'PASS' : 'FAIL';
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
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const {
            academicYear,
            term,
            grade,
            columnMapping,
            admissionColumn = 'Admission Number'
        } = req.body;

        if (!academicYear || !term || !grade || !columnMapping) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const parsedMapping = JSON.parse(columnMapping);
        const yearInt = parseInt(academicYear);

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data: any[] = XLSX.utils.sheet_to_json(worksheet);

        const results = {
            created: 0,
            updated: 0,
            failed: 0,
            errors: [] as any[]
        };

        const learningAreas = Object.values(parsedMapping) as string[];
        const testMap: Record<string, string> = {};

        for (const la of learningAreas) {
            let test = await prisma.summativeTest.findFirst({
                where: {
                    learningArea: la,
                    grade: grade as Grade,
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
                        grade: grade as Grade,
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
        }

        for (const [index, row] of data.entries()) {
            try {
                const admNo = String(row[admissionColumn] || row['Adm No'] || row['Admission Number'] || '').trim();
                if (!admNo) {
                    results.failed++;
                    results.errors.push({ row: index + 2, error: 'Admission number missing' });
                    continue;
                }

                const learner = await prisma.learner.findUnique({
                    where: { admissionNumber: admNo }
                });

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

                    await prisma.summativeResult.upsert({
                        where: {
                            testId_learnerId: {
                                testId,
                                learnerId: learner.id
                            }
                        },
                        update: {
                            marksObtained: Math.round(score),
                            percentage: score,
                            grade: calculateGrade(score),
                            status: calculateStatus(score),
                            recordedBy: req.user!.userId,
                        },
                        create: {
                            testId,
                            learnerId: learner.id,
                            marksObtained: Math.round(score),
                            percentage: score,
                            grade: calculateGrade(score),
                            status: calculateStatus(score),
                            recordedBy: req.user!.userId,
                        }
                    });

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
        res.status(500).json({ error: 'Failed to process bulk upload', details: error.message });
    }
});

export default router;
