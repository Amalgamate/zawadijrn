import prisma from '../config/database';
import { configService } from './config.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { accountingService } from './accounting.service';

export class FeeService {
    /**
     * Automatically generate an invoice for a learner based on their grade and the active term.
     */
    async generateInvoiceForLearner(learnerId: string): Promise<any> {
        console.log(`[FeeService] Attempting to generate invoice for learner: ${learnerId}`);

        try {
            // 1. Fetch Learner details
            const learner = await prisma.learner.findUnique({
                where: { id: learnerId },
                include: {
                    parent: true
                }
            });

            if (!learner) {
                console.error(`[FeeService] Learner not found: ${learnerId}`);
                return { success: false, error: 'Learner not found' };
            }

            if (learner.status !== 'ACTIVE' || learner.archived) {
                console.log(`[FeeService] Learner ${learner.admissionNumber} is not active. Skipping.`);
                return { success: false, error: 'Learner is not active' };
            }

            const { grade } = learner;

            // 2. Determine Active Term
            const activeTermConfig = await configService.getActiveTermConfig();

            if (!activeTermConfig) {
                console.warn(`[FeeService] No active term configuration found. Cannot generate invoice.`);
                return { success: false, error: 'No active term configuration found' };
            }

            const { term, academicYear } = activeTermConfig;
            console.log(`[FeeService] Active Period: ${term} ${academicYear}`);

            // 3. Find Matching Fee Structure
            const feeStructure = await prisma.feeStructure.findFirst({
                where: {
                    academicYear,
                    term,
                    grade,
                    active: true
                },
                include: {
                    feeItems: {
                        include: { feeType: true }
                    }
                }
            });

            if (!feeStructure) {
                console.warn(`[FeeService] No matching fee structure found for ${grade}, ${term} ${academicYear}.`);
                return { success: false, error: 'No matching fee structure found' };
            }

            // 4. Check if Invoice already exists
            const existingInvoice = await prisma.feeInvoice.findFirst({
                where: {
                    learnerId,
                    feeStructureId: feeStructure.id,
                    term,
                    academicYear
                }
            });

            if (existingInvoice) {
                return { success: true, invoice: existingInvoice, created: false };
            }

            // 5. Calculate Amount and Due Date
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);

            const totalAmount = feeStructure.feeItems.reduce((sum, item) => sum + Number(item.amount), 0);

            // 6. Create Invoice
            const count = await prisma.feeInvoice.count();
            const invoiceNumber = `INV-${academicYear}-${String(count + 1).padStart(6, '0')}`;

            const newInvoice = await prisma.feeInvoice.create({
                data: {
                    invoiceNumber,
                    learnerId,
                    feeStructureId: feeStructure.id,
                    term,
                    academicYear,
                    dueDate,
                    totalAmount,
                    paidAmount: 0,
                    balance: totalAmount,
                    status: 'PENDING',
                    issuedBy: 'SYSTEM'
                },
                include: {
                    learner: true
                }
            });

            // Post to Accounting Ledger
            await accountingService.postFeeInvoiceToLedger(newInvoice);

            // 7. Trigger Notifications
            if (learner.parent && learner.parent.phone) {
                const parentPhone = learner.parent.phone;
                const parentName = `${learner.parent.firstName} ${learner.parent.lastName}`;
                const learnerName = `${learner.firstName} ${learner.lastName}`;

                // Fetch school name for email/sms
                const school = await prisma.school.findFirst();
                const schoolName = school?.name || 'School';

                // SMS
                await SmsService.sendFeeInvoiceNotification({
                    parentPhone,
                    parentName,
                    learnerName,
                    invoiceNumber,
                    term: `${term.replace('_', ' ')} ${academicYear}`,
                    amount: totalAmount,
                    dueDate: dueDate.toLocaleDateString()
                });

                // WhatsApp
                await whatsappService.sendFeeReminder({
                    parentPhone,
                    parentName,
                    learnerName,
                    amountDue: totalAmount,
                    dueDate: dueDate.toLocaleDateString()
                });

                // Email
                if (learner.parent.email) {
                    await EmailService.sendFeeInvoiceEmail({
                        to: learner.parent.email,
                        schoolName,
                        parentName,
                        learnerName,
                        invoiceNumber,
                        term: `${term.replace('_', ' ')} ${academicYear}`,
                        amount: totalAmount,
                        dueDate: dueDate.toLocaleDateString(),
                        feeItems: feeStructure.feeItems.map(item => ({
                            name: item.feeType.name,
                            amount: Number(item.amount)
                        }))
                    });
                }
            }

            return { success: true, invoice: newInvoice, created: true };

        } catch (error: any) {
            console.error(`[FeeService] Error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}

export const feeService = new FeeService();
