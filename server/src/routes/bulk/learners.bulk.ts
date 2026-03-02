/**
 * Bulk Operations for Learners
 * Handles CSV import/export for student data
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { rateLimit } from '../../middleware/enhanced-rateLimit.middleware';
import { auditLog } from '../../middleware/permissions.middleware';
import { PrismaClient, Grade } from '@prisma/client';
import multer from 'multer';
import csvParser from 'csv-parser';
import { Parser } from 'json2csv';
import { Readable } from 'stream';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const learnerSchema = z.object({
  'Learner Name': z.string().optional(),
  'Leaner Name': z.string().optional(),
  'Name': z.string().optional(),
  'Adm No': z.string().min(1, 'Admission number is required'),
  'Class': z.string().min(1, 'Class is required'),
  'Stream': z.string().optional(),
  'Term': z.string().optional(),
  'Year': z.string().optional(),
  'Gender': z.string().optional(),
  'DOB': z.string().optional(),
  'Date of Birth': z.string().optional(),
  'Parent/Guardian': z.string().optional(),
  'Phone 1': z.string().optional(),
  'Phone 2': z.string().optional(),
  'Reg Date': z.string().optional(),
  'Bal Due': z.string().optional(),
}).refine(data => data['Learner Name'] || data['Leaner Name'] || data['Name'], {
  message: "Learner Name is required",
  path: ['Learner Name']
});

/**
 * POST /api/bulk/learners/upload
 */
