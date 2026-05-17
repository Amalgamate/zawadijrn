// Run: node patch-kanban-css.js
// Adds kanban-crm.css link to index.html (once only)
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const newLink = '<link rel="stylesheet" href="./kanban-crm.css"/>';
const marker  = '<link rel="stylesheet" href="./login.css"/>';

if (html.includes(newLink)) {
  console.log('✓ kanban-crm.css already linked — nothing to do.');
  process.exit(0);
}

if (!html.includes(marker)) {
  console.error('✗ Could not find login.css link in index.html. Patch aborted.');
  process.exit(1);
}

html = html.replace(marker, marker + '\n' + newLink);
fs.writeFileSync(htmlPath, html, 'utf8');
console.log('✓ Patched index.html — kanban-crm.css linked after login.css');
