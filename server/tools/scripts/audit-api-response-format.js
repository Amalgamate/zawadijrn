const fs = require('fs');
const path = require('path');

const controllersRoot = path.join(process.cwd(), 'src', 'controllers');
const outputPath = path.join(process.cwd(), 'response-audit.json');
const failOnFindings = process.argv.includes('--fail-on-findings');

const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    if (entry.isFile() && fullPath.endsWith('.ts')) files.push(fullPath);
  }
}

function run() {
  walk(controllersRoot);

  const findings = [];
  const regex = /res\s*\.\s*(?:status\([^\)]*\)\s*\.\s*)?json\s*\(([^]*?)\)\s*;/g;

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    let match;

    while ((match = regex.exec(source)) !== null) {
      const body = match[1] || '';
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      const hasSuccess = /\bsuccess\s*:/.test(body);

      if (!hasSuccess) {
        findings.push({
          file: file.replace(/\\/g, '/'),
          line,
          snippet: body.replace(/\s+/g, ' ').trim().slice(0, 180)
        });
      }
    }
  }

  fs.writeFileSync(outputPath, JSON.stringify(findings, null, 2));

  const grouped = findings.reduce((acc, item) => {
    acc[item.file] = (acc[item.file] || 0) + 1;
    return acc;
  }, {});

  const topFiles = Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log('controllers_scanned', files.length);
  console.log('noncanonical_json_responses', findings.length);
  console.log('audit_report', outputPath);
  console.log('top_files', topFiles);

  if (failOnFindings && findings.length > 0) {
    process.exit(1);
  }
}

run();
