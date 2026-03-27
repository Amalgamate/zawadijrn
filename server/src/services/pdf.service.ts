import puppeteer from 'puppeteer';
import PDFDocument from 'pdfkit';
import { ApiError } from '../utils/error.util';

export const pdfService = {
    /**
     * Generate PDF from HTML content
     * Tries Puppeteer first (high-fidelity), falls back to pdfkit (lightweight)
     * @param html HTML content to render
     * @param options PDF options
     */
    generatePdf: async (html: string, options: any = {}) => {
        let browser = null;
        
        try {
            console.log('📄 Attempting PDF generation with Puppeteer...');
            return await generatePdfWithPuppeteer(html, options);
        } catch (puppeteerError: any) {
            console.warn('⚠️ Puppeteer failed, falling back to pdfkit:', puppeteerError.message);
            try {
                console.log('📄 Generating PDF with pdfkit (fallback)...');
                return await generatePdfWithPdfKit(html, options);
            } catch (pdfkitError: any) {
                console.error('❌ Both PDF methods failed:', pdfkitError);
                throw new ApiError(500, `Failed to generate PDF: ${pdfkitError.message}`);
            }
        }
    }
};

/**
 * Generate PDF using Puppeteer (high-fidelity, requires Chrome/Chromium)
 */
async function generatePdfWithPuppeteer(html: string, options: any) {
    let browser = null;
    try {
        const executablePath =
            process.env.PUPPETEER_EXECUTABLE_PATH ||
            process.env.CHROME_PATH ||
            process.env.REACT_APP_CHROME_PATH ||
            undefined;

        const launchConfig: any = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process'
            ]
        };

        if (executablePath) {
            launchConfig.executablePath = executablePath;
        }

        browser = await puppeteer.launch(launchConfig);
        const page = await browser.newPage();

        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(html, { waitUntil: 'networkidle0' });

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
        console.log(`✅ PDF generated with Puppeteer: ${pdfBuffer.length} bytes`);
        return pdfBuffer;
    } catch (error: any) {
        if (browser) await browser.close();
        throw error;
    }
}

/**
 * Generate PDF using pdfkit (lightweight, pure JS, no Chromium required)
 * Suitable for serverless environments like Render
 */
async function generatePdfWithPdfKit(html: string, options: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40
            });

            const chunks: Buffer[] = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                console.log(`✅ PDF generated with pdfkit: ${pdfBuffer.length} bytes`);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Strip HTML tags and extract text content for basic rendering
            const textContent = stripHtmlTags(html);
            
            doc.fontSize(11).text(textContent, {
                align: 'left',
                lineGap: 5
            });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Simple HTML tag stripper for basic text extraction
 */
function stripHtmlTags(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
}
