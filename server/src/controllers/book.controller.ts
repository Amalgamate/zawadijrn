/**
 * Book Controller
 * Handles management of school books and teacher assignments
 * 
 * @module controllers/book.controller
 */

import { Response } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';

export class BookController {
    /**
     * Get all books for a school
     */
    async getAllBooks(req: AuthRequest, res: Response) {
        const schoolId = req.user!.schoolId;
        const { assignedToId, status } = req.query;

        const whereClause: any = { schoolId };

        if (assignedToId) {
            whereClause.assignedToId = assignedToId as string;
        }

        if (status) {
            whereClause.status = status as string;
        }

        const books = await prisma.book.findMany({
            where: whereClause,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { title: 'asc' }
        });

        res.json({
            success: true,
            data: books
        });
    }

    /**
     * Create a new book
     */
    async createBook(req: AuthRequest, res: Response) {
        const schoolId = req.user!.schoolId;
        const { title, author, isbn, category } = req.body;

        if (!title) {
            throw new ApiError(400, 'Book title is required');
        }

        const book = await prisma.book.create({
            data: {
                title,
                author,
                isbn,
                category,
                schoolId: schoolId!
            }
        });

        res.status(201).json({
            success: true,
            data: book
        });
    }

    /**
     * Update a book
     */
    async updateBook(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const schoolId = req.user!.schoolId;
        const updateData = req.body;

        const book = await prisma.book.findUnique({ where: { id } });

        if (!book || book.schoolId !== schoolId) {
            throw new ApiError(404, 'Book not found');
        }

        const updatedBook = await prisma.book.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            data: updatedBook
        });
    }

    /**
     * Assign a book to a user
     */
    async assignBook(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { userId } = req.body;
        const schoolId = req.user!.schoolId;

        const book = await prisma.book.findUnique({ where: { id } });

        if (!book || book.schoolId !== schoolId) {
            throw new ApiError(404, 'Book not found');
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser || targetUser.schoolId !== schoolId) {
            throw new ApiError(404, 'User not found in this school');
        }

        const updatedBook = await prisma.book.update({
            where: { id },
            data: {
                assignedToId: userId,
                assignedAt: new Date(),
                status: 'ISSUED'
            }
        });

        res.json({
            success: true,
            message: `Book assigned to ${targetUser.firstName} ${targetUser.lastName}`,
            data: updatedBook
        });
    }

    /**
     * Return a book (unassign)
     */
    async returnBook(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const schoolId = req.user!.schoolId;

        const book = await prisma.book.findUnique({ where: { id } });

        if (!book || book.schoolId !== schoolId) {
            throw new ApiError(404, 'Book not found');
        }

        const updatedBook = await prisma.book.update({
            where: { id },
            data: {
                assignedToId: null,
                assignedAt: null,
                status: 'AVAILABLE',
                returnDate: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Book returned successfully',
            data: updatedBook
        });
    }

    /**
     * Delete a book
     */
    async deleteBook(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const schoolId = req.user!.schoolId;

        const book = await prisma.book.findUnique({ where: { id } });

        if (!book || book.schoolId !== schoolId) {
            throw new ApiError(404, 'Book not found');
        }

        await prisma.book.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Book deleted successfully'
        });
    }
}
