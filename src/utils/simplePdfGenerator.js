/**
 * Simple PDF Generator using existing jspdf + html2canvas
 * No new dependencies needed!
 * 
 * @module utils/simplePdfGenerator
 */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../services/api';
import { getSchoolBranding, getOfficialLetterheadHTML, getOfficialStampHTML } from './brandingUtils';

/**
 * Helper to convert image URL to Base64
 * This ensures images are fully loaded and renderable by html2canvas
 */
const convertImageToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    return url; // Return original URL if conversion fails
  }
};

/**
 * Processes all images in an element and converts them to Base64
 * This is crucial for server-side rendering where relative paths don't work
 * @param {HTMLElement} element - The element containing images to convert
 */
const resolveImagesToBase64 = async (element, onProgress) => {
  const images = element.getElementsByTagName('img');
  const total = images.length;

  if (total === 0) return;

  if (onProgress) onProgress(`Embedding ${total} images...`);

  const CONCURRENCY_LIMIT = 3; // Process 3 images at a time
  const imagesArray = Array.from(images);

  for (let i = 0; i < imagesArray.length; i += CONCURRENCY_LIMIT) {
    const batch = imagesArray.slice(i, i + CONCURRENCY_LIMIT);
    if (onProgress) onProgress(`Converting images (${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, total)} of ${total})...`);

    await Promise.all(batch.map(async (img) => {
      const originalSrc = img.getAttribute('src');
      if (!originalSrc || originalSrc.startsWith('data:')) return;

      // Convert to absolute URL if it's relative
      const absoluteUrl = new URL(originalSrc, window.location.href).href;

      try {
        const base64 = await convertImageToBase64(absoluteUrl);
        img.setAttribute('src', base64);
      } catch (err) {
        console.warn(`Failed to convert image ${originalSrc} to base64:`, err);
      }
    }));
  }
};

/**
 * Convert HTML element to PDF
 * @param {string} elementId - ID of element to convert
 * @param {string} filename - Output filename
 * @param {Object} options - Configuration options
 * @param {number} options.scale - Canvas scale (higher = better quality)
 * @param {string} options.backgroundColor - Background color
 * @param {boolean} options.multiPage - Enable multi-page PDFs
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise<Object>} Result object with success status
 */
