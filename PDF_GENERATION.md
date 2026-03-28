# PDF Generation — Zawadi SMS
## Engineering Reference Document

---

## What we have

PDF generation is **100% frontend**. There is no server-side rendering.
The backend `pdf.service.ts` exists but is intentionally stubbed — it throws a 501
immediately. All capture, rendering, and download happens in the browser using
`html2canvas` + `jsPDF`.

---

## File map

```
src/
  utils/
    simplePdfGenerator.js          ← single source of truth for all PDF logic
  components/CBCGrading/pages/
    SummativeReport.jsx            ← report template + three user-facing handlers
  services/api/
    report.api.js                  ← API stubs (PDF calls throw, not silent)

server/src/
  services/pdf.service.ts          ← STUBBED — throws 501, do not use
  routes/pdf.routes.ts             ← routes exist but service is stubbed
```

---

## simplePdfGenerator.js — Public API

### Constants (top of file)

| Constant | Value | Why |
|---|---|---|
| `A4_W_PX` | 794 | A4 at 96 DPI — matches `LearnerReportTemplate` width |
| `A4_H_PX` | 1123 | A4 at 96 DPI — matches template `height` |
| `CAPTURE_SCALE` | 3 | ≈ 288 DPI — crisp text at print resolution |
| `BULK_CONCURRENCY` | 3 | Max parallel captures for class-wide export |

### Exported functions

#### `captureElement(el)` → `Promise<HTMLCanvasElement>`
Raw capture of a single DOM element. Waits for fonts + paint before firing
`html2canvas`. Used by WhatsApp image captures in `SummativeReport.jsx`.

#### `captureSingleReport(elementId, filename, opts)` → `{ success, error? }`
Single-learner PDF. Steps:
1. `waitForFonts()` — blocks on `document.fonts.ready`
2. `nextPaint()` — double `requestAnimationFrame` so React finishes painting
3. `html2canvas(el, captureOptions())` — captures at scale 3, PNG
4. `newA4Pdf()` + `addCanvasToPdf()` — embeds PNG into A4 jsPDF
5. `pdf.save(filename)` — triggers browser download

#### `captureBulkReports(elementId, filename, opts)` → `{ success, error? }`
Class-wide PDF. Looks for `.pdf-report-page` children inside the container.
Falls back to `captureSingleReport` if none found. Steps:
1. `waitForFonts()` + `nextPaint()`
2. Builds a task array — one capture per `.pdf-report-page` child
3. `runWithConcurrency(tasks, 3)` — captures 3 pages at a time in parallel
4. Assembles all canvases into one jsPDF — one page per canvas
5. `pdf.save(filename)`

#### `printWindow(elementId, opts)` → `{ success, error? }`
Opens a print-ready HTML tab and triggers `window.print()`. Steps:
1. Captures all `.pdf-report-page` children (or the whole element)
2. Converts each canvas to a PNG data URI
3. Builds a self-contained HTML blob with `@page { size: A4; margin: 0 }`
4. `window.open(blobUrl)` + `win.onload = () => win.print()`

#### `generatePDFFromElement(elementId, filename, opts)` → auto-dispatch
Smart router. If `opts.action === 'print'` → `printWindow`. If bulk pages exist →
`captureBulkReports`. Otherwise → `captureSingleReport`.

### Legacy shims (zero breaking changes)
These names are kept so other files (`FormativeReport`, `TermlyReport`,
`StudentStatementsPage`) need no changes:

| Old name | Routes to |
|---|---|
| `generateHighFidelityPDF` | `generatePDFFromElement` |
| `generateCustomPDF` | `generatePDFFromElement` |
| `generatePDFWithLetterhead` | `generatePDFFromElement` |
| `generateStatementPDF` | `generatePDFFromElement` (elementId defaults to `statement-content`) |
| `generateDocument` | `generatePDFFromElement` (DOM element path) or hidden iframe (raw HTML path) |

---

## captureOptions() — the quality knobs

Every `html2canvas` call uses these options:

```js
{
  scale: 3,           // 288 DPI — the single biggest factor for crispness
  useCORS: true,      // allows cross-origin images (Cloudinary logos, stamps)
  allowTaint: false,  // fail clean rather than produce tainted canvas
  logging: false,
  backgroundColor: '#ffffff',
  width: 794,         // pin to A4 pixel width
  height: 1123,       // pin to A4 pixel height
  onclone: buildOnclone()
}
```