router.post(
  '/upload',
  upload.single('file'),
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  auditLog('BULK_UPLOAD_LEARNERS'),
  async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const forceCreate = req.query.forceCreate === 'true';

    // In single-tenant, we just get the main branch or first branch
    let branch = await prisma.branch.findFirst({
      orderBy: { name: 'asc' },
    });

    if (!branch) {
      branch = await prisma.branch.create({
        data: { name: 'Main Campus' }
      });
    }

    const branchId = branch.id;

    const results: any[] = [];
    const errors: any[] = [];
    let lineNumber = 1;

    const stream = Readable.from(req.file.buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => {
          lineNumber++;
          try {
            const validated = learnerSchema.parse(data);
            results.push({
              line: lineNumber,
              data: validated,
              valid: true
            });
          } catch (error) {
            errors.push({
              line: lineNumber,
              data,
              error: error instanceof z.ZodError ? error.errors : 'Validation failed',
              valid: false
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const created: any[] = [];
    const updated: any[] = [];
    const failed: any[] = [];

    for (const item of results) {
      try {
        const csvData = item.data;
        const admNo = csvData['Adm No'];

        const gradeStr = (csvData['Class'] || '').toString().toUpperCase().trim();
        const gradeMap: { [key: string]: Grade } = {
          'CRECHE': 'CRECHE',
          'RECEPTION': 'RECEPTION',
          'TRANSITION': 'TRANSITION',
          'PLAYGROUP': 'PLAYGROUP',
          'PP1': 'PP1',
          'PP2': 'PP2',
          'GRADE 1': 'GRADE_1', 'GRADE 2': 'GRADE_2', 'GRADE 3': 'GRADE_3',
          'GRADE 4': 'GRADE_4', 'GRADE 5': 'GRADE_5', 'GRADE 6': 'GRADE_6',
          'GRADE 7': 'GRADE_7', 'GRADE 8': 'GRADE_8', 'GRADE 9': 'GRADE_9',
          'GRADE 10': 'GRADE_10', 'GRADE 11': 'GRADE_11', 'GRADE 12': 'GRADE_12',
          '1': 'GRADE_1', '2': 'GRADE_2', '3': 'GRADE_3', '4': 'GRADE_4',
          '5': 'GRADE_5', '6': 'GRADE_6', '7': 'GRADE_7', '8': 'GRADE_8',
          '9': 'GRADE_9', '10': 'GRADE_10', '11': 'GRADE_11', '12': 'GRADE_12',
        };

        let grade: Grade = 'GRADE_1';
        if (gradeMap[gradeStr]) {
          grade = gradeMap[gradeStr];
        } else {
          const match = Object.keys(gradeMap).find(k => gradeStr.includes(k));
          if (match) grade = gradeMap[match];
        }

        const rawName = csvData['Learner Name'] || csvData['Leaner Name'] || csvData['Name'] || '';
        const nameParts = rawName.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Student';

        let parentId: string | undefined;
        const parentName = csvData['Parent/Guardian'];
        const parentPhone = csvData['Phone 1'] ? String(csvData['Phone 1']).trim() : null;

        if (parentPhone) {
          const existingParent = await prisma.user.findFirst({
            where: { phone: parentPhone, role: 'PARENT' }
          });

          if (existingParent) {
            parentId = existingParent.id;
          } else if (parentName) {
            const pNameParts = parentName.trim().split(' ');
            const pFirstName = pNameParts[0] || 'Parent';
            const pLastName = pNameParts.slice(1).join(' ') || 'Guardian';
            const cleanPhone = parentPhone.replace(/\D/g, '');
            const email = `parent.${cleanPhone || Math.random().toString(36).substring(7)}@edu-core.test`;

            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash('Parent@123', 10);

            const newParent = await prisma.user.create({
              data: {
                email,
                password: hashedPassword,
                firstName: pFirstName,
                lastName: pLastName,
                phone: parentPhone,
                role: 'PARENT',
                status: 'ACTIVE',
              }
            });
            parentId = newParent.id;
          }
        }

        let admissionDate = new Date();
        if (csvData['Reg Date']) {
          const dateParts = csvData['Reg Date'].split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);
            const parsedDate = new Date(year, month, day);
            if (!isNaN(parsedDate.getTime())) admissionDate = parsedDate;
          }
        }

        let gender: any = 'MALE';
        const rawGender = (csvData['Gender'] || '').toUpperCase().trim();
        if (rawGender.startsWith('F')) gender = 'FEMALE';
        else if (rawGender.startsWith('M')) gender = 'MALE';
        else if (rawGender.startsWith('O')) gender = 'OTHER';

        let dob = new Date(2010, 0, 1);
        const rawDob = csvData['DOB'] || csvData['Date of Birth'];
        if (rawDob) {
          const parsedDob = new Date(rawDob);
          if (!isNaN(parsedDob.getTime())) dob = parsedDob;
        }

        const existing = await prisma.learner.findUnique({
          where: { admissionNumber: admNo }
        });

        if (existing) {
          if (forceCreate) {
            await prisma.learner.delete({ where: { id: existing.id } });
            const learner = await prisma.learner.create({
              data: {
                admissionNumber: admNo,
                firstName,
                lastName,
                dateOfBirth: dob,
                gender: gender,
                grade,
                stream: csvData['Stream'] || 'A',
                status: 'ACTIVE',
                admissionDate,
                guardianName: csvData['Parent/Guardian'] || undefined,
                guardianPhone: csvData['Phone 1'] || undefined,
                parentId: parentId,
              }
            });
            created.push({ line: item.line, id: learner.id, admNo, name: rawName });
          } else {
            await prisma.learner.update({
              where: { id: existing.id },
              data: {
                firstName,
                lastName,
                grade,
                stream: csvData['Stream'] || undefined,
                gender: gender,
                dateOfBirth: dob,
                parentId: parentId,
                guardianName: csvData['Parent/Guardian'] || undefined,
                guardianPhone: csvData['Phone 1'] || undefined,
              }
            });
            updated.push({ line: item.line, id: existing.id, admNo, name: rawName });
          }
        } else {
          const learner = await prisma.learner.create({
            data: {
              admissionNumber: admNo,
              firstName,
              lastName,
              dateOfBirth: dob,
              gender: gender,
              grade,
              stream: csvData['Stream'] || 'A',
              status: 'ACTIVE',
              admissionDate,
              guardianName: csvData['Parent/Guardian'] || undefined,
              guardianPhone: csvData['Phone 1'] || undefined,
              parentId: parentId,
            }
          });
          created.push({ line: item.line, id: learner.id, admNo, name: rawName });
        }
      } catch (error) {
        failed.push({
          line: item.line,
          admNo: item.data['Adm No'],
          name: item.data['Learner Name'] || item.data['Leaner Name'],
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.json({
      success: true,
      summary: {
        total: lineNumber - 1,
        processed: results.length,
        created: created.length,
        updated: updated.length,
        failed: failed.length + errors.length,
        validationErrors: errors.length
      },
      details: { created, updated, failed, validationErrors: errors }
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to process upload', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/bulk/learners/export
 */
router.get(
  '/export',
  authenticate,
  rateLimit({ windowMs: 60_000, maxRequests: 20 }),
  auditLog('BULK_EXPORT_LEARNERS'),
  async (req: AuthRequest, res: Response) => {
  try {
    const { grade, status } = req.query;

    const where: any = {};
    if (grade) where.grade = grade;
    if (status) where.status = status;

    const learners = await prisma.learner.findMany({
      where,
      orderBy: [{ grade: 'asc' }, { admissionNumber: 'asc' }]
    });

    const csvData = learners.map((learner, index) => ({
      'ID': index + 1,
      'Learner Name': `${learner.firstName} ${learner.lastName}`,
      'Adm No': learner.admissionNumber,
      'Class': learner.grade.replace('_', ' '),
      'Term': req.query.term || 'Term 1',
      'Year': req.query.year || new Date().getFullYear(),
      'Parent/Guardian': learner.guardianName || '',
      'Phone 1': learner.guardianPhone || '',
      'Phone 2': '',
      'Reg Date': learner.admissionDate ? new Date(learner.admissionDate).toLocaleDateString('en-GB') : '',
      'Bal Due': '0.00'
    }));

    const parser = new Parser({
      fields: ['ID', 'Learner Name', 'Adm No', 'Class', 'Term', 'Year', 'Parent/Guardian', 'Phone 1', 'Phone 2', 'Reg Date', 'Bal Due']
    });
    const csv = parser.parse(csvData);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="learners_export_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/bulk/learners/template
 */
router.get(
  '/template',
  rateLimit({ windowMs: 60_000, maxRequests: 100 }),
  (_req: Request, res: Response) => {
  const template = [{ 'ID': '1', 'Learner Name': 'John Doe', 'Adm No': '1001', 'Class': 'Grade 1', 'Term': 'Term 1', 'Year': '2026', 'Parent/Guardian': 'Jane Doe', 'Phone 1': '0712345678', 'Phone 2': '0798765432', 'Reg Date': '02/01/2026', 'Bal Due': '0.00' }];
  const parser = new Parser({ fields: ['ID', 'Learner Name', 'Adm No', 'Class', 'Term', 'Year', 'Parent/Guardian', 'Phone 1', 'Phone 2', 'Reg Date', 'Bal Due'] });
  const csv = parser.parse(template);
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', 'attachment; filename="learners_template.csv"');
  res.send(csv);
});

export default router;
