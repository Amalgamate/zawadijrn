/**
 * simplePdfGenerator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure frontend PDF generation — no backend, no Puppeteer, no server calls.
 * Uses html2canvas + jsPDF for high-fidelity A4 report capture.
 *
 * PUBLIC API:
 *   captureElement(el)               → Promise<HTMLCanvasElement>
 *   captureSingleReport(id, file, opts) → single-page PDF download
 *   captureBulkReports(id, file, opts)  → multi-page PDF (one page per .pdf-report-page)
 *   printWindow(id, opts)            → open browser print dialog
 *   generatePDFFromElement(id, file, opts) → auto-detect single vs bulk
 *
 * Legacy shims (same export names as before — zero breaking changes):
 *   generateDocument, generateCustomPDF, generatePDFWithLetterhead,
 *   generateHighFidelityPDF, generateStatementPDF
 * ─────────────────────────────────────────────────────────────────────────────
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ─── Constants ────────────────────────────────────────────────────────────────

/** A4 dimensions in mm */
const A4_W_MM = 210;
const A4_H_MM = 297;

/** Pixel dimensions at 96 DPI (browser default) */
const A4_W_PX = 794;
const A4_H_PX = 1123;

/**
 * Scale factor for capture.
 * 4.0 ≈ 384 DPI — Pushed to 4x for ultimate razor-sharp fidelity.
 */
const CAPTURE_SCALE = 4.0;

/** Pages to capture in parallel during bulk generation. */
const BULK_CONCURRENCY = 3;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Wait for all document fonts to load before capturing.
 * Prevents the "fallback font" bug where Poppins/Inter haven't loaded yet.
 */
const waitForFonts = () =>
  document.fonts?.ready ?? Promise.resolve();

/**
 * Wait one animation frame — lets React finish painting before capture.
 */
const nextPaint = () =>
  new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

/**
 * Shared html2canvas onclone handler.
 * Normalises the captured element's layout so it exactly matches the on-screen preview:
 *  • Preserves flex/column layout (never overrides with block)
 *  • Relaxes inner .report-card height so tall content is never clipped
 *  • Forces all children visible
 *  • Ensures SVGs (bar chart, pathway bars) render correctly
 *  • Strips scripts to prevent MIME errors in the clone
 */
const buildOnclone = () => (_clonedDoc, clonedEl) => {
  // 1. Normalise root element to strictly match A4 pixels
  clonedEl.style.cssText = `
    position: relative !important;
    left: 0 !important;
    top: 0 !important;
    width: ${A4_W_PX}px !important;
    min-height: ${A4_H_PX}px !important;
    max-width: ${A4_W_PX}px !important;
    display: flex !important;
    flex-direction: column !important;
    visibility: visible !important;
    opacity: 1 !important;
    overflow: visible !important;
    background: #ffffff !important;
    transform: none !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  `;

  // 2. Fix the inner .report-card for fidelity
  const card = clonedEl.querySelector('.report-card');
  if (card) {
    card.style.minHeight = `${A4_H_PX}px`;
    card.style.height = 'auto';
    card.style.overflow = 'visible';
    card.style.margin = '0'; // reset any auto centering
    card.style.padding = '30px 40px'; // Re-enforce padding
  }

  // 3. Global Style Preservations & Fixes
  clonedEl.querySelectorAll('*').forEach(node => {
    const style = window.getComputedStyle(node);
    
    // Ensure visibility
    node.style.visibility = 'visible';
    node.style.opacity = '1';

    // Force font-weight preservation (high-fidelity weights 700-1000)
    if (style.fontWeight && parseInt(style.fontWeight) >= 700) {
      node.style.fontWeight = style.fontWeight;
      node.style.color = style.color; // explicitly lock color too
    }

    // Fix background colors for branded headers (essential for deep blues)
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
      node.style.backgroundColor = style.backgroundColor;
      node.style.webkitPrintColorAdjust = 'exact';
    }
  });

  // 4. Force SVGs correctly (Header SVG, bar charts, etc.)
  _clonedDoc.querySelectorAll('svg').forEach(svg => {
    svg.style.display = 'block';
    svg.style.visibility = 'visible';
    svg.style.opacity = '1';
    svg.style.overflow = 'visible';
  });

  // 5. Strip scripts & hidden UI elements (prevents MIME errors and clutter)
  _clonedDoc.querySelectorAll('script, .no-print, .screen-only').forEach(s => s.remove());
};

