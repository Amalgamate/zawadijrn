/**
 * Library Reports Service — Phase 5
 * Generates structured inventory and analytics reports for the library module.
 *
 * All methods return plain data objects — the controller layer decides whether
 * to respond with JSON (for the UI) or hand off to pdf.service.ts / xlsx for download.
 *
 * Reports available:
 *  1. getInventoryReport()         — full book catalog with copy-level breakdown
 *  2. getCategoryReport()          — holdings and circulation by category
 *  3. getCopyConditionAudit()      — copies grouped by condition + location
 *  4. getCirculationReport()       — loan activity over a date range
 *  5. getMemberActivityReport()    — per-member borrowing history + fine summary
 *  6. getOverdueFinesReport()      — all outstanding overdue fines with ageing
 *  7. getDashboardSummary()        — single-call summary for the library dashboard
 *
 * @module services/libraryReports.service
 */

import {
    BookStatus,
    CopyStatus,
    LoanStatus,
    FineStatus,
    MemberStatus
} from '@prisma/client';
import prisma from '../config/database';

// ─── Report result types ──────────────────────────────────────────────────────

export interface InventoryReportRow {
    id: string;
    title: string;
    author: string | null;
    isbn: string | null;
    category: string | null;
    publisher: string | null;
    publicationYear: number | null;
    status: BookStatus;
    totalCopies: number;
    availableCopies: number;
    borrowedCopies: number;
    reservedCopies: number;
    damagedCopies: number;
    lostCopies: number;
    allTimeLoanCount: number;
}

export interface CategoryReportRow {
    category: string;
    totalBooks: number;
    totalCopies: number;
    availableCopies: number;
    activeLoans: number;
    allTimeLoanCount: number;
    unpaidFinesTotal: number;
}

export interface CopyConditionAuditRow {
    condition: string;
    location: string | null;
    count: number;
    bookIds: string[];
}

export interface CirculationReportRow {
    date: string;             // YYYY-MM-DD
    newLoans: number;
    returns: number;
    renewals: number;
    overdueMarked: number;
}

export interface MemberActivityRow {
    memberId: string;
    memberNumber: string;
    fullName: string;
    email: string | null;
    memberType: string;
    status: MemberStatus;
    activeLoans: number;
    overdueLoans: number;
    totalLoansAllTime: number;
    unpaidFines: number;
    totalFinesAllTime: number;
    joinedAt: Date;
    expiryDate: Date | null;
}

export interface OverdueFineRow {
    fineId: string;
    loanId: string | null;
    memberNumber: string;
    memberName: string;
    phone: string | null;
    bookTitle: string | null;
    dueDate: Date | null;
    daysOverdue: number | null;
    fineAmount: number;
    reason: string;
    issuedAt: Date;
    agingBucket: '0–7 days' | '8–30 days' | '31–60 days' | '60+ days';
}

export interface DashboardSummary {
    books: {
        total: number;
        available: number;
        outOfStock: number;
        limited: number;
        totalCopies: number;
        availableCopies: number;
    };
    loans: {
        active: number;
        overdue: number;
        returnedToday: number;
        issuedToday: number;
    };
    members: {
        total: number;
        active: number;
        suspended: number;
        expired: number;
    };
    fines: {
        totalUnpaidCount: number;
        totalUnpaidAmount: number;
        totalPaidThisMonth: number;
    };
    topBorrowedThisMonth: { title: string; author: string | null; loanCount: number }[];
    recentLoans: {
        id: string;
        memberName: string;
        bookTitle: string;
        loanedAt: Date;
        dueDate: Date;
        status: LoanStatus;
    }[];
}

// ─────────────────────────────────────────────────────────────────────────────

export class LibraryReportsService {

    // =========================================================================
    // 1. Inventory Report
    // =========================================================================