export const generatePDFFromElement = async (
  elementId,
  filename,
  options = {}
) => {
  const {
    scale = 2,
    backgroundColor = '#ffffff',
    multiPage = true,
    onProgress = null
  } = options;

  try {
    if (onProgress) onProgress('Preparing report...');

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Store original overflow style
    const originalOverflow = element.style.overflow;
    element.style.overflow = 'visible';

    // Capture element as canvas
    if (onProgress) onProgress('Capturing content...');
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    // Restore original overflow
    element.style.overflow = originalOverflow;

    // Create PDF
    if (onProgress) onProgress('Creating PDF...');
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    if (multiPage) {
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    // Download PDF
    if (onProgress) onProgress('Downloading...');
    pdf.save(filename);

    if (onProgress) onProgress('Complete!');
    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate PDF with custom page setup
 * More control over page margins and orientation
 * 
 * @param {string} elementId - ID of element to convert
 * @param {string} filename - Output filename
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Result object
 */
export const generateCustomPDF = async (elementId, filename, options = {}) => {
  const {
    orientation = 'portrait', // 'portrait' or 'landscape'
    format = 'a4',
    margins = { top: 10, right: 10, bottom: 10, left: 10 },
    scale = 2,
    onProgress = null
  } = options;

  try {
    if (onProgress) onProgress('Preparing report...');

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // Capture element
    if (onProgress) onProgress('Capturing content...');
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    // Create PDF with custom settings
    if (onProgress) onProgress('Creating PDF...');
    const pdf = new jsPDF(orientation, 'mm', format);
    const imgData = canvas.toDataURL('image/png');

    // Calculate dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - margins.left - margins.right;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = margins.top;
    let heightLeft = imgHeight;
    const pageContentHeight = pdfHeight - margins.top - margins.bottom;

    // Add image to first page
    pdf.addImage(imgData, 'PNG', margins.left, position, imgWidth, imgHeight);
    heightLeft -= pageContentHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margins.top;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margins.left, position, imgWidth, imgHeight);
      heightLeft -= pageContentHeight;
    }

    // Download PDF
    if (onProgress) onProgress('Downloading...');
    pdf.save(filename);

    if (onProgress) onProgress('Complete!');
    return { success: true };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate PDF with letterhead
 * Adds school branding to the report before conversion
 * 
 * @param {string} elementId - ID of element to convert
 * @param {string} filename - Output filename
 * @param {Object} schoolInfo - School information for letterhead
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Result object
 */
export const generatePDFWithLetterhead = async (
  elementId,
  filename,
  schoolInfo = {},
  options = {}
) => {
  const {
    orientation = 'portrait',
    onProgress = null,
    action = 'download' // 'download' | 'print' | 'preview'
  } = options;

  const {
    schoolName = '',
    address = '',
    phone = '',
    email = '',
    website = '',
    logoUrl = '',
    brandColor = '#1e3a8a',
    skipLetterhead = false
  } = { ...getSchoolBranding(), ...schoolInfo };

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID "${elementId}" not found`);
    }

    // CRITICAL FIX: Make print-only elements visible before capturing
    const printOnlyElements = element.querySelectorAll('.print-only');
    const noPrintElements = element.querySelectorAll('.no-print');

    // Store original styles
    const originalStyles = new Map();
    printOnlyElements.forEach(el => {
      originalStyles.set(el, {
        display: el.style.display,
        visibility: el.style.visibility
      });
      el.style.display = 'block';
      el.style.visibility = 'visible';
    });

    // Hide no-print elements
    const noPrintOriginalStyles = new Map();
    noPrintElements.forEach(el => {
      noPrintOriginalStyles.set(el, el.style.display);
      el.style.display = 'none';
    });

    // Convert logo to Base64 to ensure it renders correctly in PDF
    // html2canvas often fails with external images or relative paths if not preloaded
    let processedLogoUrl = logoUrl;
    if (logoUrl && !logoUrl.startsWith('data:')) {
      if (options.onProgress) options.onProgress('Processing logo...', 10);
      processedLogoUrl = await convertImageToBase64(logoUrl);
    }

    // Create temporary wrapper with letterhead
    const wrapper = document.createElement('div');
    wrapper.style.backgroundColor = '#ffffff';
    wrapper.style.padding = '20px';
    wrapper.style.fontFamily = 'Arial, sans-serif';

    // Add letterhead - Compact Professional Layout
    const letterhead = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 0 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${brandColor}; padding-bottom: 10px; margin-bottom: 15px;">
          
          <!-- Logo Section -->
          <div style="flex-shrink: 0;">
            <img src="${processedLogoUrl}" alt="School Logo" style="height: 60px; width: auto; object-fit: contain;" crossorigin="anonymous" />
          </div>

          <!-- School Details Section -->
          <div style="text-align: right; flex-grow: 1; padding-left: 15px;">
            <h1 style="margin: 0 0 2px 0; font-size: 22px; font-weight: 700; color: ${brandColor}; letter-spacing: -0.5px; text-transform: uppercase;">
              ${schoolName}
            </h1>
            <div style="font-size: 10px; line-height: 1.3; color: #555;">
              <p style="margin: 0;">${address}</p>
              <p style="margin: 0;"><strong>Tel:</strong> ${phone} &nbsp;|&nbsp; <strong>Email:</strong> ${email}</p>
              <p style="margin: 0;"><a href="${website}" style="color: ${brandColor}; text-decoration: none;">${website}</a></p>
            </div>
          </div>
          
        </div>
      </div>
    `;

    // Clone element content
    if (options.onProgress) options.onProgress('Preparing document layout...', 20);
    const contentClone = element.cloneNode(true);

    // CRITICAL: Make print-only visible in the CLONE
    const clonedPrintOnly = contentClone.querySelectorAll('.print-only');
    console.log('PDF Generator: Found', clonedPrintOnly.length, 'print-only elements in clone');

    clonedPrintOnly.forEach(el => {
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      el.style.setProperty('opacity', '1', 'important');
    });

    // Hide no-print in the clone
    const clonedNoPrint = contentClone.querySelectorAll('.no-print');
    clonedNoPrint.forEach(el => {
      el.style.setProperty('display', 'none', 'important');
    });

    // Assemble wrapper
    if (skipLetterhead) {
      wrapper.innerHTML = '';
      wrapper.style.padding = '0'; // Let the element handle its own padding
    } else {
      wrapper.innerHTML = letterhead;
    }
    wrapper.appendChild(contentClone);

    // Temporarily add to document
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.width = orientation === 'landscape' ? '297mm' : '210mm';
    document.body.appendChild(wrapper);

    // Add a small delay to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 100));

    // Generate PDF from wrapper
    if (options.onProgress) options.onProgress('Rendering high-quality image...', 40);
    const canvas = await html2canvas(wrapper, {
      scale: options.scale || 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      allowTaint: false,
      onclone: (clonedDoc) => {
        // Optional: specific tweaks to cloned document before rendering
      }
    });

    // Remove temporary wrapper
    document.body.removeChild(wrapper);

    // Restore original styles
    printOnlyElements.forEach(el => {
      const original = originalStyles.get(el);
      el.style.display = original.display;
      el.style.visibility = original.visibility;
    });

    noPrintElements.forEach(el => {
      el.style.display = noPrintOriginalStyles.get(el);
    });

    // Create PDF
    if (onProgress) onProgress('Compiling PDF pages...', 70);
    const imgData = canvas.toDataURL('image/png');

    // PDF Dimensions
    const pdf = new jsPDF(orientation, 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Scale image to fit page width
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;


    // Add pages
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Add footer with page numbers
    if (options.onProgress) options.onProgress('Adding professional finish...', 90);
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128); // Gray text

      // Footer Line
      pdf.setDrawColor(230, 230, 230);
      pdf.line(10, pdfHeight - 15, pdfWidth - 10, pdfHeight - 15);


      // Page Number
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pdfWidth - 20,
        pdfHeight - 10,
        { align: 'right' }
      );


      // Generation Date & Copyright
      pdf.text(
        `Generated: ${new Date().toLocaleString('en-GB')} | © ${new Date().getFullYear()} ${schoolName}`,
        10,
        pdfHeight - 10
      );

    }

    // Action based on option
    if (action === 'print' || action === 'preview') {
      const type = action === 'print' ? 'Opening print dialog...' : 'Opening preview...';
      if (options.onProgress) options.onProgress(type, 100);

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');

      if (action === 'print' && win) {
        win.onload = () => win.print();
      }
    } else {
      if (options.onProgress) options.onProgress('Finalizing download...', 100);
      pdf.save(filename);
    }

    return { success: true };
  } catch (error) {
    console.error('PDF generation with letterhead error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * THE UNIVERSAL PDF GENERATOR
 * Using High-Fidelity Puppeteer Backend
 * @param {Object} options - { 
 *   html: '...', 
 *   fileName: '...', 
 *   docInfo: { type: 'INVOICE', ref: 'INV-001' }, 
 *   action: 'download'|'preview'|'print',
 *   includeLetterhead: true 
 * }
 */
export const generateDocument = async (options = {}) => {
  const {
    html,
    fileName = 'document.pdf',
    docInfo = { type: 'DOCUMENT', ref: 'DOC-' + Date.now() },
    action = 'download',
    includeLetterhead = true,
    includeStamp = false,
    stampOptions = {},
    pdfOptions = {}
  } = options;

  const branding = getSchoolBranding();

  // Resolve Relative URLs to Base64 for the backend to render them correctly
  if (branding.logo && !branding.logo.startsWith('data:')) {
    const absoluteLogoUrl = new URL(branding.logo, window.location.origin).href;
    try {
      branding.logo = await convertImageToBase64(absoluteLogoUrl);
    } catch (e) {
      console.warn('Failed to convert branding logo to base64:', e);
    }
  }

  if (branding.stamp && !branding.stamp.startsWith('data:')) {
    const absoluteStampUrl = new URL(branding.stamp, window.location.origin).href;
    try {
      branding.stamp = await convertImageToBase64(absoluteStampUrl);
    } catch (e) {
      console.warn('Failed to convert branding stamp to base64:', e);
    }
  }

  // Resolve images in the provided HTML content to Base64
  // If html is a full document (has <!DOCTYPE or <html>), process it directly
  let processedHtml;
  const isFullDocument = html.trimStart().toLowerCase().startsWith('<!doctype') || html.trimStart().toLowerCase().startsWith('<html');
  if (isFullDocument) {
    // Parse as a full document so images resolve correctly
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    await resolveImagesToBase64(doc.body);
    processedHtml = doc.documentElement.outerHTML;
  } else {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    await resolveImagesToBase64(tempDiv);
    processedHtml = tempDiv.innerHTML;
  }

  // Build Final HTML with Branding 
  let finalHtml = processedHtml;

  if (includeLetterhead) {
    const letterhead = getOfficialLetterheadHTML(branding, docInfo);
    finalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20mm 15mm;
            line-height: 1.5;
            background: white;
          }
          
          .content-wrapper { position: relative; min-height: 250mm; }
          
          .footer { 
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            border-top: 1px solid #e2e8f0; 
            margin-top: 40px; 
            text-align: center; 
            font-size: 10px; 
            color: #64748b; 
            font-style: italic; 
            padding-top: 10px;
          }
          
          /* Layout Utilities */
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .justify-between { justify-content: space-between; }
          .justify-center { justify-content: center; }
          .justify-end { justify-content: flex-end; }
          .gap-1 { gap: 4px; }
          .gap-2 { gap: 8px; }
          .gap-3 { gap: 12px; }
          .gap-4 { gap: 16px; }
          .gap-10 { gap: 40px; }
          
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          
          /* Sizing */
          .w-full { width: 100%; }
          .w-5 { width: 20px; }
          .h-3 { height: 12px; }
          .w-48 { width: 192px; }
          .w-\[65\%\] { width: 65%; }
          .w-\[60\%\] { width: 60%; }
          .w-\[40\%\] { width: 40%; }
          .w-\[35\%\] { width: 35%; }
          .h-0\.5 { height: 2px; }
          .h-1 { height: 4px; }
          .min-h-\[75px\] { min-height: 75px; }
          
          /* Positioning Extras */
          .bottom-\[18mm\] { bottom: 18mm; }
          .bottom-\[8mm\] { bottom: 8mm; }
          .left-\[8mm\] { left: 8mm; }
          .right-\[8mm\] { right: 8mm; }
          
          /* Spacing */
          .p-3 { padding: 12px; }
          .p-4 { padding: 16px; }
          .p-8px { padding: 8px; }
          .px-4 { padding-left: 16px; padding-right: 16px; }
          .px-3 { padding-left: 12px; padding-right: 12px; }
          .px-16 { padding-left: 64px; padding-right: 64px; }
          .py-1 { padding-top: 4px; padding-bottom: 4px; }
          .py-2 { padding-top: 8px; padding-bottom: 8px; }
          .pt-3 { padding-top: 12px; }
          .pb-1 { padding-bottom: 4px; }
          .mb-0\.5 { margin-bottom: 2px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mb-4 { margin-bottom: 16px; }
          .mb-6 { margin-bottom: 24px; }
          .mb-10 { margin-bottom: 40px; }
          .ml-2 { margin-left: 8px; }
          .mt-2 { margin-top: 8px; }
          .mt-3 { margin-top: 12px; }
          .mt-4 { margin-top: 16px; }
          .mt-6 { margin-top: 24px; }
          .mt-50 { margin-top: 50px; }
          .mx-auto { margin-left: auto; margin-right: auto; }
          
          /* Typography */
          .text-\[8px\] { font-size: 8px; }
          .text-\[9px\] { font-size: 9px; }
          .text-\[10px\] { font-size: 10px; }
          .text-\[11px\] { font-size: 11px; }
          .text-\[12px\] { font-size: 12px; }
          .text-\[14px\] { font-size: 14px; }
          .text-\[16px\] { font-size: 16px; }
          .text-\[18px\] { font-size: 18px; }
          .text-\[26px\] { font-size: 26px; }
          .text-xs { font-size: 12px; }
          .text-sm { font-size: 14px; }
          .text-lg { font-size: 18px; }
          .text-xl { font-size: 20px; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }
          .font-extrabold { font-weight: 800; }
          .font-\[900\] { font-weight: 900; }
          .italic { font-style: italic; }
          .uppercase { text-transform: uppercase; }
          .tracking-wider { letter-spacing: 0.05em; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .leading-snug { line-height: 1.375; }
          
          /* Colors */
          .text-gray-400 { color: #94a3b8; }
          .text-gray-500 { color: #64748b; }
          .text-gray-600 { color: #475569; }
          .text-gray-800 { color: #1e293b; }
          .text-slate-800 { color: #1e293b; }
          .text-slate-900 { color: #0f172a; }
          .text-\[\#1E3A8A\] { color: #1e3a8a; }
          
          .bg-white { background-color: #ffffff; }
          .bg-gray-50 { background-color: #f8fafc; }
          .bg-slate-50 { background-color: #f8fafc; }
          .bg-slate-300 { background-color: #cbd5e1; }
          .bg-blue-50 { background-color: #eff6ff; }
          .bg-\[\#eff6ff\] { background-color: #eff6ff; }
          
          /* Borders */
          .border { border: 1px solid #e2e8f0; }
          .border-t { border-top: 1px solid #e2e8f0; }
          .border-b { border-bottom: 1px solid #e2e8f0; }
          .border-t-2 { border-top-width: 2px; }
          .border-b-2 { border-bottom-width: 2px; }
          .border-slate-300 { border-color: #cbd5e1; }
          .border-slate-900 { border-color: #0f172a; }
          .border-dotted { border-style: dotted; }
          .rounded-sm { border-radius: 2px; }
          .rounded-lg { border-radius: 8px; }
          
          /* Special Styles */
          .opacity-95 { opacity: 0.95; }
          .mix-blend-multiply { mix-blend-mode: multiply; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          
          /* Tables */
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 700; font-size: 10px; text-transform: uppercase; color: #64748b; }
          td { font-size: 11px; }
          .divide-y > * + * { border-top: 1px solid #e2e8f0; }
          
        </style>
      </head>
      <body>
        ${letterhead}
        <div class="content-wrapper">
          ${processedHtml}
          
          ${includeStamp ? `
            <div style="margin-top: 50px; display: flex; justify-content: flex-end;">
              ${getOfficialStampHTML(stampOptions)}
            </div>
          ` : ''}
        </div>
        <div class="footer">
          This is a computer-generated document. No signature required. Thank you for choosing ${branding.name}.
        </div>
      </body>
      </html>
    `;
  }

  try {
    const response = await api.reports.generatePdf({
      html: finalHtml,
      fileName: fileName,
      options: {
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        ...pdfOptions
      }
    });

    if (response) {
      // response is already a Blob from api.js
      const url = URL.createObjectURL(response);

      if (action === 'print' || action === 'preview') {
        const win = window.open(url, '_blank');
        if (action === 'print' && win) {
          win.onload = () => win.print();
        }
      } else if (action === 'blob') {
        return { success: true, blob: response, url };
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      return { success: true, url };
    }
    return { success: false, error: 'Empty response from server' };
  } catch (error) {
    console.error('❌ Global PDF Generation Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Specifically generate a Fee Statement PDF (Proxy to generateDocument)
 */
export const generateStatementPDF = async (learner, invoices, payments, options = {}) => {
  const filename = `Statement_${learner.firstName}_${learner.lastName}_${new Date().getFullYear()}.pdf`;
  return generateDocument({
    html: options.html || document.getElementById('statement-content')?.innerHTML || '',
    fileName: filename,
    docInfo: { type: 'FEE STATEMENT', ref: learner.admissionNumber },
    ...options
  });
};

/**
 * High-Fidelity browser-side PDF generator.
 * Renders each .report-card child of elementId as its own A4 page using
 * html2canvas + jsPDF — no server, no Puppeteer, full design preserved.
 */
export const generateHighFidelityPDF = async (elementId, filename, options = {}) => {
  const { onProgress } = options;

  const container = document.getElementById(elementId);
  if (!container) return { success: false, error: `Element #${elementId} not found` };

  try {
    // Find individual report cards — each becomes one A4 page
    const cards = Array.from(container.querySelectorAll('.report-card'));
    const targets = cards.length > 0 ? cards : [container];

    if (onProgress) onProgress(`Rendering ${targets.length} report(s)...`);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const A4_W = 210;
    const A4_H = 297;

    for (let i = 0; i < targets.length; i++) {
      const card = targets[i];
      if (onProgress) onProgress(`Capturing report ${i + 1} of ${targets.length}...`);

      // Temporarily make the card block-visible at full width for capture
      const prevPosition = card.style.position;
      const prevLeft = card.style.left;
      card.style.position = 'relative';
      card.style.left = 'auto';

      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: card.scrollWidth,
        height: card.scrollHeight,
        windowWidth: card.scrollWidth,
      });

      card.style.position = prevPosition;
      card.style.left = prevLeft;

      const imgData = canvas.toDataURL('image/png');
      const imgW = A4_W;
      const imgH = (canvas.height * imgW) / canvas.width;

      if (i > 0) pdf.addPage();

      // If card taller than A4, scale to fit; otherwise top-align
      if (imgH <= A4_H) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
      } else {
        // Scale down to fit one page
        const scale = A4_H / imgH;
        pdf.addImage(imgData, 'PNG', 0, 0, imgW * scale, A4_H);
      }
    }

    if (onProgress) onProgress('Saving PDF...');
    pdf.save(filename);
    return { success: true };
  } catch (err) {
    console.error('generateHighFidelityPDF error:', err);
    return { success: false, error: err.message };
  }
};

const simplePdf = {
  generateDocument,
  generatePDFFromElement,
  generatePDFWithLetterhead,
  generateHighFidelityPDF,
  generateStatementPDF,
  quickPrint: (id) => window.print(), // Simplified
};

export default simplePdf;
