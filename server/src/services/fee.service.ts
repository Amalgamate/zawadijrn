import prisma from '../config/database';
import { configService } from './config.service';
import { SmsService } from './sms.service';
import { EmailService } from './email.service';
import { whatsappService } from './whatsapp.service';
import { accountingService } from './accounting.service';

const SKIP_FEE_NOTIFICATIONS = process.env.SKIP_FEE_NOTIFICATIONS === 'true' || process.env.NODE_ENV === 'test';

const INVOICE_NUMBER_RETRY_COUNT = 3;

function parseInvoiceNumber(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

async function getNextInvoiceNumber(client: any, academicYear: number): Promise<string> {
  const result = await client.feeInvoice.aggregate({
    _max: { invoiceNumber: true },
    where: { academicYear }
  });

  const currentMax = result._max.invoiceNumber as string | null;
  const nextSequence = parseInvoiceNumber(currentMax) + 1;
  return `INV-${academicYear}-${String(nextSequence).padStart(6, '0')}`;
}

async function createInvoiceWithSafeNumber(client: any, invoiceData: any, include: any): Promise<any> {
  let lastError: any;

  for (let attempt = 1; attempt <= INVOICE_NUMBER_RETRY_COUNT; attempt++) {
    const invoiceNumber = await getNextInvoiceNumber(client, invoiceData.academicYear);
    try {
      return await client.feeInvoice.create({
        data: { ...invoiceData, invoiceNumber },
        include
      });
    } catch (error: any) {
      lastError = error;
      if (error?.code === 'P2002' && attempt < INVOICE_NUMBER_RETRY_COUNT) {
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

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
                const errorMsg = 'No active term configuration found. Please set a term as active in Settings.';
                console.warn(`[FeeService] ${errorMsg}`);
                return { success: false, error: errorMsg };
            }

            const { term, academicYear } = activeTermConfig;
            console.log(`[FeeService] Active Period: ${term} ${academicYear}`);

            // 3. Find Matching Fee Structure
            const feeStructure = await prisma.feeStructure.findFirst({
                where: {
                    academicYear,
                    term,
                    grade: grade as any,
                    active: true
                },
                include: {
                    feeItems: {
                        include: { feeType: true }
                    }
                }
            });

            if (!feeStructure) {
                const errorMsg = `No matching fee structure found for ${grade.replace('_', ' ')} (${term.replace('_', ' ')} ${academicYear})`;
                console.warn(`[FeeService] ${errorMsg}`);
                return { success: false, error: errorMsg };
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

            const allItems = (feeStructure as any).feeItems || [];
            const filteredItems = learner.isTransportStudent 
                ? allItems 
                : allItems.filter((i: any) => i.feeType?.code !== 'TRANSPORT');

            const totalAmount = filteredItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

            // 6. Create Invoice
            const newInvoice = await createInvoiceWithSafeNumber(prisma, {
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
            }, {
                learner: true
            });

            // Post to Accounting Ledger
            try {
                await accountingService.postFeeInvoiceToLedger(newInvoice);
            } catch (ledgerError: any) {
                console.warn(`[FeeService] Failed to post invoice to ledger: ${ledgerError?.message || ledgerError}`);
            }

            // 7. Trigger Notifications (best-effort, do not block invoice creation)
            if (!SKIP_FEE_NOTIFICATIONS && learner.parent && learner.parent.phone) {
                const parentPhone = learner.parent.phone;
                const parentName = `${learner.parent.firstName} ${learner.parent.lastName}`;
                const learnerName = `${learner.firstName} ${learner.lastName}`;

                // Fetch school name for email/sms
                const school = await prisma.school.findFirst();
                const schoolName = school?.name || 'School';

                try {
                    await SmsService.sendFeeInvoiceNotification({
                        parentPhone,
                        parentName,
                        learnerName,
                        invoiceNumber: newInvoice.invoiceNumber,
                        term: `${term.replace('_', ' ')} ${academicYear}`,
                        amount: totalAmount,
                        dueDate: dueDate.toLocaleDateString()
                    });
                } catch (smsError: any) {
                    console.warn(`[FeeService] SMS notification failed: ${smsError?.message || smsError}`);
                }

                try {
                    await whatsappService.sendFeeReminder({
                        parentPhone,
                        parentName,
                        learnerName,
                        amountDue: totalAmount,
                        dueDate: dueDate.toLocaleDateString()
                    });
                } catch (whatsappError: any) {
                    console.warn(`[FeeService] WhatsApp notification failed: ${whatsappError?.message || whatsappError}`);
                }

                if (learner.parent.email) {
                    try {
                        await EmailService.sendFeeInvoiceEmail({
                            to: learner.parent.email,
                            schoolName,
                            parentName,
                            learnerName,
                            invoiceNumber: newInvoice.invoiceNumber,
                            term: `${term.replace('_', ' ')} ${academicYear}`,
                            amount: totalAmount,
                            dueDate: dueDate.toLocaleDateString(),
                            feeItems: (feeStructure as any).feeItems.map((item: any) => ({
                                name: item.feeType.name,
                                amount: Number(item.amount)
                            }))
                        });
                    } catch (emailError: any) {
                        console.warn(`[FeeService] Email notification failed: ${emailError?.message || emailError}`);
                    }
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