    /**
     * Returns a row per book with aggregate copy counts and all-time loan totals.
     * Supports optional filtering by category, status, and search term.
     */
    async getInventoryReport(filters: {
        category?: string;
        status?: BookStatus;
        search?: string;
    } = {}): Promise<InventoryReportRow[]> {

        const where: any = {};

        if (filters.category) where.category = filters.category;
        if (filters.status)   where.status   = filters.status;
        if (filters.search) {
            where.OR = [
                { title:  { contains: filters.search, mode: 'insensitive' } },
                { author: { contains: filters.search, mode: 'insensitive' } },
                { isbn:   { contains: filters.search, mode: 'insensitive' } }
            ];
        }

        const books = await prisma.book.findMany({
            where,
            include: {
                copies: {
                    select: { status: true, condition: true }
                },
                loans: {
                    select: { id: true }
                }
            },
            orderBy: [
                { category: 'asc' },
                { title:    'asc' }
            ]
        });

        return books.map(book => {
            const copies        = book.copies;
            const available     = copies.filter(c => c.status === CopyStatus.AVAILABLE).length;
            const borrowed      = copies.filter(c => c.status === CopyStatus.BORROWED).length;
            const reserved      = copies.filter(c => c.status === CopyStatus.RESERVED).length;
            const damaged       = copies.filter(c => c.status === CopyStatus.DAMAGED).length;
            const lost          = copies.filter(c => c.status === CopyStatus.LOST).length;

            return {
                id:               book.id,
                title:            book.title,
                author:           book.author,
                isbn:             book.isbn,
                category:         book.category,
                publisher:        book.publisher,
                publicationYear:  book.publicationYear,
                status:           book.status,
                totalCopies:      book.totalCopies,
                availableCopies:  available,
                borrowedCopies:   borrowed,
                reservedCopies:   reserved,
                damagedCopies:    damaged,
                lostCopies:       lost,
                allTimeLoanCount: book.loans.length
            };
        });
    }


    // =========================================================================
    // 2. Category Report
    // =========================================================================

    async getCategoryReport(): Promise<CategoryReportRow[]> {

        // Aggregate books per category
        const booksByCategory = await prisma.book.groupBy({
            by:      ['category'],
            _count:  { id: true },
            _sum:    { totalCopies: true, availableCopies: true },
            orderBy: { category: 'asc' }
        });

        const rows: CategoryReportRow[] = [];

        for (const group of booksByCategory) {
            const category = group.category || 'Uncategorised';

            // Active loans in this category
            const activeLoans = await prisma.bookLoan.count({
                where: {
                    status: LoanStatus.ACTIVE,
                    book:   { category: group.category }
                }
            });

            // All-time loans in this category
            const allTimeLoanCount = await prisma.bookLoan.count({
                where: { book: { category: group.category } }
            });

            // Unpaid fines tied to books in this category
            const finesAgg = await prisma.fine.aggregate({
                where:  {
                    status: FineStatus.UNPAID,
                    loan:   { book: { category: group.category } }
                },
                _sum: { amount: true }
            });

            rows.push({
                category,
                totalBooks:       group._count.id,
                totalCopies:      group._sum.totalCopies   || 0,
                availableCopies:  group._sum.availableCopies || 0,
                activeLoans,
                allTimeLoanCount,
                unpaidFinesTotal: Number(finesAgg._sum.amount || 0)
            });
        }

        return rows;
    }


    // =========================================================================
    // 3. Copy Condition Audit
    // =========================================================================

    /**
     * Breakdowns copies by condition (GOOD / FAIR / POOR / DAMAGED / LOST)
     * and location — useful for librarians conducting physical stocktakes.
     */
    async getCopyConditionAudit(): Promise<CopyConditionAuditRow[]> {

        const copies = await prisma.bookCopy.findMany({
            select: { condition: true, location: true, bookId: true }
        });

        const grouped = new Map<string, { count: number; bookIds: Set<string> }>();

        for (const copy of copies) {
            const key = `${copy.condition}||${copy.location ?? ''}`;
            if (!grouped.has(key)) grouped.set(key, { count: 0, bookIds: new Set() });
            const entry = grouped.get(key)!;
            entry.count++;
            entry.bookIds.add(copy.bookId);
        }

        return Array.from(grouped.entries()).map(([key, value]) => {
            const [condition, location] = key.split('||');
            return {
                condition,
                location: location || null,
                count:    value.count,
                bookIds:  Array.from(value.bookIds)
            };
        }).sort((a, b) => a.condition.localeCompare(b.condition));
    }


    // =========================================================================
    // 4. Circulation Report  (daily activity over a date range)
    // =========================================================================

