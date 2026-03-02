import puppeteer from 'puppeteer';
import { ApiError } from '../utils/error.util';

export const pdfService = {
    /**
     * Generate PDF from HTML content
     * @param html HTML content to render
     * @param options Puppeteer PDF options
     */
    generatePdf: async (html: string, options: any = {}) => {
        let browser = null;
        try {
            console.log('📄 Starting PDF generation with Puppeteer...');

            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // Setting viewport is sometimes helpful for layout
            await page.setViewport({ width: 1200, height: 800 });

            // Load HTML content
            // Use waitUntil: 'networkidle0' to ensure all assets (images, fonts) are loaded
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Generate PDF
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '10mm',
                    right: '10mm',
                    bottom: '10mm',
                    left: '10mm'
                },
                ...options
            });

            await browser.close();
            browser = null;

            console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);
            return pdfBuffer;

        } catch (error: any) {
            console.error('❌ PDF Generation Error:', error);
            if (browser) await browser.close();
            throw new ApiError(500, `Failed to generate PDF: ${error.message}`);
        }
    }
};
