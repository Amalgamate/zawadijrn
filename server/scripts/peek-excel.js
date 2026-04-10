const ExcelJS = require('exceljs');
const path = require('path');

async function readHeaders() {
  const filePath = path.join('c:', 'Amalgamate', 'Projects', 'Zawadi SMS', 'data', 'Fee Collection Score - Term 1  2026 (04-08-2026).xlsx');
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    const row = worksheet.getRow(1);
    console.log('Headers:', row.values.slice(1));
    const firstRow = worksheet.getRow(2);
    console.log('Sample Data:', firstRow.values.slice(1));
  } catch (err) {
    console.error('Error reading excel file', err);
  }
}
readHeaders();
