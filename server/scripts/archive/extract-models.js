const fs = require('fs');
const path = require('path');

// Read schema file
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Extract all model names
const modelMatches = schemaContent.match(/^model\s+(\w+)\s*{/gm);
const models = modelMatches.map(m => m.replace(/^model\s+/, '').replace(/\s*{$/, '')).sort();

console.log('=== PRISMA SCHEMA MODELS ===\n');
models.forEach((m, idx) => {
  console.log(`${idx + 1}. ${m}`);
});
console.log(`\nTotal: ${models.length} models\n`);

// Mapping of Prisma models to DB table names
const prismaToTable = {};
models.forEach(model => {
  // Look for @@map directive
  const regex = new RegExp(`model\\s+${model}\\s*{[^}]*@@map\\("([^"]+)"\\)`, 's');
  const match = schemaContent.match(regex);
  if (match) {
    prismaToTable[model] = match[1];
  } else {
    // Convert camelCase to snake_case and pluralize
    const snake = model
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    prismaToTable[model] = snake + 's';
  }
});

console.log('=== MODEL TO TABLE MAPPING ===\n');
models.forEach(model => {
  console.log(`${model.padEnd(30)} → ${prismaToTable[model]}`);
});
