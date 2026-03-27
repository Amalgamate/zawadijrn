import puppeteer from 'puppeteer';
import { ApiError } from '../utils/error.util';

export const pdfService = {
    /**
     * Generate PDF from HTML content using Puppeteer only
     * @param html HTML content to render
     * @param options PDF options
     */
    generatePdf: async (html: string, options: any = {}) => {
        console.log('📄 Generating PDF with Puppeteer...');
        return await generatePdfWithPuppeteer(html, options);
    },

    /**
     * Generate JPEG/PNG screenshot from HTML content using Puppeteer
     * @param html HTML content to render
     * @param options screenshot options
     */
    generateScreenshot: async (html: string, options: any = {}) => {
        console.log('🖼️ Generating screenshot with Puppeteer...');
        return await generateScreenshotWithPuppeteer(html, options);
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
            headless: 'shell',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--no-first-run',
                '--disable-extensions',
                '--disable-accelerated-2d-canvas'
            ]
        };

        if (executablePath) {
            launchConfig.executablePath = executablePath;
        }

        browser = await puppeteer.launch(launchConfig);
        const page = await browser.newPage();

        await page.setViewport({ width: 794, height: 1123 }); // A4 at 96dpi

        // Block external font requests that cause networkidle0 to hang or fail
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            // Allow data URIs (base64 images) and same-origin, block slow external CDNs
            if (url.startsWith('data:') || url.startsWith('about:')) {
                req.continue();
            } else if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
                req.abort(); // Skip Google Fonts — use system fonts instead
            } else {
                req.continue();
            }
        });

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Give React-rendered SVGs and layout a moment to settle
        await new Promise(r => setTimeout(r, 500));

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
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

async function generateScreenshotWithPuppeteer(html: string, options: any) {
    let browser = null;
    try {
        const executablePath =
            process.env.PUPPETEER_EXECUTABLE_PATH ||
            process.env.CHROME_PATH ||
            process.env.REACT_APP_CHROME_PATH ||
            undefined;

        const launchConfig: any = {
            headless: 'shell',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-zygote',
                '--no-first-run',
                '--disable-extensions',
                '--disable-accelerated-2d-canvas'
            ]
        };

        if (executablePath) {
            launchConfig.executablePath = executablePath;
        }

        browser = await puppeteer.launch(launchConfig);
        const page = await browser.newPage();

        await page.setViewport({ width: 794, height: 1123 }); // A4 @ 96dpi

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const url = req.url();
            if (url.startsWith('data:') || url.startsWith('about:')) {
                req.continue();
            } else if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 500));

        const screenshotBuffer = await page.screenshot({
            type: options?.type || 'jpeg',
            quality: options?.quality || 100,
            fullPage: true,
            omitBackground: false
        });

        await browser.close();
        console.log(`✅ Screenshot generated with Puppeteer: ${screenshotBuffer.length} bytes`);
        return screenshotBuffer;
    } catch (error: any) {
        if (browser) await browser.close();
        throw error;
    }
}