/**
 * Shared html2canvas options applied to every single capture call.
 *
 * NOTE: `height` and `windowHeight` are intentionally omitted.
 * Hard-coding 1123px clips reports that contain more than ~9 subjects.
 * html2canvas reads el.scrollHeight naturally when height is not forced,
 * so tall reports expand correctly while normal A4 reports are unaffected.
 * The jsPDF page is always written at A4_H_MM — the extra canvas pixels
 * are scaled down to fit, which is the correct behaviour.
 */
const captureOptions = () => ({
  scale: CAPTURE_SCALE,
  useCORS: true,
  allowTaint: false,
  logging: false,
  backgroundColor: '#ffffff',
  width: A4_W_PX,
  windowWidth: A4_W_PX, // Force layout engine to A4 width
  onclone: buildOnclone(),
});

const createAbortError = (message = 'Bulk PDF generation cancelled') => {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
};

/**
 * Capture a single DOM element to a canvas.
 * Waits for fonts + paint before capturing.
 *
 * @param {HTMLElement} el
 * @returns {Promise<HTMLCanvasElement>}
 */
export const captureElement = async (el, opts = {}) => {
  const { signal } = opts;
  if (signal?.aborted) throw createAbortError();
  await waitForFonts();
  if (signal?.aborted) throw createAbortError();
  await nextPaint();
  if (signal?.aborted) throw createAbortError();
  return html2canvas(el, captureOptions());
};

/**
 * Add a canvas to a jsPDF page as a full-bleed A4 PNG image.
 * PNG preserves sharp text and coloured badges — never use JPEG here.
 */
const addCanvasToPdf = (pdf, canvas, addPage = false) => {
  if (addPage) pdf.addPage();
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, A4_W_MM, A4_H_MM);
};

/** Create a jsPDF instance configured for A4 portrait. */
const newA4Pdf = () =>
  new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

// ─── Concurrency helper ───────────────────────────────────────────────────────

/**
 * Run an array of async task factories with a maximum concurrency limit.
 * Results are returned in the same order as tasks.
 */
const runWithConcurrency = async (tasks, concurrency, signal) => {
  const results = new Array(tasks.length);
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      if (signal?.aborted) break;
      const idx = nextIndex++;
      if (idx >= tasks.length) break;
      try {
        results[idx] = await tasks[idx]();
      } catch (err) {
        results[idx] = err;
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, worker)
  );
  return results;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Download a single-page PDF from one DOM element.
 *
 * @param {string}   elementId   DOM id of the element to capture
 * @param {string}   filename    e.g. "Report_Jane_Doe.pdf"
 * @param {Object}   opts
 * @param {Function} [opts.onProgress]  (message: string) => void
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const captureSingleReport = async (elementId, filename, opts = {}) => {
  const { onProgress, signal } = opts;
  const el = document.getElementById(elementId);
  if (!el) return { success: false, error: `Element #${elementId} not found` };

  try {
    if (signal?.aborted) return { success: false, error: 'Bulk PDF generation cancelled' };
    if (onProgress) onProgress('Waiting for fonts…');
    await waitForFonts();
    await nextPaint();
    if (signal?.aborted) return { success: false, error: 'Bulk PDF generation cancelled' };

    if (onProgress) onProgress('Capturing report…');
    const canvas = await html2canvas(el, captureOptions());
    if (signal?.aborted) return { success: false, error: 'Bulk PDF generation cancelled' };

    if (onProgress) onProgress('Building PDF…');
    const pdf = newA4Pdf();
    addCanvasToPdf(pdf, canvas, false);

    if (onProgress) onProgress('Saving…');
    pdf.save(filename);

    if (onProgress) onProgress('Done!');
    return { success: true };
  } catch (err) {
    console.error('[captureSingleReport]', err);
    return { success: false, error: err.name === 'AbortError' ? 'Bulk PDF generation cancelled' : err.message };
  }
};

