import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { accountingController } from '../../src/controllers/accounting.controller';
import { accountingService } from '../../src/services/accounting.service';

// Mock the entire accounting.service module
jest.mock('../../src/services/accounting.service', () => {
    const mockService = {
        getDashboardStats: jest.fn(),
        getAccounts: jest.fn(),
        createAccount: jest.fn(),
        getJournals: jest.fn(),
        createJournalEntry: jest.fn(),
        postJournalEntry: jest.fn(),
        getExpenses: jest.fn(),
        getVendors: jest.fn(),
        recordExpense: jest.fn(),
        importBankStatement: jest.fn(),
        reconcileLine: jest.fn(),
        suggestMatches: jest.fn(),
        getFinancialReport: jest.fn(),
    };
    return {
        AccountingService: jest.fn().mockImplementation(() => mockService),
        accountingService: mockService,
    };
});

describe('AccountingController', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let jsonSpy: jest.Mock;
    let statusSpy: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonSpy = jest.fn().mockReturnThis();
        statusSpy = jest.fn().mockReturnThis();
        
        mockReq = {};
        mockRes = {
            json: jsonSpy,
            status: statusSpy,
        } as any;
    });

    describe('getDashboardStats', () => {
        it('should return stats with 200 OK', async () => {
            const mockStats = { 
                cashActual: 1000, 
                netProfit: 500,
                accountsReceivable: 200,
                accountsPayable: 100,
                recentEntries: []
            };
            (accountingService.getDashboardStats as any).mockResolvedValue(mockStats);

            await accountingController.getDashboardStats(mockReq as Request, mockRes as Response);

            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockStats
            });
        });

        it('should handle errors and return 500', async () => {
            (accountingService.getDashboardStats as any).mockRejectedValue(new Error('Service Error'));

            await accountingController.getDashboardStats(mockReq as Request, mockRes as Response);

            expect(statusSpy).toHaveBeenCalledWith(500);
            expect(jsonSpy).toHaveBeenCalledWith({ success: false, message: 'Service Error' });
        });
    });

    describe('createAccount', () => {
        it('should return created account with 201 status', async () => {
            const mockAccount = { id: '1', name: 'Test Account', code: '1000' };
            mockReq.body = { name: 'Test Account', code: '1000', type: 'ASSET_CASH' };
            (accountingService.createAccount as any).mockResolvedValue(mockAccount);

            await accountingController.createAccount(mockReq as Request, mockRes as Response);

            expect(statusSpy).toHaveBeenCalledWith(201);
            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                message: 'Account created',
                data: mockAccount
            });
        });
    });

    describe('suggestMatches', () => {
        it('should suggest matches for a bank line', async () => {
            mockReq.params = { lineId: 'line123' };
            const mockMatches = [{ id: 'item1', amount: 500 }];
            (accountingService.suggestMatches as any).mockResolvedValue(mockMatches);

            await accountingController.suggestMatches(mockReq as Request, mockRes as Response);

            expect(jsonSpy).toHaveBeenCalledWith({
                success: true,
                data: mockMatches
            });
        });
    });
});
