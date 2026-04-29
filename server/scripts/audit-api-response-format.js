#!/usr/bin/env node
/**
 * API response format audit (backend)
 *
 * Goal:
 * - Flag controller responses that do not include a top-level `success` field.
 * - Provide a lightweight consistency report without failing by default.
 *
 * Usage:
 *   node scripts/audit-api-response-format.js
 *   node scripts/audit-api-response-format.js --fail-on-findings
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTROLLERS_DIR = path.join(ROOT, 'src', 'controllers');
const OUT_FILE = path.join(ROOT, 'tmp', 'response-audit.json');
const failOnFindings = process.argv.includes('--fail-on-findings');

function walkTsFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkTsFiles(full, files);
    if (entry.isFile() && entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function getLineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  const re = /res\.(?:status\([^)]*\)\.)?json\(([\s\S]*?)\)\s*;?/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const payload = (match[1] || '').trim();
    if (!payload.startsWith('{')) continue;
    if (/success\s*:/.test(payload)) continue;

    findings.push({
      file: filePath.replace(/\\/g, '/'),
      line: getLineNumber(content, match.index),
      snippet: payload.replace(/\s+/g, ' ').slice(0, 220),
    });
  }
  return findings;
}

function main() {
  const files = walkTsFiles(CONTROLLERS_DIR);
  const findings = files.flatMap(auditFile);

  const report = {
    generatedAt: new Date().toISOString(),
    scannedControllers: files.length,
    findingsCount: findings.length,
    findings,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), 'utf8');

  console.log(
    `[api-response-audit] scannedControllers=${report.scannedControllers} findings=${report.findingsCount}`
  );
  if (findings.length) {
    console.log('Findings written to tmp/response-audit.json');
  } else {
    console.log('No response-format findings detected.');
  }

  process.exit(failOnFindings && findings.length ? 1 : 0);
}

main();
