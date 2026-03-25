const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const apiFile = path.join(cwd, 'src/services/api.js');
const source = fs.readFileSync(apiFile, 'utf8');

const apiDir = path.join(cwd, 'src/services/api');
if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir);

let coreContent = source.substring(0, source.indexOf('// ============================================'));
coreContent = coreContent.replace('export { API_BASE_URL };', 'export { API_BASE_URL, fetchWithAuth, fetchCached };');
fs.writeFileSync(path.join(apiDir, 'core.js'), coreContent);

const regex = /export const (\w+)API = \{([\s\S]*?)\n\};/g;
let match;
const domains = [];

while ((match = regex.exec(source)) !== null) {
  const domainName = match[1];
  const domainLower = domainName.toLowerCase();
  const content = match[2];
  
  const block = `import { fetchWithAuth, fetchCached } from './core';\nimport axiosInstance from '../axiosConfig';\n\nexport const ${domainName}API = {${content}\n};\n`;
  
  fs.writeFileSync(path.join(apiDir, `${domainLower}.api.js`), block);
  domains.push({ name: `${domainName}API`, file: `${domainLower}.api` });
}

let newApiJs = `import { API_BASE_URL, clearApiCache } from './api/core';\n\n`;
domains.forEach(d => {
  newApiJs += `import { ${d.name} } from './api/${d.file}';\n`;
});

// also add planner since it was inline
newApiJs += `\nimport { plannerAPI } from './api/planner.api';\n\n`;

newApiJs += `export { API_BASE_URL, clearApiCache };\n\n`;
domains.forEach(d => {
  newApiJs += `export { ${d.name} };\n`;
});
newApiJs += `export { plannerAPI as planner };\n\n`;

newApiJs += `const api = {\n`;
domains.forEach(d => {
  let key = d.name.replace('API', '');
  if (key === 'user') key = 'users';
  if (key === 'class') key = 'classes';
  if (key === 'report') key = 'reports';
  if (key === 'parent') key = 'parents';
  if (key === 'teacher') key = 'teachers';
  if (key === 'learner') key = 'learners';
  if (key === 'assessment') key = 'assessments';
  if (key === 'subjectAssignment') key = 'subjectAssignments';
  if (key === 'document') key = 'documents';
  if (key === 'broadcast') key = 'broadcasts';
  if (key === 'book') key = 'books';
  if (key === 'schemeOfWork') key = 'schemesOfWork';
  newApiJs += `  ${key}: ${d.name},\n`;
});
newApiJs += `  planner: plannerAPI\n};\n\nexport default api;\n`;

fs.writeFileSync(path.join(cwd, 'src/services/api_new.js'), newApiJs);

// Extract planner manually
const plannerRegex = /planner: \{([\s\S]*?)\n  \},/g;
const pMatch = plannerRegex.exec(source);
if (pMatch) {
  const pBlock = `import { fetchWithAuth, fetchCached } from './core';\n\nexport const plannerAPI = {${pMatch[1]}\n};\n`;
  fs.writeFileSync(path.join(apiDir, `planner.api.js`), pBlock);
}

console.log('Split completed successfully');
