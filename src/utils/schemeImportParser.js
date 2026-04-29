import ExcelJS from 'exceljs';

const HEADER_ALIASES = {
  weekNumber: ['week', 'wk', 'week number', 'week no', 'lesson'],
  strand: ['strand', 'topic'],
  subStrand: ['sub strand', 'sub-strand', 'substrand', 'sub topic', 'sub-topic'],
  outcomes: ['specific learning outcomes', 'learning outcomes', 'outcomes', 'slo'],
  inquiryQuestions: ['key inquiry questions', 'inquiry questions', 'key questions', 'questions'],
  activities: ['learning experiences', 'activities', 'learner activity'],
  coreCompetencies: ['core competencies', 'competencies'],
  values: ['values', 'values/pci', 'values and pci'],
  pertinentIssues: ['pci', 'pertinent issues', 'pertinent and contemporary issues', 'issues'],
  resources: ['resources', 'learning resources', 'teaching resources'],
  assessment: ['assessment', 'evaluation'],
  remarks: ['remarks', 'reflection', 'comments'],
};

const EMPTY_WEEK = (index) => ({
  weekNumber: index + 1,
  strand: '',
  subStrand: '',
  outcomes: '',
  inquiryQuestions: '',
  activities: '',
  coreCompetencies: '',
  values: '',
  pertinentIssues: '',
  resources: '',
  assessment: '',
  remarks: '',
});

const normalize = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const findFieldForHeader = (header) => {
  const normalized = normalize(header);
  const entry = Object.entries(HEADER_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => normalized.includes(alias))
  );
  return entry?.[0] || null;
};

const parseCellText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && value.text) return String(value.text).trim();
  return String(value).trim();
};

const toWeekNumber = (value, fallback) => {
  const text = parseCellText(value);
  const matched = text.match(/\d+/);
  const n = matched ? Number(matched[0]) : Number(text);
  if (Number.isFinite(n) && n > 0) return n;
  return fallback;
};

export const parseExcelScheme = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { rows: [], previewRows: [], rawText: '', warning: 'No worksheet found.' };
  }

  const rows = [];
  worksheet.eachRow((row) => {
    const values = [];
    row.eachCell({ includeEmpty: true }, (cell) => values.push(parseCellText(cell.value)));
    rows.push(values);
  });

  const firstDataRowIndex = rows.findIndex((r) => r.some((c) => c));
  if (firstDataRowIndex < 0) {
    return { rows: [], previewRows: [], rawText: '', warning: 'The selected sheet is empty.' };
  }

  const headerRow = rows[firstDataRowIndex];
  const fieldMap = headerRow.map((header) => findFieldForHeader(header));
  const mappedFieldCount = fieldMap.filter(Boolean).length;
  const structuredRows = [];

  if (mappedFieldCount >= 3) {
    for (let i = firstDataRowIndex + 1; i < rows.length; i += 1) {
      const current = rows[i];
      if (!current.some((cell) => cell)) continue;
      const week = EMPTY_WEEK(structuredRows.length);
      for (let col = 0; col < fieldMap.length; col += 1) {
        const field = fieldMap[col];
        if (!field) continue;
        week[field] = current[col] || '';
      }
      week.weekNumber = toWeekNumber(week.weekNumber, structuredRows.length + 1);
      structuredRows.push(week);
    }
  }

  return {
    rows: structuredRows,
    previewRows: rows.slice(firstDataRowIndex, firstDataRowIndex + 8),
    rawText: rows
      .slice(firstDataRowIndex, firstDataRowIndex + 30)
      .map((r) => r.filter(Boolean).join(' | '))
      .join('\n'),
    warning:
      mappedFieldCount < 3
        ? 'Could not confidently map Excel headers. Preview loaded; you can still paste or edit manually.'
        : '',
  };
};

export const parseDocxSchemeText = async (file) => {
	const mammothModule = "mammoth";
	const mammoth = await import(/* @vite-ignore */ mammothModule);
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result.value || '').trim();
};

export const parsePdfSchemeText = async (file) => {
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist/build/pdf.worker.min.mjs';
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  let text = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str || '').join(' ');
    text += `\n\n--- Page ${pageNum} ---\n${pageText}`;
  }
  return text.trim();
};

export const buildWeeksFromUnstructuredText = (rawText, minimumWeeks = 14) => {
  const text = String(rawText || '').trim();
  if (!text) return Array.from({ length: minimumWeeks }, (_, i) => EMPTY_WEEK(i));

  const chunks = text.split(/(?:^|\n)\s*week\s*\d+[:\-\s]*/gim).filter(Boolean);
  const hasWeekMarkers = /week\s*\d+/i.test(text) && chunks.length > 0;

  const generated = hasWeekMarkers
    ? chunks.map((chunk, idx) => ({
        ...EMPTY_WEEK(idx),
        weekNumber: idx + 1,
        outcomes: chunk.trim().slice(0, 1200),
      }))
    : [{ ...EMPTY_WEEK(0), weekNumber: 1, remarks: text.slice(0, 2500) }];

  while (generated.length < minimumWeeks) {
    generated.push(EMPTY_WEEK(generated.length));
  }

  return generated;
};
