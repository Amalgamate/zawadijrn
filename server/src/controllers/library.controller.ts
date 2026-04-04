/**
 * Library Controller
 * Handles all library management endpoints
 *
 * @module controllers/library.controller
 */

import { Response } from 'express';
import { LibraryService } from '../services/library.service';
import { ApiError } from '../utils/error.util';
import { AuthRequest } from '../middleware/permissions.middleware';

const libraryService = new LibraryService();

export class LibraryController {
    /**
     * Book Management Endpoints
     */

    async getBooks(req: AuthRequest, res: Response) {
        const {
            search,
            category,
            status,
            availableOnly,
            page = '1',
            limit = '20'
        } = req.query;

        const filters = {
            search: search as string,
            category: category as string,
            status: status as any,
            availableOnly: availableOnly === 'true',
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        };

        const result = await libraryService.getBooks(filters);

        res.json({
            success: true,
            data: result.books,
            pagination: result.pagination
        });
    }

    async getBook(req: AuthRequest, res: Response) {
        const { id } = req.params;

        const book = await libraryService.getBook(id);
        if (!book) {
            throw new ApiError(404, 'Book not found');
        }

        res.json({
            success: true,
            data: book
        });
    }

    async createBook(req: AuthRequest, res: Response) {
        const book = await libraryService.createBook(req.body);

        res.status(201).json({
            success: true,
            data: book,
            message: 'Book created successfully'
        });
    }

    async updateBook(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const book = await libraryService.updateBook(id, req.body);

        res.json({
            success: true,
            data: book,
            message: 'Book updated successfully'
        });
    }

    async deleteBook(req: AuthRequest, res: Response) {
        const { id } = req.params;
        await libraryService.deleteBook(id);

        res.json({
            success: true,
            message: 'Book deleted successfully'
        });
    }

    /**
     * Book Copy Management Endpoints
     */

    async getBookCopies(req: AuthRequest, res: Response) {
        const { bookId } = req.params;
        const { status } = req.query;

        const copies = await libraryService.getBookCopies(bookId, status as string);

        res.json({
            success: true,
            data: copies
        });
    }

    async createBookCopy(req: AuthRequest, res: Response) {
        const { bookId } = req.params;
        const copy = await libraryService.createBookCopy(bookId, req.body);

        res.status(201).json({
            success: true,
            data: copy,
            message: 'Book copy created successfully'
        });
    }

    async updateBookCopy(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const copy = await libraryService.updateBookCopy(id, req.body);

        res.json({
            success: true,
            data: copy,
            message: 'Book copy updated successfully'
        });
    }

    async deleteBookCopy(req: AuthRequest, res: Response) {
        const { id } = req.params;
        await libraryService.deleteBookCopy(id);

        res.json({
            success: true,
            message: 'Book copy deleted successfully'
        });
    }

    /**
     * Library Member Management Endpoints
     */

    async getLibraryMembers(req: AuthRequest, res: Response) {
        const { page = '1', limit = '20', search } = req.query;

        const result = await libraryService.getLibraryMembers({
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            search: search as string
        });

        res.json({
            success: true,
            data: result.members,
            pagination: result.pagination
        });
    }

    async getLibraryMember(req: AuthRequest, res: Response) {
        const { userId } = req.params;
        const member = await libraryService.getLibraryMember(userId);

        if (!member) {
            throw new ApiError(404, 'Library member not found');
        }

        res.json({
            success: true,
            data: member
        });
    }

    async createLibraryMember(req: AuthRequest, res: Response) {
        const { userId } = req.params;
        const member = await libraryService.createLibraryMember(userId, req.body);

        res.status(201).json({
            success: true,
            data: member,
            message: 'Library member created successfully'
        });
    }

    async updateLibraryMember(req: AuthRequest, res: Response) {
        const { userId } = req.params;
        const member = await libraryService.updateLibraryMember(userId, req.body);

        res.json({
            success: true,
            data: member,
            message: 'Library member updated successfully'
        });
    }

    /**
     * Book Loan Management Endpoints
     */

    async getLoans(req: AuthRequest, res: Response) {
        const {
            status,
            overdue,
            memberId,
            page = '1',
            limit = '20'
        } = req.query;

        const filters = {
            status: status as string,
            overdue: overdue === 'true',
            memberId: memberId as string,
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        };

        const result = await libraryService.getLoans(filters);

        res.json({
            success: true,
            data: result.loans,
            pagination: result.pagination
        });
    }