/**
 * Download a multi-page PDF — one PDF page per `.pdf-report-page` child.
 * Falls back to single-page capture if no `.pdf-report-page` children exist.
 *
 * Pages are captured in parallel batches of BULK_CONCURRENCY (default 3)
 * so the browser stays responsive for 40+ learners.
 *
 * @param {string}   elementId
 * @param {string}   filename
 * @param {Object}   opts
 * @param {Function} [opts.onProgress]
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const captureBulkReports = async (elementId, filename, opts = {}) => {
  const { onProgress, signal } = opts;
  const container = document.getElementById(elementId);
  if (!container) return { success: false, error: `Element #${elementId} not found` };

  const pages = Array.from(container.querySelectorAll('.pdf-report-page'));

  // No child pages → fall back to single capture
  if (pages.length === 0) {
    return captureSingleReport(elementId, filename, opts);
  }

  try {
    if (signal?.aborted) return { success: false, error: 'Bulk PDF generation cancelled' };
    if (onProgress) onProgress('Waiting for fonts…');
    await waitForFonts();
    await nextPaint();
    if (signal?.aborted) return { success: false, error: 'Bulk PDF generation cancelled' };

    if (onProgress) onProgress(`Capturing ${pages.length} report(s) — please wait…`);

    let completed = 0;

    const tasks = pages.map((pageEl) => async () => {
      if (signal?.aborted) throw createAbortError();
      const canvas = await html2canvas(pageEl, captureOptions());
      if (signal?.aborted) throw createAbortError();
      completed++;
      if (onProgress) onProgress(`Captured ${completed} of ${pages.length} pages…`);
      return canvas;
    });
    
    // Pass signal to the worker loop so it stops immediately
    const canvases = await runWithConcurrency(tasks, BULK_CONCURRENCY, signal);
    const abortError = canvases.find(result => result instanceof Error && result.name === 'AbortError');
    if (abortError) throw abortError;
    const failedError = canvases.find(result => result instanceof Error);
    if (failedError) throw failedError;

    if (signal?.aborted) return { success: false, error: 'Bulk PDF generation cancelled' };
    if (onProgress) onProgress('Building PDF…');
    const pdf = newA4Pdf();
    canvases.forEach((canvas, i) => addCanvasToPdf(pdf, canvas, i > 0));

    if (onProgress) onProgress('Saving…');
    pdf.save(filename);

    if (onProgress) onProgress('Done!');
    return { success: true };
  } catch (err) {
    console.error('[captureBulkReports]', err);
    return { success: false, error: err.name === 'AbortError' ? 'Bulk PDF generation cancelled' : err.message };
  }
};

/**
 * Open the report in a new browser tab and trigger the system print dialog.
 * The tab renders PNG images of the captured pages at full A4 resolution.
 *
 * @param {string} elementId
 * @param {Object} opts
 * @param {Function} [opts.onProgress]
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const printWindow = async (elementId, opts = {}) => {
  const { onProgress } = opts;
  const el = document.getElementById(elementId);
  if (!el) return { success: false, error: `Element #${elementId} not found` };

  try {
    if (onProgress) onProgress('Preparing print preview…');
    await waitForFonts();
    await nextPaint();

    const pages = Array.from(el.querySelectorAll('.pdf-report-page'));
    const targets = pages.length > 0 ? pages : [el];

    const canvases = await runWithConcurrency(
      targets.map(t => () => html2canvas(t, captureOptions())),
      BULK_CONCURRENCY
    );

    const imgs = canvases
      .map(c => `<img src="${c.toDataURL('image/png')}" style="width:210mm;height:297mm;display:block;page-break-after:always;" />`)
      .join('');

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Print Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; }
    img { display: block; page-break-after: always; }
    @page { size: A4 portrait; margin: 0; }
    @media print { body { width: 210mm; } img { width: 210mm; height: 297mm; } }
  </style>
</head>
<body>${imgs}</body>
</html>`;

    const blob = new Blob([printHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');

    if (win) {
      win.onload = () => {
        win.focus();
        win.print();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      };
    } else {
      URL.revokeObjectURL(url);
      return { success: false, error: 'Popup blocked — allow popups for this site.' };
    }

    if (onProgress) onProgress('Print dialog opened.');
    return { success: true };
  } catch (err) {
    console.error('[printWindow]', err);
    return { success: false, error: err.message };
  }
};

/**
 * General-purpose: capture any element and download as PDF.
 * Auto-detects bulk (.pdf-report-page children) vs single.
 *
 * @param {string}   elementId
 * @param {string}   filename
 * @param {Object}   opts
 * @param {Function} [opts.onProgress]
 * @param {'download'|'print'} [opts.action='download']
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const generatePDFFromElement = async (elementId, filename, opts = {}) => {
  const { action = 'download' } = opts;

  if (action === 'print') {
    return printWindow(elementId, opts);
  }

  const container = document.getElementById(elementId);
  const hasBulkPages = container?.querySelectorAll('.pdf-report-page').length > 0;

  return hasBulkPages
    ? captureBulkReports(elementId, filename, opts)
    : captureSingleReport(elementId, filename, opts);
};

// ─── Legacy compatibility shims ───────────────────────────────────────────────
// These match the old export names — zero breaking changes for other files.

export const generateCustomPDF = (elementId, filename, opts) =>
  generatePDFFromElement(elementId, filename, opts);

export const generatePDFWithLetterhead = (elementId, filename, _schoolInfo, opts = {}) =>
  generatePDFFromElement(elementId, filename, opts);

export const generateHighFidelityPDF = (elementId, filename, opts) =>
  generatePDFFromElement(elementId, filename, opts);

/**
 * generateStatementPDF — fee statement PDF.
 * Accepts the old positional args (learner, invoices, payments) plus an opts object.
 * opts.elementId defaults to 'statement-content'.
 * opts.action: 'download' (default) | 'print'
 */