### buildOnclone() — what it fixes

The `onclone` callback fires on the cloned DOM before capture. It fixes four
known html2canvas failure modes:

| Problem | Fix applied in onclone |
|---|---|
| Report card positioned off-screen | Force `position: relative; left: 0` |
| Flex layout collapses to block | Explicitly re-apply `display: flex; flex-direction: column` |
| Bottom content clipped | Set `.report-card` to `height: auto; overflow: visible` |
| SVG charts invisible | Force `display: block; visibility: visible; opacity: 1` on every `<svg>` |
| Script MIME errors | `querySelectorAll('script').forEach(s => s.remove())` |
| Hidden children not rendered | Force `visibility: visible; opacity: 1` on every child node |

---

## SummativeReport.jsx — the three user-facing handlers

### Imports (top of file)

```js
import {
  captureSingleReport,
  captureBulkReports,
  captureElement,
  printWindow as pdfPrintWindow,
} from '../../../utils/simplePdfGenerator';

// Local aliases — keep call-sites unchanged
const generateVectorPDF = (elementId, filename, onProgress) =>
  captureSingleReport(elementId, filename, { onProgress });

const generateBulkPDF = (elementId, filename, onProgress) =>
  captureBulkReports(elementId, filename, { onProgress });
```

### `handleExportPDF` — single learner download
- Triggered by: "Download PDF" button on single-learner view
- Calls: `generateVectorPDF('summative-report-content', filename, onProgress)`
- Target element: `#summative-report-content` — the live visible report card

### `handlePrintPDF` — print preview
- Triggered by: "Print Preview" button on single-learner view
- Calls: `generateVectorPDF('summative-report-content', 'Report_Print.pdf', onProgress)`
- Internally routes to `printWindow` via `generatePDFFromElement`

### `handleBulkPrint` — class-wide download
- Triggered by: "Download Combined PDF" button on bulk view
- Pre-fetches all comment data before mounting cards
- Mounts `<LearnerReportTemplate>` for each learner into `#bulk-print-content`
- Each template wrapped in `<div class="pdf-report-page">` — required selector
- Calls: `generateBulkPDF('bulk-print-content', filename, onProgress)`
- `captureBulkReports` finds all `.pdf-report-page` divs and captures in parallel

### `handleSingleDownload` (per-row in bulk view)
- Triggered by: individual PDF icon on each row in the bulk learner list
- Mounts one learner into `#single-print-content` (hidden off-screen container)
- Calls: `generateVectorPDF('single-print-content', filename, onProgress)`

---

## Hidden capture containers

The bulk and single download paths use hidden DOM containers that live permanently
in the page, off-screen:

```jsx
<div style={{
  position: 'fixed',
  top: 0, left: 0,
  width: '794px',
  height: '1123px',
  visibility: 'hidden',   // ← NOT opacity:0 — html2canvas needs layout tree
  pointerEvents: 'none',
  zIndex: -100,
  overflow: 'visible'     // ← prevents bottom clip
}}>
  <div id="single-print-content"> ... </div>
  <div id="bulk-print-content">
    {bulkDownloadData.map(row => (
      <div class="pdf-report-page" style={{ width: 794, height: 1123 }}>
        <LearnerReportTemplate ... />
      </div>
    ))}
  </div>
</div>
```

**Why `visibility: hidden` and not `opacity: 0` or `display: none`:**
- `display: none` — element is not in the layout tree, html2canvas reads 0×0
- `opacity: 0` — element is in layout but html2canvas silently renders it blank
- `visibility: hidden` — element is fully laid out, invisible to user, readable by html2canvas

---

## LearnerReportTemplate — physical dimensions

The template sets exact pixel dimensions that match the `captureOptions` constants:

```jsx
<div
  className="report-card"
  style={{
    width: '794px',      // = A4_W_PX
    minHeight: '1123px', // = A4_H_PX
    height: '1123px',    // hard crop boundary for canvas
    padding: '30px 40px 30px 40px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  }}
>
```

