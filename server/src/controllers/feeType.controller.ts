import { Request, Response } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { FeeCategory } from '@prisma/client';

export class FeeTypeController {
    // Get all fee types for a school
    static async getAll(req: Request, res: Response) {
        const { category, active } = req.query;

        const where: any = {};

        if (category) {
            where.category = category as FeeCategory;
        }

        if (active !== undefined) {
            where.isActive = active === 'true';
        }

        const feeTypes = await prisma.feeType.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        res.json(feeTypes);
    }

    // Create a new fee type
    static async create(req: Request, res: Response) {
        const { code, name, description, category, isActive } = req.body;

        // Check if code already exists
        const existing = await prisma.feeType.findFirst({
            where: { code }
        });

        if (existing) {
            throw new ApiError(400, 'Fee type code already exists');
        }

        const feeType = await prisma.feeType.create({
            data: {
                code,
                name,
                description,
                category: category || FeeCategory.ACADEMIC,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json(feeType);
    }

    // Update a fee type
    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name, description, category, isActive } = req.body;

        const feeType = await prisma.feeType.findFirst({
            where: { id }
        });

        if (!feeType) {
            throw new ApiError(404, 'Fee type not found');
        }

        const updated = await prisma.feeType.update({
            where: { id },
            data: {
                name,
                description,
                category,
                isActive
            }
        });

        res.json(updated);
    }

    // Delete a fee type
    static async delete(req: Request, res: Response) {
        const { id } = req.params;

        const feeType = await prisma.feeType.findFirst({
            where: { id },
            include: {
                _count: {
                    select: { feeStructureItems: true }
                }
            }
        });

        if (!feeType) {
            throw new ApiError(404, 'Fee type not found');
        }

        const structureCount = feeType._count ? feeType._count.feeStructureItems : 0;

        if (structureCount > 0) {
            throw new ApiError(400, 'Cannot delete fee type because it is used in fee structures');
        }

        await prisma.feeType.delete({
            where: { id }
        });

        res.json({ message: 'Fee type deleted successfully' });
    }

    // Seed default fee types for a school (idempotent - only creates missing types)
    private static readonly DEFAULT_FEE_TYPES = [
        { code: 'TUITION',    name: 'Tuition',          category: 'ACADEMIC'        as const, description: 'School tuition fees' },
        { code: 'ACTIVITY',   name: 'Activity Fee',     category: 'EXTRA_CURRICULAR' as const, description: 'Co-curricular activities' },
        { code: 'TRANSPORT',  name: 'Transport',        category: 'TRANSPORT'       as const, description: 'School transport' },
        { code: 'MEALS',      name: 'Meals',            category: 'BOARDING'        as const, description: 'School meals and catering' },
        { code: 'EXAM',       name: 'Examination Fee',  category: 'ACADEMIC'        as const, description: 'Examination fees' },
        { code: 'LIBRARY',    name: 'Library',          category: 'ACADEMIC'        as const, description: 'Library resources and materials' },
        { code: 'SPORTS',     name: 'Sports Fee',       category: 'EXTRA_CURRICULAR' as const, description: 'Sports programs and facilities' },
        { code: 'TECHNOLOGY', name: 'Technology Fee',   category: 'ACADEMIC'        as const, description: 'Computer lab and tech resources' },
        { code: 'MISC',       name: 'Miscellaneous',    category: 'OTHER'           as const, description: 'Other school charges' }
    ];

    private static async ensureDefaultFeeTypes(): Promise<void> {
        for (const feeType of FeeTypeController.DEFAULT_FEE_TYPES) {
            await prisma.feeType.upsert({
                where: { code: feeType.code },
                update: {},
                create: {
                    code: feeType.code,
                    name: feeType.name,
                    category: feeType.category,
                    description: feeType.description,
                    isActive: true
                }
            });
        }
    }

    static async seedDefaults(req: Request, res: Response) {
        try {
            await FeeTypeController.ensureDefaultFeeTypes();
            res.json({
                message: 'Default fee types have been ensured',
                total: FeeTypeController.DEFAULT_FEE_TYPES.length,
            });
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, `Error seeding fee types: ${error.message}`);
        }
    }

