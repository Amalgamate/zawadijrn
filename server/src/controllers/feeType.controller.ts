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

        // Safe access to _count with type guard or assertion if needed, 
        // but Prisma should infer it. If not, we check existence.
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
    static async seedDefaults(req: Request, res: Response) {
        const defaultFeeTypes = [
            { code: 'TUITION', name: 'Tuition', category: 'ACADEMIC' as const, description: 'School tuition fees' },
            { code: 'ACTIVITY', name: 'Activity Fee', category: 'EXTRA_CURRICULAR' as const, description: 'Co-curricular activities' },
            { code: 'TRANSPORT', name: 'Transport', category: 'TRANSPORT' as const, description: 'School transport' },
            { code: 'MEALS', name: 'Meals', category: 'BOARDING' as const, description: 'School meals and catering' },
            { code: 'EXAM', name: 'Examination Fee', category: 'ACADEMIC' as const, description: 'Examination fees' },
            { code: 'LIBRARY', name: 'Library', category: 'ACADEMIC' as const, description: 'Library resources and materials' },
            { code: 'SPORTS', name: 'Sports Fee', category: 'EXTRA_CURRICULAR' as const, description: 'Sports programs and facilities' },
            { code: 'TECHNOLOGY', name: 'Technology Fee', category: 'ACADEMIC' as const, description: 'Computer lab and tech resources' },
            { code: 'MISC', name: 'Miscellaneous', category: 'OTHER' as const, description: 'Other school charges' }
        ];

        try {
            let createdCount = 0;
            let skippedCount = 0;
            const created = [];

            // Idempotent seeding - only create missing fee types
            for (const feeType of defaultFeeTypes) {
                try {
                    // Check if this fee type already exists
                    const existing = await prisma.feeType.findFirst({
                        where: { code: feeType.code }
                    });

                    if (existing) {
                        skippedCount++;
                        console.log(`Fee type ${feeType.code} already exists (skipped)`);
                        continue;
                    }

                    const newType = await prisma.feeType.create({
                        data: {
                            code: feeType.code,
                            name: feeType.name,
                            category: feeType.category,
                            description: feeType.description,
                            isActive: true
                        }
                    });
                    created.push(newType);
                    createdCount++;
                } catch (error: any) {
                    if (error.code === 'P2002') {
                        // Unique constraint violation - skip
                        skippedCount++;
                        console.log(`Fee type ${feeType.code} already exists (skipped)`);
                    } else {
                        throw error;
                    }
                }
            }

            const allMessage = skippedCount > 0 
                ? `Created ${createdCount} new fee types (${skippedCount} already existed)`
                : createdCount === 0 
                ? 'All 9 default fee types already exist'
                : `Successfully seeded ${createdCount} default fee types`;

            res.json({
                message: allMessage,
                created: createdCount,
                skipped: skippedCount,
                total: defaultFeeTypes.length,
                feeTypes: created
            });
        } catch (error: any) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new ApiError(500, `Error seeding fee types: ${error.message}`);
        }
    }

    // Seed default fee structures for all grades and terms
    static async seedStructures(req: Request, res: Response) {
        const GRADES = [
            'CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP',
            'PP1', 'PP2', 'GRADE_1', 'GRADE_2', 'GRADE_3',
            'GRADE_4', 'GRADE_5', 'GRADE_6', 'GRADE_7',
            'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12'
        ];

        const TERMS = ['TERM_1', 'TERM_2', 'TERM_3'];

        const GRADE_DISPLAY_NAMES: Record<string, string> = {
            'CRECHE': 'Creche', 'RECEPTION': 'Reception', 'TRANSITION': 'Transition',
            'PLAYGROUP': 'Playgroup', 'PP1': 'PP1', 'PP2': 'PP2', 'GRADE_1': 'Grade 1',
            'GRADE_2': 'Grade 2', 'GRADE_3': 'Grade 3', 'GRADE_4': 'Grade 4',
            'GRADE_5': 'Grade 5', 'GRADE_6': 'Grade 6', 'GRADE_7': 'Grade 7',
            'GRADE_8': 'Grade 8', 'GRADE_9': 'Grade 9', 'GRADE_10': 'Grade 10',
            'GRADE_11': 'Grade 11', 'GRADE_12': 'Grade 12'
        };

        // Default fee amounts per grade level
        const getFeeAmounts = (grade: string) => {
            if (['CRECHE', 'RECEPTION', 'TRANSITION', 'PLAYGROUP', 'PP1', 'PP2'].includes(grade)) {
                return {
                    TUITION: 15000, ACTIVITY: 500, TRANSPORT: 3000, MEALS: 8000,
                    EXAM: 300, LIBRARY: 500, SPORTS: 500, TECHNOLOGY: 1000, MISC: 500
                };
            }
            if (['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6'].includes(grade)) {
                return {
                    TUITION: 20000, ACTIVITY: 800, TRANSPORT: 4000, MEALS: 10000,
                    EXAM: 500, LIBRARY: 800, SPORTS: 1000, TECHNOLOGY: 1500, MISC: 800
                };
            }
            if (['GRADE_7', 'GRADE_8', 'GRADE_9'].includes(grade)) {
                return {
                    TUITION: 25000, ACTIVITY: 1000, TRANSPORT: 5000, MEALS: 12000,
                    EXAM: 800, LIBRARY: 1000, SPORTS: 1500, TECHNOLOGY: 2000, MISC: 1000
                };
            }
            return {
                TUITION: 30000, ACTIVITY: 1500, TRANSPORT: 6000, MEALS: 15000,
                EXAM: 1000, LIBRARY: 1500, SPORTS: 2000, TECHNOLOGY: 2500, MISC: 1500
            };
        };

        try {
            // Get all fee types for this school
            const feeTypes = await prisma.feeType.findMany({
                where: {}
            });

            if (feeTypes.length === 0) {
                throw new ApiError(400, 'No fee types found. Seed fee types first.');
            }

            const currentYear = new Date().getFullYear();
            let createdCount = 0;
            let skippedCount = 0;

            for (const grade of GRADES) {
                for (const term of TERMS) {
                    try {
                        // Check if already exists
                        const existing = await prisma.feeStructure.findFirst({
                            where: {
                                grade: grade as any,
                                term: term as any,
                                academicYear: currentYear
                            }
                        });

                        if (existing) {
                            skippedCount++;
                            continue;
                        }

                        // Create fee structure
                        const feeStructure = await prisma.feeStructure.create({
                            data: {
                                name: `${GRADE_DISPLAY_NAMES[grade]} ${term.replace('_', ' ')} Fees ${currentYear}`,
                                description: `Standard fees for ${GRADE_DISPLAY_NAMES[grade]} in ${term.replace('_', ' ')}`,
                                grade: grade as any,
                                term: term as any,
                                academicYear: currentYear,
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