The `buildOnclone` handler re-applies these in the captured clone to guarantee
consistency regardless of any Tailwind or parent styles that might interfere.

---

## Quality factors — what makes the PDF crisp

| Factor | Setting | Effect |
|---|---|---|
| Capture scale | `3` (288 DPI) | Sharp text, no fuzzy edges on grade badges |
| Image format | PNG (not JPEG) | No compression artifacts on coloured grade text |
| jsPDF compress | `true` | Smaller file without quality loss (lossless) |
| Font guard | `document.fonts.ready` | Prevents Poppins/Inter falling back to system serif |
| Paint guard | double `requestAnimationFrame` | Prevents capturing mid-React-render blank frames |
| Fixed width | `794px` | No reflow distortion — element matches A4 exactly |
| CORS | `useCORS: true` | Cloudinary logos + stamps embed correctly |

---

## Known limitations

**Text is not selectable in the PDF.** `html2canvas` rasterises everything — the
PDF contains a bitmap image, not vector text. This is a fundamental constraint of
the html2canvas approach.

**Cloudinary images require CORS headers.** If the school logo or stamp is hosted
on a Cloudinary bucket without `Access-Control-Allow-Origin: *`, `useCORS: true`
will fail and the image will be blank in the PDF. Fix: add a CORS policy on the
Cloudinary bucket, or pre-convert the image to a base64 data URI before rendering
the template.

**Bulk export blocks the main thread during capture.** `runWithConcurrency(3)`
helps but for a class of 40+ learners the browser will appear frozen for several
seconds. A progress callback updates the UI overlay to keep the user informed.

---

## report.api.js — what changed

`generatePdf` and `generateScreenshot` are now error-throwing stubs:

```js
generatePdf: async () => {
  throw new Error('PDF generation is frontend-only. Use simplePdfGenerator.js');
},
```

This ensures any accidental call from an old import path fails loudly in the
console rather than silently returning null and producing an empty PDF.

---

## Backend pdf.service.ts — intentionally stubbed

```ts
generatePdf: async (html, options): Promise<Buffer> => {
  throw new ApiError(501, 'Server-side PDF generation is not supported...');
}
```

The Render deployment environment does not have Chromium available. The route
`POST /api/pdf/generate` exists and is authenticated, but calling it returns a
501 immediately. Do not attempt to re-enable server-side generation on this
deployment target without first confirming Chromium is available on the dyno.

---

## Sequence for a single-learner PDF download

```
User clicks "Download PDF"
  │
  ▼
handleExportPDF()
  │  builds filename, calls generateVectorPDF(elementId, filename, onProgress)
  ▼
captureSingleReport(elementId, filename, { onProgress })
  │
  ├─ waitForFonts()         await document.fonts.ready
  ├─ nextPaint()            await rAF(rAF())
  ├─ html2canvas(el, opts)  scale:3, width:794, buildOnclone
  │    └─ onclone fixes:    position, flex layout, SVG visibility, hidden children
  ├─ newA4Pdf()             jsPDF A4 portrait, compress:true
  ├─ addCanvasToPdf()       canvas.toDataURL('image/png') → pdf.addImage PNG
  └─ pdf.save(filename)     browser download dialog
```

---

## Sequence for a class-wide bulk PDF

```
User clicks "Download Combined PDF"
  │
  ▼
handleBulkPrint()
  │  pre-fetches comment data for all learners
  │  sets bulkDownloadData → React mounts N LearnerReportTemplates
  │  each wrapped in <div class="pdf-report-page"> inside #bulk-print-content
  │  waits 2500ms for React to fully render all cards
  │
  ▼
generateBulkPDF('bulk-print-content', filename, onProgress)
  │
  ▼
captureBulkReports(elementId, filename, opts)
  │
  ├─ querySelectorAll('.pdf-report-page')   finds N page divs
  ├─ waitForFonts() + nextPaint()
  ├─ runWithConcurrency(tasks, 3)           captures 3 pages at a time
  │    └─ each task: html2canvas(pageEl, captureOptions())
  ├─ newA4Pdf()
  ├─ canvases.forEach → addCanvasToPdf()   page 0: no addPage, pages 1+: addPage
  └─ pdf.save(filename)
```

---

*Last updated: March 2026*
