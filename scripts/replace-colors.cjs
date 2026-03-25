const fs = require('fs');
const path = require('path');

const directory = 'src';
const searchHex1 = /#520050/gi;
const searchHex2 = /#5D0057/gi;
const replacement = 'var(--brand-purple)';

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (searchHex1.test(content) || searchHex2.test(content)) {
        console.log(`Updating ${fullPath}`);
        content = content.replace(searchHex1, replacement).replace(searchHex2, replacement);
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

walk(directory);
console.log('Done!');
