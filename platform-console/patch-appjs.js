#!/usr/bin/env node
/**
 * patch-appjs.js
 * One-shot cleanup for app.js:
 *
 *  1. Priority stars  ★★☆  →  Low / Med / High text badges
 *  2. Activity emoji  📅   →  removed (CSS handles icon via ::before)
 *  3. Students emoji  👤   →  removed (CSS handles icon via ::before)
 *  4. Edit symbol     ✎    →  "Edit" text
 *  5. Duplicate renderEverything() definition  →  removed (first/incomplete one)
 *  6. Duplicate init() call  →  removed (the first premature one)
 *
 * Run:  node patch-appjs.js
 * Safe: writes app.js.bak before touching anything.
 */

'use strict';
const fs   = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'app.js');

if (!fs.existsSync(FILE)) {
  console.error('✗  app.js not found in', __dirname);
  process.exit(1);
}

let src      = fs.readFileSync(FILE, 'utf8');
const backup = src;
let applied  = 0;

/* ── helper ──────────────────────────────────────────────────────────── */
function patch(label, find, replace) {
  if (!src.includes(find)) {
    console.warn('  ⚠  skip (not found):', label);
    return;
  }
  // Guard against accidental double-application
  if (replace && src.includes(replace) && !src.includes(find)) {
    console.log('  ✓  already applied:', label);
    return;
  }
  src = src.split(find).join(replace);   // replace ALL occurrences
  applied++;
  console.log('  ✓ ', label);
}

console.log('\nPatching app.js …\n');

/* ── 1. Priority: swap unicode stars for text labels ─────────────────
   Old JS:  const prioStars = '★'.repeat(lead.priority) + '☆'.repeat(3 - lead.priority);
   Old HTML: ${prioStars}  inside  <span class="k-priority p${lead.priority}">
*/
patch(
  'Priority star variables',
  "const prioStars = '★'.repeat(lead.priority) + '☆'.repeat(3 - lead.priority);",
  "const PRIO_LABEL = { '1': 'Low', '2': 'Med', '3': 'High' };"
);
patch(
  'Priority star span content',
  '<span class="k-priority p${lead.priority}">${prioStars}</span>',
  '<span class="k-priority p${lead.priority}">${PRIO_LABEL[lead.priority] ?? \'Low\'}</span>'
);

/* ── 2. Activity: strip 📅 emoji ─────────────────────────────────────
   Old:  <span class="k-activity" title="Next Activity">📅 ${esc(lead.nextActivity …
   New:  <span class="k-activity">${esc(lead.nextActivity …
   (CSS .k-activity::before provides the visual cue)
*/
patch(
  'Strip 📅 from activity span',
  '<span class="k-activity" title="Next Activity">📅 ${esc(lead.nextActivity || \'No planned activity\')}</span>',
  '<span class="k-activity">${esc(lead.nextActivity || \'No planned activity\')}</span>'
);

/* ── 3. Students: strip 👤 emoji ─────────────────────────────────────
   Old:  <span class="k-students">👤 ${lead.students}</span>
   New:  <span class="k-students">${lead.students}</span>
   (CSS .k-students::before provides the visual cue)
*/
patch(
  'Strip 👤 from students span',
  '<span class="k-students">👤 ${lead.students}</span>',
  '<span class="k-students">${lead.students}</span>'
);

/* ── 4. Edit button: ✎ → "Edit" text ────────────────────────────────
   ✎ (U+270E) renders as a wrench/box on many Windows fonts.
   Plain "Edit" text is bulletproof and matches the button CSS.
*/
patch(
  'Edit button: ✎ → "Edit" text',
  '<button class="k-card-edit" onclick="openLeadModal(null, \'${lead.id}\')">✎</button>',
  '<button class="k-card-edit" onclick="openLeadModal(null, \'${lead.id}\')" title="Edit lead">Edit</button>'
);

/* ── 5 & 6. Duplicate renderEverything + double init() ───────────────
   The file currently has:
     [A] function renderEverything() { … no pipeline … }  ← incomplete
         async function init() { … }
         init();                                          ← first call
     [B] function renderEverything() { … with pipeline … } ← correct
         init();                                          ← second call

   Fix: remove block [A]'s renderEverything and its paired init() call.
   We target the exact body of the incomplete version.
*/

const INCOMPLETE_RENDER = `function renderEverything() {
  renderMetrics();
  renderInstances();
  renderRunningInstances();
  renderCapacity();
  renderTimeline('timeline-mini', 3);
  renderTimeline('timeline-full');
  renderStorageSection();
  renderSpaceUsage();
  renderAuditLog();
  renderControlInstances();
  renderModuleToggles();
  renderPricingPlans();
}`;

// We also want to remove the init() call that sits between the
// async init function body and the correct renderEverything below.
// That boundary looks like:   }          (closes async init)
//                             \ninit();
//                             \nfunction renderEverything() {
//                               … the CORRECT version with pipeline
const FIRST_INIT_CALL_BEFORE_CORRECT_RENDER = `\ninit();\nfunction renderEverything() {
  renderMetrics();
  renderInstances();
  renderRunningInstances();
  renderCapacity();
  renderTimeline('timeline-mini', 3);
  renderTimeline('timeline-full');
  renderStorageSection();
  renderSpaceUsage();
  renderAuditLog();
  renderControlInstances();
  renderModuleToggles();
  renderPricingPlans();
  if(typeof renderPipeline === 'function') renderPipeline();
  if(typeof renderLeadsList === 'function') renderLeadsList();
}`;

const CORRECT_RENDER_ONLY = `\nfunction renderEverything() {
  renderMetrics();
  renderInstances();
  renderRunningInstances();
  renderCapacity();
  renderTimeline('timeline-mini', 3);
  renderTimeline('timeline-full');
  renderStorageSection();
  renderSpaceUsage();
  renderAuditLog();
  renderControlInstances();
  renderModuleToggles();
  renderPricingPlans();
  if(typeof renderPipeline === 'function') renderPipeline();
  if(typeof renderLeadsList === 'function') renderLeadsList();
}`;

patch(
  'Remove incomplete renderEverything definition',
  INCOMPLETE_RENDER,
  '/* renderEverything — see complete definition below */'
);

patch(
  'Remove premature init() call before correct renderEverything',
  FIRST_INIT_CALL_BEFORE_CORRECT_RENDER,
  CORRECT_RENDER_ONLY
);

/* ── Write ────────────────────────────────────────────────────────── */
if (applied === 0) {
  console.log('\n⚠  Nothing changed — app.js may already be patched.\n');
  process.exit(0);
}

fs.writeFileSync(FILE + '.bak', backup, 'utf8');
console.log('\n  backup  →  app.js.bak');

fs.writeFileSync(FILE, src, 'utf8');
console.log(`  patched →  app.js  (${applied} change${applied === 1 ? '' : 's'})\n`);
console.log('Done. Refresh localhost:3100 to see the result.\n');