export const generateStatementPDF = (_learner, _invoices, _payments, opts = {}) => {
  const filename = opts.fileName || opts.filename ||
    `Statement_${_learner?.firstName || ''}_${_learner?.lastName || ''}_${new Date().getFullYear()}.pdf`;
  const elementId = opts.elementId || 'statement-content';
  const action = opts.action === 'print' ? 'print' : 'download';
  return generatePDFFromElement(elementId, filename, { ...opts, action });
};

/**
 * generateDocument — previously routed to Puppeteer backend.
 * Now runs entirely in the browser.
 *
 * If opts.elementId is provided, captures that element directly.
 * If opts.html is provided as raw HTML string, renders it in a hidden iframe,
 * captures it, then removes the iframe.
 */
export const generateDocument = async (opts = {}) => {
  const {
    elementId,
    html,
    fileName = 'document.pdf',
    action = 'download',
    onProgress,
  } = opts;

  // Path 1: element already in the DOM
  if (elementId) {
    return generatePDFFromElement(elementId, fileName, { action, onProgress });
  }

  // Path 2: raw HTML string — render in a hidden iframe then capture
  if (html) {
    return new Promise((resolve) => {
      if (onProgress) onProgress('Rendering document…');

      const iframe = document.createElement('iframe');
      iframe.style.cssText = `
        position: fixed; left: -9999px; top: 0;
        width: ${A4_W_PX}px; height: ${A4_H_PX}px;
        border: none; background: #fff; z-index: -1; visibility: hidden;
      `;
      document.body.appendChild(iframe);

      const cleanup = () => {
        try { document.body.removeChild(iframe); } catch (_) {}
      };

      iframe.onload = async () => {
        try {
          await waitForFonts();
          await nextPaint();

          const body = iframe.contentDocument?.body;
          if (!body) {
            cleanup();
            return resolve({ success: false, error: 'iframe body not accessible' });
          }

          if (onProgress) onProgress('Capturing…');
          const canvas = await html2canvas(body, { ...captureOptions(), scrollX: 0, scrollY: 0 });
          cleanup();

          if (action === 'print') {
            const img = canvas.toDataURL('image/png');
            const printHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0}body{background:#fff}img{display:block;width:210mm}@page{size:A4 portrait;margin:0}</style></head><body><img src="${img}"/></body></html>`;
            const blob = new Blob([printHtml], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) win.onload = () => { win.focus(); win.print(); };
            return resolve({ success: true });
          }

          const pdf = newA4Pdf();
          addCanvasToPdf(pdf, canvas, false);
          pdf.save(fileName);
          if (onProgress) onProgress('Done!');
          return resolve({ success: true });

        } catch (err) {
          cleanup();
          console.error('[generateDocument iframe]', err);
          return resolve({ success: false, error: err.message });
        }
      };

      iframe.onerror = () => {
        cleanup();
        resolve({ success: false, error: 'Failed to load iframe' });
      };

      iframe.srcdoc = html;
    });
  }

  return { success: false, error: 'generateDocument: provide either elementId or html' };
};

// ─── Default export (object shim for legacy import styles) ───────────────────
const simplePdf = {
  generateDocument,
  generatePDFFromElement,
  generatePDFWithLetterhead,
  generateHighFidelityPDF,
  generateStatementPDF,
  captureSingleReport,
  captureBulkReports,
  captureElement,
  printWindow,
};

export default simplePdf;
