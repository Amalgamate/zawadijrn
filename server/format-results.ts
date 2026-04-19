import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch-results.json', 'utf-8'));

console.log('=== STEP 1: Top 15 Tables by Size ===');
console.table(data.tables.slice(0, 15).map((t: any) => ({
  Table: t.table_name,
  Rows: t.row_count
})));

console.log('\n=== STEP 2: Existing Indexes (Filter by target) ===');
const targetTables = ['learners', 'fee_invoices', 'fee_payments', 'users', 'formative_assessments', 'summative_results', 'attendances', 'formative_assessment_rubrics'];
const existingIndexes = data.indexes.filter((i: any) => targetTables.includes(i.tablename)).map((i: any) => i.indexname);
console.log(existingIndexes.join('\n'));

console.log('\n=== STEP 3: Slow Queries ===');
if (typeof data.slowQueries === 'string') {
  console.log(data.slowQueries);
} else {
  console.log(JSON.stringify(data.slowQueries.slice(0, 5), null, 2));
}

console.log('\n=== STEP 4: Table Index Health (Top Seq Scans) ===');
console.table(data.indexHealth.slice(0, 15).map((h: any) => ({
  Table: h.table_name,
  SeqScan: h.seq_scan,
  IdxScan: h.idx_scan
})));
