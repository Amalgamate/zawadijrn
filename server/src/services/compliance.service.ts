import prisma from '../config/database';
import { FeeInvoice, ComplianceStatus } from '@prisma/client';


export interface ETIMSPayload {
  invoiceNumber: string;
  customerName: string;
  customerPin?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>;
  totalAmount: number;
  taxAmount: number;
}

export class ComplianceService {
  /**
   * Sync a Fee Invoice with KRA eTIMS (Background Process)
   */
  async syncInvoiceToETIMS(invoiceId: string) {
    try {
      const invoice = await prisma.feeInvoice.findUnique({
        where: { id: invoiceId },
        include: { 
          learner: true,
          feeStructure: {
            include: { feeItems: { include: { feeType: true } } }
          }
        }
      });

      if (!invoice) throw new Error('Invoice not found');
      // Already synced check
      if (invoice.complianceStatus === ComplianceStatus.SYNCED) {
        console.log(`[Compliance] Invoice ${invoice.invoiceNumber} already synced. Skipping.`);
        return true;
      }

      console.log(`[Compliance] Syncing Invoice ${invoice.invoiceNumber} to KRA eTIMS...`);

      // 1. Prepare eTIMS Payload
      const payload: ETIMSPayload = {
        invoiceNumber: invoice.invoiceNumber,
        customerName: `${invoice.learner.firstName} ${invoice.learner.lastName}`,
        customerPin: (invoice.learner as any).kraPin, // Placeholder for parent/learner PIN
        items: invoice.feeStructure.feeItems.map(item => ({
          name: item.feeType.name,
          quantity: 1,
          unitPrice: Number(item.amount),
          taxRate: 0 // Most school fees are tax exempt (Zero Rated) or Exempt
        })),
        totalAmount: Number(invoice.totalAmount),
        taxAmount: 0
      };

      // 2. Perform API Handshake (Simulated for this implementation)
      // In production, this would be an axios.post(KRA_ENDPOINT, payload)
      const mockResult = await this.mockETIMSCall(payload);

      // 3. Update Invoice with Compliance Data
      // Using COMPLIANCE_STATUS.SYNCED until the dedicated ComplianceStatus enum is added to schema
      await prisma.feeInvoice.update({
        where: { id: invoiceId },
        data: {
          complianceStatus: ComplianceStatus.SYNCED,
          etimsControlCode: mockResult.controlCode,
          etimsQRCodeUrl: mockResult.qrCode
        }
      });

      console.log(`[Compliance] Invoice ${invoice.invoiceNumber} successfully synced with KRA.`);
      return true;
    } catch (error) {
      console.error(`[Compliance] eTIMS Sync Failed for Invoice ${invoiceId}:`, error);
      // Mark as FAILED so retries and dashboards can surface it
      try {
        await prisma.feeInvoice.update({
          where: { id: invoiceId },
          data: { complianceStatus: ComplianceStatus.FAILED }
        });
      } catch (updateErr) {
        console.error(`[Compliance] Could not mark invoice ${invoiceId} as FAILED:`, updateErr);
      }
      return false;
    }
  }

  /**
   * Generate KRA iTax Payroll CSV (P10)
   */
  async generateITaxPayrollCSV(month: number, year: number) {
    const records = await prisma.payrollRecord.findMany({
      where: { month, year, status: 'GENERATED' },
      include: { user: true }
    });

    if (records.length === 0) return null;

    // Header for KRA iTax P10 Template
    let csv = 'PIN,Name,GrossPay,allowances,NSSF_Contribution,SHIF_Contribution,PAY_Tax\n';

    for (const record of records) {
      const tax = (record.deductions as any) || {};
      csv += `${record.user.kraPin || ''},"${record.user.firstName} ${record.user.lastName}",${record.basicSalary},0,${tax.nssf || 0},${tax.shif || 0},${tax.paye || 0}\n`;
    }

    return csv;
  }

  private async mockETIMSCall(_payload: ETIMSPayload) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate a mock Control Code and QR URL
    const randomSuffix = Math.random().toString(36).substring(7).toUpperCase();
    return {
      controlCode: `KRA-INV-${Date.now()}-${randomSuffix}`,
      qrCode: `https://itax.kra.go.ke/verify?invoice=${randomSuffix}`
    };
  }
}

export const complianceService = new ComplianceService();