    async borrowBook(req: AuthRequest, res: Response) {
        const { userId } = req.user!;
        const { bookCopyId, dueDate } = req.body;

        const loan = await libraryService.borrowBook(
            userId,
            bookCopyId,
            dueDate ? new Date(dueDate) : undefined
        );

        res.status(201).json({
            success: true,
            data: loan,
            message: 'Book borrowed successfully'
        });
    }

    async borrowForMember(req: AuthRequest, res: Response) {
        const { memberIdentifier, bookCopyId, dueDate } = req.body;

        const loan = await libraryService.borrowForMember(
            memberIdentifier,
            bookCopyId,
            dueDate ? new Date(dueDate) : undefined
        );

        res.status(201).json({
            success: true,
            data: loan,
            message: 'Book borrowed successfully'
        });
    }

    async borrowByScan(req: AuthRequest, res: Response) {
        const { barcode, memberIdentifier, dueDate } = req.body;

        const loan = await libraryService.borrowBookByScan(
            barcode,
            memberIdentifier,
            dueDate ? new Date(dueDate) : undefined
        );

        res.status(201).json({
            success: true,
            data: loan,
            message: 'Book borrowed successfully'
        });
    }

    async reserveBookCopy(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const copy = await libraryService.reserveBookCopy(id);

        res.json({
            success: true,
            data: copy,
            message: 'Book copy reserved successfully'
        });
    }

    async getMemberLoanHistory(req: AuthRequest, res: Response) {
        const { userId } = req.params;
        const { page = '1', limit = '20' } = req.query;

        const result = await libraryService.getMemberLoanHistory(
            userId,
            parseInt(page as string),
            parseInt(limit as string)
        );

        res.json({
            success: true,
            data: result.loans,
            pagination: result.pagination
        });
    }

    async returnBook(req: AuthRequest, res: Response) {
        const { loanId } = req.params;
        const { condition, notes } = req.body;

        const result = await libraryService.returnBook(loanId, condition, notes);

        res.json({
            success: true,
            data: result,
            message: 'Book returned successfully'
        });
    }

    async renewLoan(req: AuthRequest, res: Response) {
        const { loanId } = req.params;
        const { newDueDate } = req.body;

        const loan = await libraryService.renewLoan(
            loanId,
            newDueDate ? new Date(newDueDate) : undefined
        );

        res.json({
            success: true,
            data: loan,
            message: 'Loan renewed successfully'
        });
    }

    /**
     * Fine Management Endpoints
     */

    async getFines(req: AuthRequest, res: Response) {
        const { status, memberId, page = '1', limit = '20' } = req.query;

        const result = await libraryService.getFines({
            status: status as string,
            memberId: memberId as string,
            page: parseInt(page as string),
            limit: parseInt(limit as string)
        });

        res.json({
            success: true,
            data: result.fines,
            pagination: result.pagination
        });
    }

    async createManualFine(req: AuthRequest, res: Response) {
        const { memberId, loanId, reason, amount, notes } = req.body;

        const fine = await libraryService.createManualFine({
            memberId,
            loanId,
            reason,
            amount: Number(amount),
            notes
        });

        res.status(201).json({
            success: true,
            data: fine,
            message: 'Fine created successfully'
        });
    }

    async sendOverdueReminders(req: AuthRequest, res: Response) {
        const sentCount = await libraryService.sendOverdueReminders();

        res.json({
            success: true,
            data: { sentCount },
            message: `Overdue reminders sent to ${sentCount} member(s)`
        });
    }

    async payFine(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const fine = await libraryService.payFine(id);

        res.json({
            success: true,
            data: fine,
            message: 'Fine paid successfully'
        });
    }

    async waiveFine(req: AuthRequest, res: Response) {
        const { id } = req.params;
        const { notes } = req.body;
        const waivedById = req.user!.userId;

        const fine = await libraryService.waiveFine(id, waivedById, notes);

        res.json({
            success: true,
            data: fine,
            message: 'Fine waived successfully'
        });
    }

    /**
     * Reports and Analytics Endpoints
     */

    async getOverdueLoans(req: AuthRequest, res: Response) {
        const overdueLoans = await libraryService.getOverdueLoans();

        res.json({
            success: true,
            data: overdueLoans
        });
    }

    async getLibraryStats(req: AuthRequest, res: Response) {
        const stats = await libraryService.getLibraryStats();

        res.json({
            success: true,
            data: stats
        });
    }

    async getPopularBooks(req: AuthRequest, res: Response) {
        const { limit = '10' } = req.query;
        const popularBooks = await libraryService.getPopularBooks(parseInt(limit as string));

        res.json({
            success: true,
            data: popularBooks
        });
    }
}