    /**
     * Returns one row per calendar day in the range, counting:
     *  - newLoans    : loans issued that day
     *  - returns     : loans returned that day
     *  - renewals    : loans renewed that day (renewedCount increment proxy)
     *  - overdueMarked : loans that crossed their dueDate on that calendar day
     *
     * Default range: last 30 days.
     */
    async getCirculationReport(
        from: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to:   Date = new Date()
    ): Promise<CirculationReportRow[]> {

        const loans = await prisma.bookLoan.findMany({
            where: {
                OR: [
                    { loanedAt:    { gte: from, lte: to } },
                    { returnedAt:  { gte: from, lte: to } },
                    { dueDate:     { gte: from, lte: to } }
                ]
            },
            select: {
                loanedAt:    true,
                returnedAt:  true,
                dueDate:     true,
                renewedCount: true,
                status:      true
            }
        });

        // Build a day-keyed map
        const dayMap = new Map<string, CirculationReportRow>();

        const toKey = (d: Date) => d.toISOString().split('T')[0];

        // Populate all days in range with zeros
        const cursor = new Date(from);
        while (cursor <= to) {
            const key = toKey(cursor);
            dayMap.set(key, { date: key, newLoans: 0, returns: 0, renewals: 0, overdueMarked: 0 });
            cursor.setDate(cursor.getDate() + 1);
        }

        for (const loan of loans) {
            const issuedKey    = toKey(loan.loanedAt);
            const returnedKey  = loan.returnedAt ? toKey(loan.returnedAt) : null;
            const dueDateKey   = toKey(loan.dueDate);

            if (dayMap.has(issuedKey)) {
                dayMap.get(issuedKey)!.newLoans++;
                if (loan.renewedCount > 0) dayMap.get(issuedKey)!.renewals += loan.renewedCount;
            }

            if (returnedKey && dayMap.has(returnedKey)) {
                dayMap.get(returnedKey)!.returns++;
            }

            // Count loans whose dueDate falls in range and are/were OVERDUE
            if (
                dayMap.has(dueDateKey) &&
                (loan.status === LoanStatus.OVERDUE || loan.status === LoanStatus.RETURNED) &&
                loan.returnedAt && loan.returnedAt > loan.dueDate
            ) {
                dayMap.get(dueDateKey)!.overdueMarked++;
            }
        }

        return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }


    // =========================================================================
    // 5. Member Activity Report
    // =========================================================================

