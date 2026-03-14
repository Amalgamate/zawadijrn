/**
 * CODE_AUDIT_REPORT generator
 * Run once: node _gen_report.js
 * Requires: npm install -g docx
 * Delete this file after running.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, PageBreak, VerticalAlign,
  TabStopType, TabStopPosition, PageNumberElement, NumberFormat
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

const CONTENT_W = 9360;

const RED    = "C00000";
const ORANGE = "C55A11";
const YELLOW = "7F6000";
const GREEN  = "375623";
const GRAY   = "595959";
const DARK   = "1F2937";
const BLUE   = "1E3A5F";
const ACCENT = "2563EB";

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: BLUE })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "DBEAFE", space: 2 } },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: DARK })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold: true, color: DARK })]
  });
}

function p(runs, opts = {}) {
  const children = Array.isArray(runs)
    ? runs.map(r => typeof r === 'string'
        ? new TextRun({ text: r, font: "Arial", size: 20, color: "333333" })
        : new TextRun({ font: "Arial", size: 20, color: "333333", ...r }))
    : [new TextRun({ text: runs, font: "Arial", size: 20, color: "333333" })];
  return new Paragraph({ spacing: { before: 60, after: 80 }, ...opts, children });
}

function mono(text, color = "1F2937") {
  return new TextRun({ text, font: "Courier New", size: 18, color });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: typeof text === 'string'
      ? [new TextRun({ text, font: "Arial", size: 20, color: "333333" })]
      : text.map(r => typeof r === 'string'
          ? new TextRun({ text: r, font: "Arial", size: 20, color: "333333" })
          : new TextRun({ font: "Arial", size: 20, ...r }))
  });
}

function spacer(before = 100) {
  return new Paragraph({ spacing: { before, after: 0 }, children: [new TextRun("")] });
}

function badge(label, bg, textColor = "FFFFFF") {
  return new TableCell({
    borders: noBorders,
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 40, bottom: 40, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: label, font: "Arial", size: 16, bold: true, color: textColor })]
    })]
  });
}

function issuePill(priority) {
  const map = {
    'CRIT': ['CRITICAL', RED],
    'HIGH': ['HIGH', 'C55A11'],
    'MED':  ['MEDIUM',   '7F6000'],
    'LOW':  ['LOW',      '375623'],
  };
  const [label, color] = map[priority] || ['INFO', '555555'];
  return { label, color };
}

function issueCard(num, prio, title, file, problem, fix) {
  const { label, color } = issuePill(prio);
  const rows = [
    new TableRow({
      children: [new TableCell({
        columnSpan: 2, borders,
        shading: { fill: color, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({ children: [
          new TextRun({ text: `#${num}  `, font: "Arial", size: 22, bold: true, color: "FFFFFF" }),
          new TextRun({ text: label + '  ', font: "Arial", size: 18, bold: true, color: "FFFFFF" }),
          new TextRun({ text: title, font: "Arial", size: 22, bold: true, color: "FFFFFF" }),
        ]})]
      })]
    }),
    ...(file ? [new TableRow({ children: [
      new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [p([{ text: "File", bold: true, color: DARK, size: 19 }])] }),
      new TableCell({ borders, width: { size: 7760, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [new Paragraph({ children: [mono(file, "1E40AF")] })] })
    ]})] : []),
    new TableRow({ children: [
      new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, shading: { fill: "F3F4F6", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [p([{ text: "Problem", bold: true, color: DARK, size: 19 }])] }),
      new TableCell({ borders, width: { size: 7760, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: problem.map(line => typeof line === 'string' ? p(line) : new Paragraph({ spacing: { before: 40, after: 40 }, indent: { left: 200 }, children: [mono(line.code, "991B1B")] }))
      })
    ]}),
    new TableRow({ children: [
      new TableCell({ borders, width: { size: 1600, type: WidthType.DXA }, shading: { fill: "ECFDF5", type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: [p([{ text: "Fix", bold: true, color: "065F46", size: 19 }])] }),
      new TableCell({ borders, width: { size: 7760, type: WidthType.DXA }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: fix.map(line => typeof line === 'string' ? p(line) : new Paragraph({ spacing: { before: 40, after: 40 }, indent: { left: 200 }, children: [mono(line.code, "065F46")] }))
      })
    ]}),
  ];
  return [new Table({ width: { size: CONTENT_W, type: WidthType.DXA }, columnWidths: [1600, 7760], rows }), spacer(120)];
}

function prioRow(num, prio, title, bg = "FFFFFF") {
  const { label, color } = issuePill(prio);
  return new TableRow({ children: [
    new TableCell({ borders, width: { size: 600, type: WidthType.DXA }, shading: { fill: bg, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(num), font: "Arial", size: 20, bold: true, color: "555555" })] })] }),
    badge(label, color),
    new TableCell({ borders, width: { size: 7160, type: WidthType.DXA }, shading: { fill: bg, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 120, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: title, font: "Arial", size: 20, color: DARK })] })] }),
  ]});
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial" }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial" }, paragraph: { spacing: { before: 260, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Arial" }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "DBEAFE", space: 4 } },
        spacing: { before: 120 },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: "Zawadi SMS — Code Audit Report", font: "Arial", size: 16, color: "9CA3AF" }),
          new TextRun({ text: "\t", font: "Arial", size: 16 }),
          new TextRun({ text: "Page ", font: "Arial", size: 16, color: "9CA3AF" }),
          new PageNumberElement({ font: "Arial", size: 16, color: "9CA3AF", format: NumberFormat.DECIMAL }),
        ]
      })]}),
    },
    children: [

      // ── Cover ──
      new Paragraph({ spacing: { before: 1200, after: 160 }, children: [new TextRun({ text: "ZAWADI SMS", font: "Arial", size: 64, bold: true, color: BLUE })] }),
      new Paragraph({ spacing: { before: 0, after: 80 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: ACCENT, space: 4 } }, children: [new TextRun({ text: "Code Audit Report", font: "Arial", size: 40, color: DARK })] }),
      spacer(200),
      p([{ text: "Project:  ", bold: true }, "Zawadi SMS School Management System"]),
      p([{ text: "Date:     ", bold: true }, "14 March 2026"]),
      p([{ text: "Scope:    ", bold: true }, "SMS pipeline, WhatsApp service, OTP flow, broadcast system, notification layer, encryption, rate limiting, frontend communication module"]),
      p([{ text: "Issues Found:  ", bold: true }, "24 total  —  6 Critical  |  5 High  |  6 Medium  |  7 Low"]),
      spacer(400),

      // ── 1. Executive Summary ──
      h1("1. Executive Summary"),
      p("This audit covers the full communications stack of the Zawadi SMS system: the Africa's Talking and MobileSasa SMS services, the WhatsApp Web integration, the OTP authentication flow, the broadcast campaign system, the notification controller, the audit log aggregation layer, and the frontend communication settings and message history pages."),
      spacer(80),
      p("The system is well-structured overall. Provider routing, phone number normalisation, API key encryption, config cache invalidation, and role-based access control are all implemented correctly. The issues found are concentrated in three areas:"),
      spacer(80),
      bullet([{ text: "Security: ", bold: true }, "A live API key is committed to the frontend source bundle, OTP codes are logged to a plaintext disk file, and a critical encryption key is not validated at startup."]),
      bullet([{ text: "Broken wiring: ", bold: true }, "The broadcast system sends every recipient through a rate-limited test endpoint rather than a bulk endpoint; a contact group creation field name mismatch silently drops all members; and SMS/WhatsApp report route validation schemas do not match their controllers."]),
      bullet([{ text: "Structural gaps: ", bold: true }, "Broadcast history is only stored in localStorage, the audit log pagination operates in-memory after merging three tables, and MobileSasa is missing from the settings UI despite being supported by the backend."]),
      spacer(160),
      p([{ text: "Issues #11, #12, and #15 are security vulnerabilities that must be resolved before the next production deployment.", bold: true, color: RED }]),
      spacer(300),

      // ── 2. Priority Matrix ──
      new Paragraph({ children: [new PageBreak()] }),
      h1("2. Priority Matrix"),
      spacer(80),
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [600, 1400, 7360],
        rows: [
          new TableRow({ tableHeader: true, children: [
            new TableCell({ borders, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 600, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "#", font: "Arial", size: 20, bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ borders, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 1400, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Priority", font: "Arial", size: 20, bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ borders, shading: { fill: BLUE, type: ShadingType.CLEAR }, margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 7360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Issue", font: "Arial", size: 20, bold: true, color: "FFFFFF" })] })] }),
          ]}),
          prioRow(11, 'CRIT', 'Live AT API key hardcoded in frontend bundle', "FFF5F5"),
          prioRow(12, 'CRIT', 'ENCRYPTION_KEY not validated at startup', "FFF5F5"),
          prioRow(15, 'CRIT', 'OTP codes logged in plaintext to disk file', "FFF5F5"),
          prioRow(1,  'CRIT', 'Broadcast loop uses sendTestSMS — hits 30 req/min rate limit'),
          prioRow(13, 'CRIT', 'SMS/WhatsApp report routes use wrong validation schemas'),
          prioRow(2,  'CRIT', 'createContactGroup — members vs recipients field mismatch'),
          prioRow(14, 'HIGH', 'WhatsApp report hardcodes schoolName as "School"', "FFFBF0"),
          prioRow(3,  'HIGH', 'Broadcast history loads from localStorage only — not DB', "FFFBF0"),
          prioRow(17, 'HIGH', 'SMS settings UI only shows AT — MobileSasa provider missing', "FFFBF0"),
          prioRow(18, 'HIGH', 'Audit log pagination is post-merge in-memory — breaks at scale', "FFFBF0"),
          prioRow(4,  'HIGH', 'Birthday audit records missing term and academicYear', "FFFBF0"),
          prioRow(5,  'MED',  '"Midterm Assessment" hardcoded in SMS template'),
          prioRow(16, 'MED',  'Rate limit store in-memory — breaks on cluster / multi-dyno'),
          prioRow(19, 'MED',  'WhatsApp phone formatter corrupts non-Kenyan numbers'),
          prioRow(7,  'MED',  'Global IP rate limiter commented out in server.ts'),
          prioRow(24, 'MED',  'OTP expiry mismatch — 5 min internal vs 10 min in SMS text'),
          prioRow(6,  'MED',  'School-specific strings hardcoded in communication.messages.ts'),
          prioRow(20, 'LOW',  'schoolId passed through frontend but silently ignored'),
          prioRow(8,  'LOW',  '/broadcasts/stats/:schoolId — dead schoolId param'),
          prioRow(21, 'LOW',  'Duplicate clearAllConfigCache() method — dead code'),
          prioRow(22, 'LOW',  '2.5 s bulk WhatsApp delay is magic number, undocumented'),
          prioRow(23, 'LOW',  'Announcement WhatsApp delay 100 ms — misaligned with bulk'),
          prioRow(9,  'LOW',  'Duplicate localStorage.removeItem("user") in axiosConfig'),
          prioRow(10, 'LOW',  '"Zawadi JRN Academy" hardcoded in WhatsApp test message'),
        ]
      }),
      spacer(300),

      // ── 3. Detailed Findings ──
      new Paragraph({ children: [new PageBreak()] }),
      h1("3. Detailed Findings"),

      h2("3.1  Security Issues"),
      ...issueCard(11, 'CRIT', 'Live API Key in Frontend Bundle',
        'src/constants/communicationMessages.js',
        [
          "A live Africa's Talking API key and username are committed as hardcoded fallbacks in a file that ships inside the React bundle. Any visitor who views page source can extract the full credential and send SMS billed to this account.",
          { code: "apiKey: process.env.REACT_APP_SMS_API_KEY || 'atsk_a84afb5...'," },
          { code: "username: process.env.REACT_APP_SMS_USERNAME || 'zawadijnr'," },
        ],
        [
          "Remove the hardcoded fallbacks — replace with empty strings:",
          { code: "apiKey: process.env.REACT_APP_SMS_API_KEY || ''," },
          { code: "username: process.env.REACT_APP_SMS_USERNAME || ''," },
          "The SMS configuration lives in the database and is managed via the admin settings page. The frontend bundle must never contain a credential. Rotate the leaked key immediately in the Africa's Talking dashboard.",
        ]
      ),
      ...issueCard(12, 'CRIT', 'ENCRYPTION_KEY Not Validated at Startup',
        'server/src/utils/encryption.util.ts  |  server/src/config/env-validator.ts',
        [
          "encryption.util.ts emits console.error if ENCRYPTION_KEY is missing but does not exit. The key is absent from env-validator.ts REQUIREMENTS. The server starts fine without it, but saving any SMS config silently throws an unhandled error at call time.",
          { code: 'if (!ENCRYPTION_KEY) { console.error("CRITICAL ERROR: ..."); }  // no exit!' },
        ],
        [
          "Add ENCRYPTION_KEY to REQUIREMENTS in env-validator.ts with format validation:",
          { code: '{ key: "ENCRYPTION_KEY", description: "32-byte hex key for AES-256-GCM",\n  validate: v => v.length === 64 && /^[0-9a-f]+$/i.test(v) }' },
          "Add to .env.example with a generation command:",
          { code: '# Generate: openssl rand -hex 32\nENCRYPTION_KEY=your_64_char_hex_here' },
        ]
      ),
      ...issueCard(15, 'CRIT', 'OTP Codes Written to Plaintext Disk Log',
        'server/src/services/otp.service.ts  |  server/src/controllers/otp.controller.ts',
        [
          "Every OTP generated is written verbatim to otp-debug.log in the server working directory. This file has been committed to the repository. Anyone with server file access — or CI/CD log access — can read every OTP ever issued and take over any user account.",
          { code: "fs.appendFileSync('otp-debug.log', `GENERATED OTP FOR ${email}: ${otpCode}`)" },
        ],
        [
          "Remove all fs.appendFileSync calls from the OTP flow. Gate any debug logging behind NODE_ENV and never log the code itself:",
          { code: "if (process.env.NODE_ENV !== 'production') {\n  console.debug(`[OTP] Code generated for ${email}`);\n}" },
          "Delete otp-debug.log from the repository, add it to .gitignore, and consider all previously issued OTPs compromised.",
        ]
      ),

      h2("3.2  Broken / Non-Functional Paths"),
      ...issueCard(1, 'CRIT', 'Broadcast Send Loop Uses Rate-Limited Test Endpoint',
        'src/components/CBCGrading/pages/BroadcastMessagesPage.jsx',
        [
          "handleSendBroadcast() calls communicationAPI.sendTestSMS() once per recipient. That route (POST /api/communication/test/sms) has a 30 req/min rate limit. Broadcasts to more than 30 recipients fail silently from the 31st recipient onward.",
          "The POST /api/broadcasts endpoint saves campaign history but does not send messages — it is never called during a broadcast.",
        ],
        [
          "Option A (quick): Throttle the frontend loop — send in batches of 25 with a 60-second pause between batches.",
          "Option B (proper): Add POST /api/broadcasts/send on the backend. It accepts the full recipient list, iterates server-side with controlled pacing, writes one BroadcastRecipient audit row per send, and returns a summary. Strongly recommended — it also enables progress streaming and retry logic.",
        ]
      ),
      ...issueCard(2, 'CRIT', 'createContactGroup Field Name Mismatch',
        'server/src/routes/communication.routes.ts  |  server/src/controllers/communication.controller.ts',
        [
          "The Zod schema validates members but the controller destructures recipients. A request from the frontend (which sends members) passes validation but recipients is undefined — the group is created with no members and no error.",
          { code: "// Schema:     members: z.array(z.string()).optional()" },
          { code: "// Controller: const { name, description, recipients } = req.body;" },
        ],
        [
          "Change the schema field to recipients to match the controller:",
          { code: "recipients: z.array(z.string()).optional()" },
        ]
      ),
      ...issueCard(13, 'CRIT', 'Assessment Report Routes Use Wrong Validation Schemas',
        'server/src/routes/notification.routes.ts',
        [
          "Both POST /sms/assessment-report and POST /whatsapp/assessment-report apply sendNotificationSchema, which requires message and ignores parentPhone, term, subjects, etc.",
          "Callers must supply a dummy message field to pass validation. The fields the controllers actually need — parentPhone, term, totalTests — arrive completely unvalidated.",
        ],
        [
          "Create a dedicated schema for assessment report endpoints:",
          { code: "const assessmentReportSchema = z.object({\n  learnerId: z.string().min(1),\n  learnerName: z.string().min(1),\n  learnerGrade: z.string().min(1),\n  parentPhone: z.string().min(9),\n  term: z.string().min(1),\n  totalTests: z.number().int().min(1),\n  // averageScore, overallGrade, subjects, etc.\n});" },
        ]
      ),
      ...issueCard(3, 'HIGH', 'Broadcast History Only Loaded from localStorage',
        'src/components/CBCGrading/pages/BroadcastMessagesPage.jsx',
        [
          "loadMessageHistory() reads only from localStorage on mount. The database has a full history table reachable via GET /api/broadcasts, but it is never called. History is invisible on other devices and is permanently lost when localStorage is cleared.",
        ],
        [
          "Call broadcastAPI.getHistory() on mount and merge with local entries (DB records take precedence):",
          { code: "const { data } = await broadcastAPI.getHistory();\nconst local = JSON.parse(localStorage.getItem('broadcastHistory') || '[]');\nsetMessageHistory(mergeDedup(data, local));" },
        ]
      ),
      ...issueCard(14, 'HIGH', 'WhatsApp Report Hardcodes School Name',
        'server/src/controllers/notification.controller.ts',
        [
          "sendAssessmentReportWhatsApp() passes a hardcoded string to the WhatsApp service. Every parent receives a report with *SCHOOL* as the header.",
          { code: "schoolName: 'School'   // hardcoded" },
        ],
        [
          "Fetch the school record before calling the service:",
          { code: "const school = await prisma.school.findFirst({ select: { name: true } });\nschoolName: school?.name || 'School'," },
        ]
      ),
      ...issueCard(4, 'HIGH', 'Birthday Audit Records Missing term and academicYear',
        'server/src/controllers/communication.controller.ts',
        [
          "sendBirthdayWishes() creates AssessmentSmsAudit records without term or academicYear. This either stores nulls (breaking date-range filters) or throws a Prisma constraint error that silently aborts the birthday send.",
        ],
        [
          "Pass safe defaults:",
          { code: "term: 'N/A',\nacademicYear: new Date().getFullYear()," },
          "Or mark both fields optional in the Prisma schema for non-assessment channels.",
        ]
      ),
      ...issueCard(17, 'HIGH', 'MobileSasa Missing from SMS Settings UI',
        'src/components/CBCGrading/pages/settings/CommunicationSettings.jsx',
        [
          "The provider dropdown only offers Africa's Talking. The backend fully supports mobilesasa. If a school's DB config uses MobileSasa, the settings page shows the wrong provider, and saving silently overwrites it with Africa's Talking.",
        ],
        [
          "Re-add MobileSasa to the dropdown and render its credential fields (apiKey + senderId only — no username). Ensure the selected value is set from config.sms.provider on load.",
        ]
      ),
      ...issueCard(18, 'HIGH', 'Audit Log Pagination Applied After In-Memory Merge',
        'server/src/controllers/notification.controller.ts  (getAuditLogs)',
        [
          "getAuditLogs() fetches all rows from three tables into memory, deduplicates them in JavaScript, then slices for the requested page. At scale this causes OOM conditions. Page 2 may also silently omit records that fell past individual table limits before the merge.",
        ],
        [
          "Short-term: Remove per-query take limits so the full dataset is merged before pagination.",
          "Long-term: Introduce a single unified MessageLog table written at send time across all channels, enabling proper database-level pagination with a single query.",
        ]
      ),

      h2("3.3  Medium-Priority Issues"),
      ...issueCard(5, 'MED', '"Midterm Assessment" Hardcoded in SMS Template',
        'server/src/config/communication.messages.ts',
        [
          "The assessmentReport template always outputs 'Midterm Assessment' regardless of the actual assessment type passed by the caller.",
          { code: "`Midterm Assessment, ${term}, ${year}`" },
        ],
        ["Accept assessmentType as a parameter and substitute it in the label."]
      ),
      ...issueCard(16, 'MED', 'Rate Limit Store Is In-Memory',
        'server/src/middleware/enhanced-rateLimit.middleware.ts',
        [
          "All counters live in a plain JS object. Every server restart resets all windows. With pm2 cluster mode or multiple dynos, each process has an independent store, making the effective limit maxRequests x num_processes.",
        ],
        [
          "Connect the store to Redis (already present in the project as redis-cache.service.ts) using atomic INCR with key TTLs. Libraries such as rate-limit-redis integrate directly with the existing middleware pattern.",
        ]
      ),
      ...issueCard(19, 'MED', 'WhatsApp Phone Formatter Corrupts Non-Kenyan Numbers',
        'server/src/services/whatsapp.service.ts  (formatPhoneNumber)',
        [
          "The formatter prepends 254 to any number that does not already start with it. A US number +1 650 555 0100 becomes 25416505550100@c.us — silently corrupted.",
          { code: "if (!formatted.startsWith('254')) formatted = '254' + formatted;" },
        ],
        ["Only prepend 254 for local Kenyan formats (starting with 07, 01, or exactly 9 bare digits). Leave numbers that already carry a non-254 country code unchanged."]
      ),
      ...issueCard(7, 'MED', 'Global IP Rate Limiter Commented Out',
        'server/src/server.ts',
        [
          "app.use(ipRateLimit(...)) is commented out with a note reading 'DISABLED TEMPORARILY FOR DEBUGGING'. It has never been re-enabled.",
        ],
        ["Re-enable and set an appropriate limit for production. A global IP limit is the first line of defence against volumetric request abuse."]
      ),
      ...issueCard(24, 'MED', 'OTP Expiry Mismatch',
        'server/src/services/otp.service.ts',
        [
          "The service enforces a 5-minute expiry but the SMS tells the user 10 minutes. Users who wait 6–10 minutes receive a confusing 'Code expired' error despite being told their code is still valid.",
          { code: "private static readonly OTP_EXPIRY_MINUTES = 5;   // internal" },
          { code: "SMS_MESSAGES.otp(otpCode, OTP_CONFIG.expiryMinutes)  // = 10 in message" },
        ],
        [
          "Align both to the same value. Recommended: set OTP_EXPIRY_MINUTES = 10 in the service and pass it to the SMS template:",
          { code: "SMS_MESSAGES.otp(otpCode, OtpService.OTP_EXPIRY_MINUTES)" },
        ]
      ),
      ...issueCard(6, 'MED', 'School-Specific Strings Hardcoded in communication.messages.ts',
        'server/src/config/communication.messages.ts',
        [
          "The following are hardcoded with no env-var or DB override:",
          { code: "'noreply@zawadijunioracademy.co.ke'" },
          { code: "'+254713612141'" },
          { code: "'zawadijrn.vercel.app'" },
          { code: "displayName: 'Zawadi SMS Academy'" },
        ],
        ["Pull these values from the School DB record or CommunicationConfig at runtime. Add BRAND_DISPLAY_NAME, BRAND_EMAIL, and BRAND_PHONE to env-validator.ts as optional vars with DB fallback."]
      ),

      h2("3.4  Low-Priority Issues"),
      ...issueCard(20, 'LOW', 'schoolId Passed to Frontend API Functions but Silently Ignored',
        'src/services/api.js  |  CommunicationSettings.jsx',
        [
          "communicationAPI.getConfig(sid) drops the sid argument. communicationAPI.sendTestSMS({ schoolId, ... }) includes it in the body but the backend ignores it. The system is correctly single-tenant — the argument is noise.",
        ],
        ["Remove schoolId from all communication API call sites and from the backend controller body schemas. Reduces confusion for future readers."]
      ),
      ...issueCard(8, 'LOW', '/broadcasts/stats/:schoolId Has a Dead Param',
        'server/src/routes/broadcast.routes.ts',
        [
          "The route is GET /stats/:schoolId but getBroadcastStats never reads req.params.schoolId. The latest migration confirms single-tenant architecture.",
        ],
        ["Change to GET /stats, remove the param, update the frontend call."]
      ),
      ...issueCard(21, 'LOW', 'Duplicate clearAllConfigCache() Method',
        'server/src/services/sms.service.ts',
        [
          "clearAllConfigCache() is identical to clearConfigCache() — both null cachedConfig. clearAllConfigCache is never called.",
        ],
        ["Remove the method. If multi-scope cache clearing is ever needed, differentiate the implementations at that point."]
      ),
      ...issueCard(22, 'LOW', 'Bulk WhatsApp Delay Is a Magic Number',
        'server/src/services/whatsapp.service.ts  (sendBulkAssessmentNotifications)',
        [
          "A 2.5-second inter-message delay is hardcoded with no comment explaining why.",
          { code: "await new Promise(resolve => setTimeout(resolve, 2500));" },
          "For a class of 40 this means a 100-second blocking operation.",
        ],
        [
          "Extract to a named constant:",
          { code: "/** WhatsApp Web requires ~2s between messages to avoid being rate-limited */\nconst WA_INTER_MESSAGE_DELAY_MS = 2500;" },
        ]
      ),
      ...issueCard(23, 'LOW', 'Announcement Loop Delay Misaligned with Bulk Send',
        'server/src/controllers/notification.controller.ts  (sendAnnouncement)',
        [
          "The announcement loop waits only 100 ms between messages, far below the 2.5 s used in the bulk send and almost certainly too fast for WhatsApp Web.",
          { code: "await new Promise(resolve => setTimeout(resolve, 100));" },
        ],
        ["Align to WA_INTER_MESSAGE_DELAY_MS (see issue #22)."]
      ),
      ...issueCard(9, 'LOW', 'Duplicate localStorage.removeItem("user") in 401 Handler',
        'src/services/axiosConfig.js',
        [
          "Two consecutive identical calls appear in the token-refresh-failed branch.",
          { code: "localStorage.removeItem('user');\nlocalStorage.removeItem('user');  // duplicate" },
        ],
        ["Remove the second call."]
      ),
      ...issueCard(10, 'LOW', 'School Name Hardcoded in WhatsApp Test Message',
        'server/src/controllers/notification.controller.ts  (testWhatsApp)',
        [
          { code: "'This is a test message from Zawadi JRN Academy...'" },
          "Test messages from any other school will incorrectly identify the sender.",
        ],
        ["Use a generic message or fetch the school name from the DB at send time."]
      ),

      // ── 4. What Is Working ──
      new Paragraph({ children: [new PageBreak()] }),
      h1("4. What Is Working Correctly"),
      p("The following areas are correctly implemented and require no changes:"),
      spacer(80),
      bullet([{ text: "Provider routing  ", bold: true }, "— sms.service.ts cleanly switches between Africa's Talking and MobileSasa. Easy to extend with new providers."]),
      bullet([{ text: "Phone normalisation  ", bold: true }, "— Consistent between frontend (phoneFormatter.js) and backend (sms.service.ts). Both handle 07xx, +254, and 254 formats correctly for Kenyan numbers."]),
      bullet([{ text: "API key encryption  ", bold: true }, "— AES-256-GCM with random IV and auth tag. Keys encrypted before DB write, decrypted only at send time."]),
      bullet([{ text: "Config cache invalidation  ", bold: true }, "— clearConfigCache() called correctly after every config save. Cache is never stale."]),
      bullet([{ text: "API wiring  ", bold: true }, "— communicationAPI and broadcastAPI in api.js are correctly mapped to backend routes. Axios interceptors handle token refresh cleanly."]),
      bullet([{ text: "Route-level security  ", bold: true }, "— All send endpoints require authenticate + requireSchoolContext + requirePermission. No communication endpoint is publicly accessible."]),
      bullet([{ text: "Startup validation  ", bold: true }, "— env-validator.ts gates startup on required vars (pending addition of ENCRYPTION_KEY, issue #12)."]),
      bullet([{ text: "OTP flow logic  ", bold: true }, "— Generate, store, verify, expire, and clear are all correct. Cooldown prevents spam."]),
      bullet([{ text: "WhatsApp service architecture  ", bold: true }, "— Lazy initialisation, QR code event handling, and connection state machine are sound. Sends are correctly gated behind isReady."]),
      bullet([{ text: "Audit log deduplication  ", bold: true }, "— The priority scoring (assessment audit > broadcast recipient > delivery log) is well-reasoned. The data model is the issue, not the dedup logic."]),
      spacer(300),

      // ── 5. Appendix ──
      new Paragraph({ children: [new PageBreak()] }),
      h1("5. Appendix: File Reference"),
      spacer(80),
      h3("Backend"),
      bullet([mono('server/src/services/sms.service.ts'), ' — core SMS dispatch, provider routing, phone formatting, config cache']),
      bullet([mono('server/src/services/whatsapp.service.ts'), ' — WhatsApp Web client, message formatting, bulk send']),
      bullet([mono('server/src/services/otp.service.ts'), ' — OTP generate / verify / cooldown']),
      bullet([mono('server/src/controllers/communication.controller.ts'), ' — SMS/email config CRUD, test send, birthdays, contact groups']),
      bullet([mono('server/src/controllers/broadcast.controller.ts'), ' — campaign save, history, stats, delete']),
      bullet([mono('server/src/controllers/notification.controller.ts'), ' — WhatsApp/SMS notification send, audit log aggregation']),
      bullet([mono('server/src/controllers/otp.controller.ts'), ' — OTP HTTP endpoints']),
      bullet([mono('server/src/controllers/whatsapp-status.controller.ts'), ' — WhatsApp QR / status endpoints']),
      bullet([mono('server/src/routes/communication.routes.ts'), ' — /api/communication/* routes']),
      bullet([mono('server/src/routes/broadcast.routes.ts'), ' — /api/broadcasts/* routes']),
      bullet([mono('server/src/routes/notification.routes.ts'), ' — /api/notifications/* routes']),
      bullet([mono('server/src/config/communication.messages.ts'), ' — SMS/email templates, brand constants']),
      bullet([mono('server/src/config/env-validator.ts'), ' — startup env validation']),
      bullet([mono('server/src/middleware/enhanced-rateLimit.middleware.ts'), ' — in-memory rate limiter']),
      bullet([mono('server/src/utils/encryption.util.ts'), ' — AES-256-GCM encrypt/decrypt']),
      bullet([mono('server/src/server.ts'), ' — Express app setup']),
      spacer(80),
      h3("Frontend"),
      bullet([mono('src/services/api.js'), ' — communicationAPI and broadcastAPI']),
      bullet([mono('src/services/axiosConfig.js'), ' — base URL, JWT headers, token refresh']),
      bullet([mono('src/constants/communicationMessages.js'), ' — COMMUNICATION_DEFAULTS, TEST_MESSAGES, BRAND']),
      bullet([mono('src/components/CBCGrading/pages/BroadcastMessagesPage.jsx'), ' — broadcast campaign UI']),
      bullet([mono('src/components/CBCGrading/pages/settings/CommunicationSettings.jsx'), ' — SMS/email config settings UI']),
      bullet([mono('src/components/CBCGrading/pages/MessageHistoryPage.jsx'), ' — audit log viewer']),
      spacer(200),
      p([{ text: "End of Report", bold: true, color: GRAY }], { alignment: AlignmentType.CENTER }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  const outPath = require('path').join(__dirname, 'CODE_AUDIT_REPORT.docx');
  fs.writeFileSync(outPath, buf);
  console.log('Written to:', outPath);
  console.log('Done — you can delete this file (_gen_report.js).');
});