    // Seed default fee structures for all grades and terms.
    // Accepts an optional `academicYear` body field (integer) so you can seed
    // for the upcoming year in advance without waiting for January 1st.
    static async seedStructures(req: Request, res: Response) {
        const GRADES = [
            'PLAYGROUP', 'PP1', 'PP2',
            'GRADE_1', 'GRADE_2', 'GRADE_3',
            'GRADE_4', 'GRADE_5', 'GRADE_6',
            'GRADE_7', 'GRADE_8', 'GRADE_9'
        ];

        const TERMS = ['TERM_1', 'TERM_2', 'TERM_3'];

        const GRADE_DISPLAY_NAMES: Record<string, string> = {
            'PLAYGROUP': 'Playgroup', 'PP1': 'PP1', 'PP2': 'PP2',
            'GRADE_1': 'Grade 1', 'GRADE_2': 'Grade 2', 'GRADE_3': 'Grade 3',
            'GRADE_4': 'Grade 4', 'GRADE_5': 'Grade 5', 'GRADE_6': 'Grade 6',
            'GRADE_7': 'Grade 7', 'GRADE_8': 'Grade 8', 'GRADE_9': 'Grade 9'
        };

        // Default fee amounts per grade level based on requested structure
        const getFeeAmounts = (grade: string) => {
            let tuition = 0;
            if (grade === 'PLAYGROUP') tuition = 7000;
            else if (grade === 'PP1') tuition = 8000;
            else if (grade === 'PP2') tuition = 8500;
            else if (['GRADE_1', 'GRADE_2'].includes(grade)) tuition = 10000;
            else if (grade === 'GRADE_3') tuition = 10500;
            else if (['GRADE_4', 'GRADE_5'].includes(grade)) tuition = 11000;
            else if (grade === 'GRADE_6') tuition = 12000;
            else if (grade === 'GRADE_7') tuition = 17500;
            else if (['GRADE_8', 'GRADE_9'].includes(grade)) tuition = 18500;

            return {
                TUITION: tuition, ACTIVITY: 0, TRANSPORT: 0, MEALS: 0,
                EXAM: 0, LIBRARY: 0, SPORTS: 0, TECHNOLOGY: 0, MISC: 0
            };
        };

        try {
            // Resolve academic year: use body param if provided, otherwise current year
            const bodyYear = req.body?.academicYear;
            const targetYear: number = (bodyYear && Number.isInteger(Number(bodyYear)) && Number(bodyYear) >= 2000)
                ? Number(bodyYear)
                : new Date().getFullYear();

            // Ensure the default fee types exist before seeding structures
            await FeeTypeController.ensureDefaultFeeTypes();
            const feeTypes = await prisma.feeType.findMany({ where: {} });

            if (feeTypes.length === 0) {
                throw new ApiError(400, 'No fee types found. Seed fee types first.');
            }

            let createdCount = 0;
            let skippedCount = 0;

            for (const grade of GRADES) {
                for (const term of TERMS) {
                    try {
                        // Check if already exists for the target year
                        const existing = await prisma.feeStructure.findFirst({
                            where: {
                                grade: grade as any,
                                term: term as any,
                                academicYear: targetYear
                            }
                        });

                        if (existing) {
                            skippedCount++;
                            continue;
                        }

                        // Create fee structure
                        const feeStructure = await prisma.feeStructure.create({
                            data: {
                                name: `${GRADE_DISPLAY_NAMES[grade]} ${term.replace('_', ' ')} Fees ${targetYear}`,
                                description: `Standard fees for ${GRADE_DISPLAY_NAMES[grade]} in ${term.replace('_', ' ')}`,
                                grade: grade as any,
                                term: term as any,
                                academicYear: targetYear,
                                mandatory: true,
                                active: true
                            }
                        });

                        // Get amounts for this grade
                        const amounts = getFeeAmounts(grade);

                        // Create fee items for this structure
                        for (const feeType of feeTypes) {
                            const amount = amounts[feeType.code as keyof typeof amounts] || 0;

                            if (amount > 0) {
                                await prisma.feeStructureItem.create({
                                    data: {
                                        feeStructureId: feeStructure.id,
                                        feeTypeId: feeType.id,
                                        amount: amount.toString(),
                                        mandatory: true
                                    }
                                });
                            }
                        }

                        createdCount++;
                    } catch (error: any) {
                        if (error.code === 'P2002') {
                            skippedCount++;
                        } else {
                            console.error(`Error creating structure for ${grade} ${term}:`, error.message);
                        }
                    }
                }
            }

            const totalExpected = GRADES.length * TERMS.length;
            const message = skippedCount > 0
                ? `Created ${createdCount} fee structures (${skippedCount}/${totalExpected} already existed)`
                : createdCount === 0
                ? `All ${totalExpected} fee structures already exist`
                : `Successfully seeded ${createdCount} fee structures (${GRADES.length} grades × ${TERMS.length} terms)`;

            res.json({
                message,
                academicYear: targetYear,
                created: createdCount,
                skipped: skippedCount,
                total: totalExpected,
                grades: GRADES.length,
                terms: TERMS.length
            });
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, `Error seeding fee structures: ${error.message}`);
        }
    }
}