    async getMemberActivityReport(filters: {
        status?: MemberStatus;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ rows: MemberActivityRow[]; total: number }> {

        const { page = 1, limit = 50, status, search } = filters;

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { memberNumber: { contains: search, mode: 'insensitive' } },
                { user: { firstName: { contains: search, mode: 'insensitive' } } },
                { user: { lastName:  { contains: search, mode: 'insensitive' } } },
                { user: { email:     { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [members, total] = await Promise.all([
            prisma.libraryMember.findMany({
                where,
                include: {
                    user:  { select: { firstName: true, lastName: true, email: true } },
                    loans: { select: { id: true, status: true } },
                    fines: { select: { amount: true, status: true } }
                },
                orderBy: { joinedAt: 'desc' },
                skip:    (page - 1) * limit,
                take:    limit
            }),
            prisma.libraryMember.count({ where })
        ]);

        const rows: MemberActivityRow[] = members.map(m => {
            const activeLoans  = m.loans.filter(l => l.status === LoanStatus.ACTIVE).length;
            const overdueLoans = m.loans.filter(l => l.status === LoanStatus.OVERDUE).length;
            const unpaidFines  = m.fines
                .filter(f => f.status === FineStatus.UNPAID)
                .reduce((s, f) => s + Number(f.amount), 0);
            const totalFines   = m.fines.reduce((s, f) => s + Number(f.amount), 0);

            return {
                memberId:         m.id,
                memberNumber:     m.memberNumber,
                fullName:         `${m.user.firstName} ${m.user.lastName}`,
                email:            m.user.email,
                memberType:       m.membershipType,
                status:           m.status,
                activeLoans,
                overdueLoans,
                totalLoansAllTime: m.loans.length,
                unpaidFines,
                totalFinesAllTime: totalFines,
                joinedAt:         m.joinedAt,
                expiryDate:       m.expiryDate
            };
        });

        return { rows, total };
    }


    // =========================================================================
    // 6. Overdue Fines Report  (with ageing buckets)
    // =========================================================================

    async getOverdueFinesReport(): Promise<OverdueFineRow[]> {

        const fines = await prisma.fine.findMany({
            where:   { status: FineStatus.UNPAID },
            include: {
                member: {
                    include: {
                        user: { select: { firstName: true, lastName: true, phone: true } }
                    }
                },
                loan: {
                    include: {
                        book: { select: { title: true } }
                    }
                }
            },
            orderBy: { amount: 'desc' }
        });

        const now = Date.now();

        return fines.map(fine => {
            const daysSinceIssued = Math.floor((now - fine.issuedAt.getTime()) / (1000 * 60 * 60 * 24));
            const daysOverdue = fine.loan?.dueDate
                ? Math.max(0, Math.floor((now - fine.loan.dueDate.getTime()) / (1000 * 60 * 60 * 24)))
                : null;

            let agingBucket: OverdueFineRow['agingBucket'] = '0–7 days';
            if (daysSinceIssued > 60)     agingBucket = '60+ days';
            else if (daysSinceIssued > 30) agingBucket = '31–60 days';
            else if (daysSinceIssued > 7)  agingBucket = '8–30 days';

            return {
                fineId:      fine.id,
                loanId:      fine.loanId,
                memberNumber: fine.member.memberNumber,
                memberName:  `${fine.member.user.firstName} ${fine.member.user.lastName}`,
                phone:       fine.member.user.phone,
                bookTitle:   fine.loan?.book?.title ?? null,
                dueDate:     fine.loan?.dueDate ?? null,
                daysOverdue,
                fineAmount:  Number(fine.amount),
                reason:      fine.reason,
                issuedAt:    fine.issuedAt,
                agingBucket
            };
        });
    }


    // =========================================================================
    // 7. Dashboard Summary  (single call for the library overview page)
    // =========================================================================

    async getDashboardSummary(): Promise<DashboardSummary> {

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const [
            totalBooks,
            availableBooks,
            outOfStockBooks,
            limitedBooks,
            totalCopies,
            availableCopies,
            activeLoans,
            overdueLoans,
            returnedToday,
            issuedToday,
            totalMembers,
            activeMembers,
            suspendedMembers,
            expiredMembers,
            unpaidFinesAgg,
            paidThisMonthAgg,
            unpaidFinesCount,
            topBorrowed,
            recentLoansRaw
        ] = await Promise.all([
            prisma.book.count(),
            prisma.book.count({ where: { status: BookStatus.AVAILABLE   } }),
            prisma.book.count({ where: { status: BookStatus.OUT_OF_STOCK } }),
            prisma.book.count({ where: { status: BookStatus.LIMITED      } }),
            prisma.bookCopy.count(),
            prisma.bookCopy.count({ where: { status: CopyStatus.AVAILABLE } }),
            prisma.bookLoan.count({ where: { status: LoanStatus.ACTIVE   } }),
            prisma.bookLoan.count({ where: { status: LoanStatus.OVERDUE  } }),
            prisma.bookLoan.count({
                where: { returnedAt: { gte: todayStart }, status: LoanStatus.RETURNED }
            }),
            prisma.bookLoan.count({ where: { loanedAt: { gte: todayStart } } }),
            prisma.libraryMember.count(),
            prisma.libraryMember.count({ where: { status: MemberStatus.ACTIVE    } }),
            prisma.libraryMember.count({ where: { status: MemberStatus.SUSPENDED } }),
            prisma.libraryMember.count({ where: { status: MemberStatus.EXPIRED   } }),
            prisma.fine.aggregate({
                where: { status: FineStatus.UNPAID },
                _sum:  { amount: true }
            }),
            prisma.fine.aggregate({
                where: { status: FineStatus.PAID, paidAt: { gte: monthStart } },
                _sum:  { amount: true }
            }),
            prisma.fine.count({ where: { status: FineStatus.UNPAID } }),
            prisma.bookLoan.groupBy({
                by:      ['bookId'],
                where:   { loanedAt: { gte: monthStart } },
                _count:  { bookId: true },
                orderBy: { _count: { bookId: 'desc' } },
                take:    5
            }),
            prisma.bookLoan.findMany({
                where:   {},
                include: {
                    book:   { select: { title: true } },
                    member: {
                        include: { user: { select: { firstName: true, lastName: true } } }
                    }
                },
                orderBy: { loanedAt: 'desc' },
                take:    10
            })
        ]);

        // Resolve top borrowed book details
        const topBookIds = topBorrowed.map(t => t.bookId);
        const topBooks   = await prisma.book.findMany({
            where:  { id: { in: topBookIds } },
            select: { id: true, title: true, author: true }
        });

        const topBorrowedThisMonth = topBorrowed.map(t => {
            const book = topBooks.find(b => b.id === t.bookId);
            return {
                title:     book?.title  ?? 'Unknown',
                author:    book?.author ?? null,
                loanCount: t._count.bookId
            };
        });

        const recentLoans = recentLoansRaw.map(l => ({
            id:         l.id,
            memberName: `${l.member.user.firstName} ${l.member.user.lastName}`,
            bookTitle:  l.book.title,
            loanedAt:   l.loanedAt,
            dueDate:    l.dueDate,
            status:     l.status
        }));

        return {
            books: {
                total:           totalBooks,
                available:       availableBooks,
                outOfStock:      outOfStockBooks,
                limited:         limitedBooks,
                totalCopies,
                availableCopies
            },
            loans: {
                active:        activeLoans,
                overdue:       overdueLoans,
                returnedToday,
                issuedToday
            },
            members: {
                total:     totalMembers,
                active:    activeMembers,
                suspended: suspendedMembers,
                expired:   expiredMembers
            },
            fines: {
                totalUnpaidCount:  unpaidFinesCount,
                totalUnpaidAmount: Number(unpaidFinesAgg._sum.amount || 0),
                totalPaidThisMonth: Number(paidThisMonthAgg._sum.amount || 0)
            },
            topBorrowedThisMonth,
            recentLoans
        };
    }
}

export const libraryReportsService = new LibraryReportsService();
