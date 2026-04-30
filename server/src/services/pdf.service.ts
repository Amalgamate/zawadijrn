import { ApiError } from '../utils/error.util';

/**
 * PDF Service (Frontend-Only Policy)
 * 
 * Server-side PDF generation is deprecated and unsupported.
 * 
 * All report generation should now be handled on the frontend using 
 * html2canvas and jsPDF.
 */
export const pdfService = {
    /**
     * Generate PDF from HTML content (STUBBED)
     */
    generatePdf: async (html: string, options: any = {}): Promise<Buffer> => {
        console.error('❌ Server-side PDF generation is deprecated. Use frontend rendering.');
        throw new ApiError(501, 'Server-side PDF generation is not supported on this environment. Please use the frontend export feature.');
    },

    /**
     * Generate JPEG/PNG screenshot from HTML content (STUBBED)
     */
    generateScreenshot: async (html: string, options: any = {}): Promise<Buffer> => {
        console.error('❌ Server-side screenshot generation is deprecated. Use frontend rendering.');
        throw new ApiError(501, 'Server-side screenshot generation is not supported on this environment. Please use the frontend export feature.');
    }
};

