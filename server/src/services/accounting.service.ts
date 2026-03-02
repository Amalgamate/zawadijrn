import prisma from '../config/database';
import { JournalType, AccountType } from '@prisma/client';

export class AccountingService {
    /**
     * Initialize default Chart of Accounts and Journals
     */
    async initializeDefaultCoA() {
        // 1. Check if already initialized
        const existing = await prisma.account.findFirst();
        if (existing) return;

        // 2. Define standard accounts
        const defaultAccounts = [
            { code: '1000', name: 'Fixed Assets', type: AccountType.ASSET_NON_CURRENT },
            { code: '1100', name: 'Accounts Receivable (Fees)', type: AccountType.ASSET_RECEIVABLE },
            { code: '1200', name: 'Cash in Hand', type: AccountType.ASSET_CASH },
            { code: '1210', name: 'Main Bank Account', type: AccountType.ASSET_CASH },
            { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY_PAYABLE },
            { code: '2100', name: 'Tuition Deposits', type: AccountType.LIABILITY_CURRENT },
            { code: '2110', name: 'Salaries Payable', type: AccountType.LIABILITY_CURRENT },
            { code: '3000', name: 'Retained Earnings', type: AccountType.EQUITY },
            { code: '4000', name: 'Tuition Fees Income', type: AccountType.REVENUE },
            { code: '4100', name: 'Transport Fees Income', type: AccountType.REVENUE },
            { code: '4200', name: 'Extracurricular Income', type: AccountType.REVENUE },
            { code: '5000', name: 'Salaries Expense', type: AccountType.EXPENSE },
            { code: '5100', name: 'Electricity Expense', type: AccountType.EXPENSE },
            { code: '5200', name: 'Water Expense', type: AccountType.EXPENSE },
            { code: '5300', name: 'Rent Expense', type: AccountType.EXPENSE }
        ];

        // 3. Define standard journals
        const defaultJournals = [
            { code: 'INV', name: 'Customer Invoices (Sales)', type: 'SALES' as JournalType },
            { code: 'BILL', name: 'Vendor Bills (Purchases)', type: 'PURCHASE' as JournalType },
            { code: 'CSH1', name: 'Cash', type: 'CASH' as JournalType },
            { code: 'BNK1', name: 'Bank', type: 'BANK' as JournalType },
            { code: 'MISC', name: 'Miscellaneous Operations', type: 'GENERAL' as JournalType }
        ];

        return await prisma.$transaction([
            prisma.account.createMany({
                data: defaultAccounts
            }),
            prisma.journal.createMany({
                data: defaultJournals
            })
        ]);
    }

    async getAccounts() {
        return prisma.account.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' }
        });
    }

    async getJournals() {
        return prisma.journal.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' }
        });
    }

    /**
     * Create a balanced journal entry
     */
    async createJournalEntry(data: {
        date?: Date;
        reference?: string;
        journalId: string;
        items: {
            accountId: string;
            debit?: number;
            credit?: number;
            label?: string;
        }[];
    }) {
        // 1. Validate Balance
        const totalDebit = data.items.reduce((sum, item) => sum + (item.debit || 0), 0);
        const totalCredit = data.items.reduce((sum, item) => sum + (item.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Unbalanced Journal Entry: Debits (${totalDebit}) do not equal Credits (${totalCredit})`);
        }

        // 2. Create entry and items in transaction
        return prisma.journalEntry.create({
            data: {
                date: data.date || new Date(),
                reference: data.reference,
                journalId: data.journalId,
                status: 'DRAFT',
                items: {
                    create: data.items.map(item => ({
                        accountId: item.accountId,
                        debit: item.debit || 0,
                        credit: item.credit || 0,
                        label: item.label
                    }))
                }
            },
            include: {
                items: {
                    include: { account: true }
                }
            }
        });
    }

    async postJournalEntry(entryId: string) {
        const entry = await prisma.journalEntry.findUnique({
            where: { id: entryId },
            include: { items: true }
        });

        if (!entry) throw new Error('Journal Entry not found');
        if (entry.status === 'POSTED') throw new Error('Entry already posted');

        return prisma.journalEntry.update({
            where: { id: entryId },
            data: { status: 'POSTED' }
        });
    }

    /**
     * Helper to find an account by its code
     */
    async getAccountByCode(code: string) {
        return prisma.account.findUnique({
            where: { code }
        });
    }

    /**
     * Helper to find a journal by its code
     */
    async getJournalByCode(code: string) {
        return prisma.journal.findUnique({
            where: { code }
        });
    }

    /**
     * Automatic Ledger Posting: Fee Invoice
     * Dr: Accounts Receivable
     * Cr: Revenue
     */
    async postFeeInvoiceToLedger(invoice: any) {
        const totalAmount = invoice.totalAmount;
        const invoiceNumber = invoice.invoiceNumber;

        // Find required accounts and journal
        const arAccount = await this.getAccountByCode('1100'); // AR
        const revenueAccount = await this.getAccountByCode('4000'); // Tuition Revenue
        const salesJournal = await this.getJournalByCode('INV');

        if (!arAccount || !revenueAccount || !salesJournal) {
            console.warn(`[Accounting] Missing accounting setup. Skipping auto-post.`);
            return;
        }

        const entry = await this.createJournalEntry({
            journalId: salesJournal.id,
            reference: invoiceNumber,
            date: new Date(),
            items: [
                { accountId: arAccount.id, debit: Number(totalAmount), label: `Fees Receivable: Invoice ${invoiceNumber}` },
                { accountId: revenueAccount.id, credit: Number(totalAmount), label: `Tuition Revenue: Invoice ${invoiceNumber}` }
            ]
        });

        return this.postJournalEntry(entry.id);
    }

    /**
     * Automatic Ledger Posting: Fee Payment
     * Dr: Bank/Cash
     * Cr: Accounts Receivable
     */
    async postFeePaymentToLedger(payment: any, method: string) {
        const { amount, receiptNumber } = payment;

        // Determine destination account (Bank or Cash)
        const assetCode = method === 'BANK_TRANSFER' ? '1210' : '1200';
        const assetAccount = await this.getAccountByCode(assetCode);
        const arAccount = await this.getAccountByCode('1100');
        const journalCode = method === 'BANK_TRANSFER' ? 'BNK1' : 'CSH1';
        const journal = await this.getJournalByCode(journalCode);

        if (!assetAccount || !arAccount || !journal) {
            console.warn(`[Accounting] Missing accounting setup. Skipping payment post.`);
            return;
        }

        const entry = await this.createJournalEntry({
            journalId: journal.id,
            reference: receiptNumber,
            date: new Date(),
            items: [
                { accountId: assetAccount.id, debit: Number(amount), label: `Fee Payment Received: ${receiptNumber}` },
                { accountId: arAccount.id, credit: Number(amount), label: `Settlement: ${receiptNumber}` }
            ]
        });

        return this.postJournalEntry(entry.id);
    }

    /**
     * Automatic Ledger Posting: Payroll Record
     * Dr: Salaries Expense
     * Cr: Salaries Payable
     */
    async postPayrollToLedger(payroll: any) {
        const { netSalary, payrollNumber, month, year } = payroll;

        const expenseAccount = await this.getAccountByCode('5000'); // Salaries Expense
        const payableAccount = await this.getAccountByCode('2110'); // Salaries Payable
        const journal = await this.getJournalByCode('MISC');

        if (!expenseAccount || !payableAccount || !journal) {
            console.warn(`[Accounting] Missing payroll setup. Skipping auto-post.`);
            return;
        }

        const entry = await this.createJournalEntry({
            journalId: journal.id,
            reference: payrollNumber || `PAY/${year}/${month}`,
            date: new Date(),
            items: [
                { accountId: expenseAccount.id, debit: Number(netSalary), label: `Payroll Expense for ${month}/${year}` },
                { accountId: payableAccount.id, credit: Number(netSalary), label: `Salaries Payable for ${month}/${year}` }
            ]
        });

        return this.postJournalEntry(entry.id);
    }

    async getVendors() {
        return prisma.vendor.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
    }

    async createVendor(data: { name: string; email?: string; phone?: string; address?: string }) {
        return prisma.vendor.create({ data });
    }

    async recordExpense(data: {
        date?: Date;
        amount: number;
        description: string;
        category: string;
        accountId: string; // Expense Account (e.g., 5100)
        paymentAccountId: string; // Asset Account (e.g., Bank/Cash)
        vendorId?: string;
        reference?: string;
    }) {
        const expense = await prisma.expense.create({
            data: {
                date: data.date || new Date(),
                amount: data.amount,
                description: data.description,
                category: data.category,
                vendorId: data.vendorId,
                accountId: data.accountId,
                reference: data.reference,
                status: 'PAID'
            }
        });

        // Automated Ledger Posting
        const journal = await this.getJournalByCode('MISC');
        if (journal) {
            const entry = await this.createJournalEntry({
                journalId: journal.id,
                reference: data.reference || `EXP-${expense.id.slice(0, 8)}`,
                date: data.date || new Date(),
                items: [
                    { accountId: data.accountId, debit: Number(data.amount), label: `Expense: ${data.description}` },
                    { accountId: data.paymentAccountId, credit: Number(data.amount), label: `Payment for: ${data.description}` }
                ]
            });
            await this.postJournalEntry(entry.id);
        }

        return expense;
    }

    async getBankStatements(accountId?: string) {
        return prisma.bankStatement.findMany({
            where: {
                accountId: accountId || undefined
            },
            include: { lines: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async importBankStatement(data: {
        accountId: string;
        startingBalance: number;
        endingBalance: number;
        lines: { date: Date; description: string; amount: number; reference?: string }[];
    }) {
        return prisma.bankStatement.create({
            data: {
                accountId: data.accountId,
                startingBalance: data.startingBalance,
                endingBalance: data.endingBalance,
                lines: {
                    create: data.lines.map(line => ({
                        date: line.date,
                        description: line.description,
                        amount: line.amount,
                        reference: line.reference
                    }))
                }
            },
            include: { lines: true }
        });
    }

    async reconcileStatementLine(lineId: string, journalItemId: string) {
        return prisma.bankStatementLine.update({
            where: { id: lineId },
            data: {
                journalItemId,
                status: 'MATCHED'
            }
        });
    }

    async getFinancialReport(startDate: Date, endDate: Date) {
        // 1. Trial Balance (Existing logic)
        const accountsWithBalance = await prisma.account.findMany({
            include: {
                journalItems: {
                    where: {
                        entry: {
                            status: 'POSTED',
                            date: { gte: startDate, lte: endDate }
                        }
                    }
                }
            }
        });

        const trialBalance = accountsWithBalance.map(acc => {
            const debits = acc.journalItems.reduce((sum, item) => sum + Number(item.debit), 0);
            const credits = acc.journalItems.reduce((sum, item) => sum + Number(item.credit), 0);

            // Assets & Expenses increase with Debit
            const isDebitNormal = acc.type.startsWith('ASSET') || acc.type === 'EXPENSE';

            return {
                code: acc.code,
                name: acc.name,
                type: acc.type,
                balance: isDebitNormal ? debits - credits : credits - debits
            };
        });

        // 2. Simple Profit & Loss
        const income = trialBalance.filter(a => a.type === 'REVENUE').reduce((sum, a) => sum + a.balance, 0);
        const expenses = trialBalance.filter(a => a.type === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0);
        const netProfit = income - expenses;

        // 3. Balance Sheet
        const nonCurrentAssets = trialBalance.filter(a => a.type === 'ASSET_NON_CURRENT').reduce((sum, a) => sum + a.balance, 0);
        const currentAssets = trialBalance.filter(a => ['ASSET_RECEIVABLE', 'ASSET_CASH'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
        const totalAssets = nonCurrentAssets + currentAssets;

        const currentLiabilities = trialBalance.filter(a => ['LIABILITY_PAYABLE', 'LIABILITY_CURRENT'].includes(a.type)).reduce((sum, a) => sum + a.balance, 0);
        const nonCurrentLiabilities = trialBalance.filter(a => a.type === 'LIABILITY_NON_CURRENT').reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = currentLiabilities + nonCurrentLiabilities;

        const equity = trialBalance.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + a.balance, 0);

        return {
            trialBalance,
            profitLoss: {
                totalIncome: income,
                totalExpenses: expenses,
                netProfit
            },
            balanceSheet: {
                assets: {
                    nonCurrent: nonCurrentAssets,
                    current: currentAssets,
                    total: totalAssets
                },
                liabilities: {
                    current: currentLiabilities,
                    nonCurrent: nonCurrentLiabilities,
                    total: totalLiabilities
                },
                equity: {
                    retainedEarnings: equity,
                    currentYearProfit: netProfit,
                    total: equity + netProfit
                },
                totalLiabilitiesAndEquity: totalLiabilities + equity + netProfit
            }
        };
    }
}

export const accountingService = new AccountingService();
