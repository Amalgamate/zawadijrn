// Trends CORE Control Panel demo shell.
// This file keeps the current console interactive while the real control API is
// still being built. No Docker or billing action is executed from this demo UI.

// Demo data
const INSTANCES = [
  {
    name: 'Trends CORE Main',
    domain: 'core.elimucrown.co.ke',
    status: 'Online',
    type: 'PRIMARY_CBC',
    typeLabel: 'Junior CBC',
    created: '2026-04-27',
    version: '91a4982',
    fe: 3000,
    be: 5000,
    db: 'trends_core_main',
    storage: 2.1,
    dbGb: 0.42,
    uploads: 1.2,
    backups: 0.48,
    containers: 3,
    planId: 'professional',
    billingCycle: 'Monthly',
    nextRenewal: '2026-05-29',
    billingStatus: 'Active',
  },
  {
    name: 'School B',
    domain: 'schoolb.elimucrown.co.ke',
    status: 'Online',
    type: 'SECONDARY',
    typeLabel: 'Senior CBC',
    created: '2026-04-28',
    version: '91a4982',
    fe: 3001,
    be: 5001,
    db: 'trends_core_school_b',
    storage: 1.3,
    dbGb: 0.18,
    uploads: 0.61,
    backups: 0.51,
    containers: 3,
    planId: 'standard',
    billingCycle: 'Termly',
    nextRenewal: '2026-06-12',
    billingStatus: 'Active',
  },
  {
    name: 'School C',
    domain: 'schoolc.elimucrown.co.ke',
    status: 'Degraded',
    type: 'TERTIARY',
    typeLabel: 'Tertiary',
    created: '2026-04-28',
    version: '91a4982',
    fe: 3002,
    be: 5002,
    db: 'trends_core_school_c',
    storage: 1.6,
    dbGb: 0.21,
    uploads: 0.76,
    backups: 0.63,
    containers: 2,
    planId: 'starter',
    billingCycle: 'Monthly',
    nextRenewal: '2026-05-08',
    billingStatus: 'Due Soon',
  },
];

const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Entry',
    monthly: 8000,
    termly: 22000,
    annual: 84000,
    maxStudents: '250',
    storageLimit: '5 GB',
    status: 'active',
    featured: false,
    features: ['Core school setup', 'Learner records', 'Basic fee tracking', 'Attendance', 'Email support'],
  },
  {
    id: 'standard',
    name: 'Standard',
    badge: 'Core',
    monthly: 14000,
    termly: 38000,
    annual: 145000,
    maxStudents: '600',
    storageLimit: '12 GB',
    status: 'active',
    featured: false,
    features: ['Core school setup', 'Learner records', 'Fee tracking', 'Attendance', 'Assessments', 'Parent portal', 'SMS notifications'],
  },
  {
    id: 'professional',
    name: 'Professional',
    badge: 'Most Popular',
    monthly: 25000,
    termly: 68000,
    annual: 260000,
    maxStudents: '1,500',
    storageLimit: '30 GB',
    status: 'active',
    featured: true,
    features: ['Everything in Standard', 'Advanced dashboards', 'Inventory', 'HR overview', 'Custom domain', 'Priority support', 'Audit logs'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Scale',
    monthly: 45000,
    termly: 125000,
    annual: 480000,
    maxStudents: 'Unlimited',
    storageLimit: 'Custom',
    status: 'draft',
    featured: false,
    features: ['Everything in Professional', 'Multi-campus reporting', 'Dedicated onboarding', 'Custom storage', 'SLA support', 'API access'],
  },
];

const PLATFORM_MODULES = [
  { id: 'admissions', name: 'Admissions', desc: 'Student registration and enrollment', enabled: true },
  { id: 'fees', name: 'Fees & Billing', desc: 'Invoices, balances and payments', enabled: true },
  { id: 'attendance', name: 'Attendance', desc: 'Daily attendance tracking', enabled: true },
  { id: 'assessments', name: 'Assessments', desc: 'CBC assessment workflows', enabled: true },
  { id: 'inventory', name: 'Inventory', desc: 'Stock and asset records', enabled: true },
  { id: 'hr', name: 'HR Overview', desc: 'Staff and payroll overview', enabled: false },
  { id: 'ai', name: 'AI Smart Insights', desc: 'Automated school insights', enabled: true },
];

const DEPLOYMENTS = [
  { time: '10:47 EAT', title: 'Trends CORE v1 - initial release', copy: 'Frontend + backend images published, all live instances redeployed.' },
  { time: '10:36 EAT', title: 'Health check retries enabled', copy: 'Deploy script now waits for services to warm up before failing.' },
  { time: '10:20 EAT', title: 'All instances moved to GHCR images', copy: 'Main, School B, and School C use the shared latest images.' },
  { time: '09:55 EAT', title: 'Institution setup wizard shipped', copy: 'After factory reset, super admin is redirected to institution picker.' },
  { time: '09:30 EAT', title: 'Core apps auto-activation on lock', copy: 'PRIMARY_CBC, SECONDARY, TERTIARY each activate 9 core modules on confirm.' },
];

const AUDIT_LOGS = [
  { time: '10:47 EAT', action: 'Redeploy', instance: 'All Instances', by: 'system@elimucrown.co.ke', details: 'Latest GHCR images deployed', status: 'Success' },
  { time: '10:36 EAT', action: 'Config Update', instance: 'Trends CORE Main', by: 'admin@elimucrown.co.ke', details: 'Health retry window changed', status: 'Success' },
  { time: '10:20 EAT', action: 'Image Pull', instance: 'School B', by: 'system@elimucrown.co.ke', details: 'Frontend and backend image pull', status: 'Success' },
  { time: '09:55 EAT', action: 'Restart', instance: 'School C', by: 'admin@elimucrown.co.ke', details: 'Manual restart after degraded check', status: 'Warning' },
];

const FEATURE_MATRIX = [
  'Core school setup',
  'Learner records',
  'Fee tracking',
  'Attendance',
  'Assessments',
  'Parent portal',
  'SMS notifications',
  'Advanced dashboards',
  'Inventory',
  'HR overview',
  'Custom domain',
  'Audit logs',
  'API access',
];

// Helpers
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char]));
const fmt = value => parseFloat(value).toFixed(1).replace(/\.0$/, '');
const money = value => new Intl.NumberFormat('en-KE').format(value);
const slugify = value => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nowLabel = () => new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) + ' EAT';
const fmtDate = value => new Intl.DateTimeFormat('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value + 'T00:00'));
const statusCls = status => status === 'Online' || status === 'Active' || status === 'Success' ? 'online' : status === 'Degraded' || status === 'Warning' || status === 'Due Soon' ? 'warn' : 'offline';
const findPlan = id => PRICING_PLANS.find(plan => plan.id === id) || PRICING_PLANS[0];

let toastTimer;
let selectedInstanceName = INSTANCES[0]?.name || '';
let pendingConfirm = null;
let editingPlanId = null;

function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function addAudit({ action, instance, details, status = 'Success' }) {
  AUDIT_LOGS.unshift({
    time: nowLabel(),
    action,
    instance,
    by: 'admin@elimucrown.co.ke',
    details,
    status,
  });
  renderAuditLog();
}

function selectedInstance() {
  return INSTANCES.find(instance => instance.name === selectedInstanceName) || INSTANCES[0];
}

// ── Running Instances panel ───────────────────────────────────────────────
function containerRows(instance) {
  const isOnline = instance.status === 'Online';
  const isDegraded = instance.status === 'Degraded';
  const containers = [
    { name: 'Frontend', port: instance.fe, status: isOnline ? 'running' : isDegraded ? 'running' : 'stopped' },
    { name: 'Backend',  port: instance.be, status: isOnline ? 'running' : 'stopped' },
    { name: 'Database', port: null,        status: isOnline ? 'running' : isDegraded ? 'running' : 'stopped' },
  ];
  if (isDegraded) containers[1].status = 'unhealthy';
  return containers;
}

function renderRunningInstances() {
  const el = $('running-instances-grid');
  if (!el) return;

  el.innerHTML = INSTANCES.map(instance => {
    const containers = containerRows(instance);
    const overallCls = instance.status === 'Online' ? 'online' : instance.status === 'Degraded' ? 'warn' : 'offline';
    const plan = findPlan(instance.planId);
    const uptime = instance.status === 'Online' ? '99.9%' : instance.status === 'Degraded' ? '71.2%' : '0%';
    const runningCount = containers.filter(c => c.status === 'running').length;

    const containerDots = containers.map(c => {
      const dot = c.status === 'running' ? 'ri-dot-green' : c.status === 'unhealthy' ? 'ri-dot-amber' : 'ri-dot-red';
      return `<span class="ri-container-dot ${dot}" title="${esc(c.name)}: ${esc(c.status)}${c.port ? ' (:' + c.port + ')' : ''}"></span>`;
    }).join('');

    const containerList = containers.map(c => {
      const sCls = c.status === 'running' ? 'online' : c.status === 'unhealthy' ? 'warn' : 'offline';
      return `<div class="ri-container-row">
        <span class="ri-c-name">${esc(c.name)}</span>
        ${c.port ? `<span class="ri-c-port">:${c.port}</span>` : '<span class="ri-c-port">—</span>'}
        <span class="badge ${sCls}" style="font-size:10px;padding:1px 6px">${esc(c.status)}</span>
      </div>`;
    }).join('');

    return `<div class="ri-card">
      <div class="ri-card-head">
        <div class="ri-card-title-row">
          <div>
            <div class="ri-name">${esc(instance.name)}</div>
            <div class="ri-domain">${esc(instance.domain)}</div>
          </div>
          <span class="badge ${overallCls}">${esc(instance.status)}</span>
        </div>
        <div class="ri-dots-row">
          ${containerDots}
          <span class="ri-dots-label">${runningCount}/${containers.length} running</span>
        </div>
      </div>
      <div class="ri-container-list">
        ${containerList}
      </div>
      <div class="ri-card-footer">
        <div class="ri-meta-row">
          <span class="ri-meta-label">Plan</span>
          <span class="ri-meta-val">${esc(plan.name)}</span>
        </div>
        <div class="ri-meta-row">
          <span class="ri-meta-label">Uptime</span>
          <span class="ri-meta-val" style="font-family:var(--mono)">${uptime}</span>
        </div>
        <div class="ri-meta-row">
          <span class="ri-meta-label">Version</span>
          <span class="ri-meta-val" style="font-family:var(--mono)">${esc(instance.version)}</span>
        </div>
        <div class="ri-actions">
          <button class="tbl-btn primary" data-action="Restart" data-school="${esc(instance.name)}">Restart</button>
          <button class="tbl-btn" data-action="Logs" data-school="${esc(instance.name)}">Logs</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ── Space & Usage panel ───────────────────────────────────────────────────
const TOTAL_DISK = 80;
const DOCKER_IMAGES_GB = 14.2;
const DOCKER_VOLUMES_GB = 22.6;

function renderSpaceUsage() {
  const el = $('space-usage-panel');
  if (!el) return;

  const totalSchoolDb = INSTANCES.reduce((s, i) => s + i.dbGb, 0);
  const totalUploads  = INSTANCES.reduce((s, i) => s + i.uploads, 0);
  const totalBackups  = INSTANCES.reduce((s, i) => s + i.backups, 0);
  const schoolData    = INSTANCES.reduce((s, i) => s + i.storage, 0);
  const appStack      = DOCKER_IMAGES_GB + DOCKER_VOLUMES_GB;
  const usedTotal     = appStack + schoolData;
  const freeSpace     = Math.max(0, TOTAL_DISK - usedTotal);
  const usedPct       = Math.round(usedTotal / TOTAL_DISK * 100);

  const segments = [
    { label: 'Docker Images', value: DOCKER_IMAGES_GB, color: '#030b82' },
    { label: 'Docker Volumes', value: DOCKER_VOLUMES_GB, color: '#0D9488' },
    { label: 'School DBs', value: totalSchoolDb, color: '#059669' },
    { label: 'Uploads', value: totalUploads, color: '#f59e0b' },
    { label: 'Backups', value: totalBackups, color: '#8b5cf6' },
    { label: 'Free', value: freeSpace, color: '#e8ebf4' },
  ];

  el.innerHTML = `
    <div class="su-summary-row">
      <div class="su-summary-stat">
        <div class="su-stat-val">${fmt(usedTotal)} <span class="su-stat-unit">GB</span></div>
        <div class="su-stat-label">Used of ${TOTAL_DISK} GB</div>
      </div>
      <div class="su-summary-stat">
        <div class="su-stat-val">${fmt(freeSpace)} <span class="su-stat-unit">GB</span></div>
        <div class="su-stat-label">Free Space</div>
      </div>
      <div class="su-summary-stat">
        <div class="su-stat-val">${usedPct}<span class="su-stat-unit">%</span></div>
        <div class="su-stat-label">Disk Utilisation</div>
      </div>
      <div class="su-summary-stat">
        <div class="su-stat-val">${fmt(schoolData)} <span class="su-stat-unit">GB</span></div>
        <div class="su-stat-label">School Data</div>
      </div>
    </div>

    <div class="su-stacked-bar">
      ${segments.filter(s => s.value > 0).map(s =>
        `<div class="su-seg" style="width:${(s.value / TOTAL_DISK * 100).toFixed(2)}%;background:${s.color}" title="${s.label}: ${fmt(s.value)} GB"></div>`
      ).join('')}
    </div>
    <div class="su-legend">
      ${segments.filter(s => s.label !== 'Free').map(s =>
        `<div class="su-legend-item">
          <span class="su-legend-dot" style="background:${s.color}"></span>
          <span class="su-legend-label">${esc(s.label)}</span>
          <span class="su-legend-val">${fmt(s.value)} GB</span>
        </div>`
      ).join('')}
    </div>

    <div class="su-breakdown-grid">
      ${segments.filter(s => s.label !== 'Free').map(s => {
        const pct = Math.round(s.value / TOTAL_DISK * 100);
        return `<div class="su-breakdown-item">
          <div class="su-b-row">
            <span class="su-b-label">${esc(s.label)}</span>
            <span class="su-b-val">${fmt(s.value)} GB</span>
          </div>
          <div class="su-meter"><div class="su-meter-fill" style="width:${pct}%;background:${s.color}"></div></div>
          <div class="su-b-pct">${pct}% of ${TOTAL_DISK} GB disk</div>
        </div>`;
      }).join('')}
    </div>

    <div class="su-per-instance-section">
      <div class="su-section-label">Per-Instance Breakdown</div>
      <div class="su-per-instance-grid">
        ${INSTANCES.map(inst => {
          const instPct = Math.round(inst.storage / TOTAL_DISK * 100);
          return `<div class="su-pi-card">
            <div class="su-pi-head">
              <span class="su-pi-name">${esc(inst.name)}</span>
              <span class="su-pi-total">${fmt(inst.storage)} GB</span>
            </div>
            <div class="su-meter" style="margin:6px 0 4px"><div class="su-meter-fill" style="width:${instPct}%;background:var(--brand)"></div></div>
            <div class="su-pi-rows">
              <div class="su-pi-row"><span>Database</span><span>${fmt(inst.dbGb)} GB</span></div>
              <div class="su-pi-row"><span>Uploads</span><span>${fmt(inst.uploads)} GB</span></div>
              <div class="su-pi-row"><span>Backups</span><span>${fmt(inst.backups)} GB</span></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// Rendering
function renderInstanceRow(instance, mode = 'compact') {
  const plan = findPlan(instance.planId);
  const extraCols = mode === 'full'
    ? `<td><span class="version-chip">${esc(instance.typeLabel)}</span></td>
       <td><span class="version-chip">${esc(plan.name)}</span></td>`
    : '';

  return `<tr>
    <td><div class="cell-school"><strong>${esc(instance.name)}</strong><div class="cell-domain">${esc(instance.domain)}</div></div></td>
    <td><span class="badge ${statusCls(instance.status)}">${esc(instance.status)}</span></td>
    ${extraCols}
    <td>${fmtDate(instance.created)}</td>
    <td><span class="version-chip">${esc(instance.version)}</span></td>
    <td><div class="port-list">FE :${instance.fe}<br>BE :${instance.be}<br>${esc(instance.db)}</div></td>
    <td>
      <strong>${fmt(instance.storage)} GB</strong><br>
      <span style="font-size:11px;color:var(--muted)">DB ${fmt(instance.dbGb)} · Up ${fmt(instance.uploads)} · Bkp ${fmt(instance.backups)}</span>
    </td>
    <td>
      <div class="action-row">
        <button class="tbl-btn primary" data-action="Restart" data-school="${esc(instance.name)}">Restart</button>
        <button class="tbl-btn" data-action="Logs" data-school="${esc(instance.name)}">Logs</button>
        <button class="tbl-btn" data-action="Redeploy" data-school="${esc(instance.name)}">Redeploy</button>
        <button class="tbl-btn danger" data-action="Stop" data-school="${esc(instance.name)}">Stop</button>
      </div>
    </td>
  </tr>`;
}

function renderInstances() {
  const overview = $('instance-table');
  if (overview) overview.innerHTML = INSTANCES.map(instance => renderInstanceRow(instance)).join('');

  const full = $('instance-table-full');
  if (full) full.innerHTML = INSTANCES.map(instance => renderInstanceRow(instance, 'full')).join('');
}

function renderMetrics() {
  const totalStorage = INSTANCES.reduce((sum, instance) => sum + instance.storage, 0);
  const healthy = INSTANCES.filter(instance => instance.status === 'Online').reduce((sum, instance) => sum + instance.containers, 0);
  const total = INSTANCES.reduce((sum, instance) => sum + instance.containers, 0);

  if ($('m-schools')) $('m-schools').textContent = INSTANCES.length;
  if ($('m-containers')) $('m-containers').textContent = `${healthy}/${total}`;
  if ($('m-storage')) $('m-storage').textContent = `${fmt(totalStorage)} GB`;
}

function renderTimeline(elId, maxItems = 99) {
  const el = $(elId);
  if (!el) return;
  el.innerHTML = DEPLOYMENTS.slice(0, maxItems).map(item => `
    <div class="tl-item">
      <div class="tl-time">${esc(item.time)}</div>
      <div class="tl-body">
        <div class="tl-title">${esc(item.title)}</div>
        <div class="tl-copy">${esc(item.copy)}</div>
      </div>
    </div>`).join('');
}

function renderCapacity() {
  const totalStorage = INSTANCES.reduce((sum, instance) => sum + instance.storage, 0);
  const items = [
    { label: 'App Stack (Docker)', used: 36.8, total: 80, color: 'brand', meta: 'Images, volumes, containers' },
    { label: 'School Data', used: totalStorage, total: 80, color: 'teal', meta: 'DB + uploads + backups across all instances' },
    { label: 'Free Space', used: 80 - 36.8 - totalStorage, total: 80, color: 'green', meta: 'Available for new instances' },
  ];
  const el = $('capacity-items');
  if (!el) return;
  el.innerHTML = items.map(item => {
    const pct = Math.round(Math.max(0, item.used) / item.total * 100);
    return `<div class="capacity-item">
      <div class="cap-row"><span class="cap-name">${esc(item.label)}</span><span class="cap-val">${fmt(item.used)} GB</span></div>
      <div class="meter"><div class="meter-fill ${item.color}" style="width:${pct}%"></div></div>
      <div class="cap-meta">${esc(item.meta)} · ${pct}% of ${item.total} GB</div>
    </div>`;
  }).join('');
}

function renderStorageSection() {
  const total = INSTANCES.reduce((sum, instance) => sum + instance.storage, 0);
  if ($('s-total')) $('s-total').textContent = fmt(total) + ' GB';

  const disk = $('disk-breakdown');
  if (disk) {
    const rows = [
      { label: 'Docker Images (OS/App)', used: 14.2, total: 80, color: 'brand' },
      { label: 'Docker Volumes', used: 22.6, total: 80, color: 'teal' },
      { label: 'School Databases', used: INSTANCES.reduce((sum, instance) => sum + instance.dbGb, 0), total: 80, color: 'green' },
      { label: 'Uploaded Files', used: INSTANCES.reduce((sum, instance) => sum + instance.uploads, 0), total: 80, color: 'amber' },
      { label: 'Backups', used: INSTANCES.reduce((sum, instance) => sum + instance.backups, 0), total: 80, color: 'brand' },
    ];
    disk.innerHTML = rows.map(row => {
      const pct = Math.round(row.used / row.total * 100);
      return `<div class="capacity-item">
        <div class="cap-row"><span class="cap-name">${esc(row.label)}</span><span class="cap-val">${fmt(row.used)} GB</span></div>
        <div class="meter"><div class="meter-fill ${row.color}" style="width:${pct}%"></div></div>
        <div class="cap-meta">${pct}% of ${row.total} GB total disk</div>
      </div>`;
    }).join('');
  }

  const perInstance = $('per-instance-storage');
  if (perInstance) {
    perInstance.innerHTML = INSTANCES.map(instance => `
      <div class="storage-item">
        <div class="sto-row"><span class="sto-name">${esc(instance.name)}</span><span class="sto-size">${fmt(instance.storage)} GB</span></div>
        <div class="sto-meta">DB ${fmt(instance.dbGb)} GB · Uploads ${fmt(instance.uploads)} GB · Backups ${fmt(instance.backups)} GB</div>
      </div>`).join('');
  }
}

function renderAuditLog() {
  const query = ($('log-search')?.value || '').trim().toLowerCase();
  const logs = query
    ? AUDIT_LOGS.filter(log => Object.values(log).join(' ').toLowerCase().includes(query))
    : AUDIT_LOGS;

  const el = $('audit-table');
  if (!el) return;
  el.innerHTML = logs.map(log => `
    <tr>
      <td style="font-family:var(--mono);font-size:11px">${esc(log.time)}</td>
      <td><strong>${esc(log.action)}</strong></td>
      <td>${esc(log.instance)}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(log.by)}</td>
      <td style="font-size:12px;color:var(--muted)">${esc(log.details || '-')}</td>
      <td><span class="badge ${statusCls(log.status)}">${esc(log.status)}</span></td>
    </tr>`).join('');
}

function renderControlInstances() {
  const tabs = $('ctrl-instance-tabs');
  if (tabs) {
    tabs.innerHTML = INSTANCES.map(instance => `
      <button class="inst-tab ${instance.name === selectedInstanceName ? 'active' : ''}" type="button" data-instance="${esc(instance.name)}">
        ${esc(instance.name)}
      </button>`).join('');
  }

  const info = $('ctrl-instance-info');
  const instance = selectedInstance();
  if (!info || !instance) return;
  const plan = findPlan(instance.planId);
  info.innerHTML = `
    <span class="ctrl-info-chip"><span class="ctrl-info-label">Status</span><span class="badge ${statusCls(instance.status)}">${esc(instance.status)}</span></span>
    <span class="ctrl-info-chip"><span class="ctrl-info-label">Domain</span>${esc(instance.domain)}</span>
    <span class="ctrl-info-chip"><span class="ctrl-info-label">Ports</span><span class="port-list">FE :${instance.fe} · BE :${instance.be}</span></span>
    <span class="ctrl-info-chip"><span class="ctrl-info-label">Plan</span>${esc(plan.name)}</span>
    <span class="ctrl-info-chip"><span class="ctrl-info-label">Storage</span>${fmt(instance.storage)} GB</span>`;
}

function renderModuleToggles() {
  const el = $('module-toggle-list');
  if (!el) return;
  el.innerHTML = PLATFORM_MODULES.map(module => `
    <div class="module-toggle-item">
      <div>
        <div class="module-toggle-name">${esc(module.name)}</div>
        <div class="module-toggle-desc">${esc(module.desc)}</div>
      </div>
      <label class="toggle-switch" title="${esc(module.name)}">
        <input type="checkbox" data-module="${esc(module.id)}" ${module.enabled ? 'checked' : ''}/>
        <span class="toggle-slider"></span>
      </label>
    </div>`).join('');
}

function renderLogs(lines = []) {
  const el = $('log-viewer');
  if (!el) return;
  if (!lines.length) {
    el.innerHTML = '<span class="log-placeholder">Select an instance and click Fetch Logs -></span>';
    return;
  }
  el.innerHTML = lines.map(line => `<span class="log-line ${esc(line.type || '')}">${esc(line.text)}</span>`).join('');
}

function renderPricingPlans() {
  const grid = $('plans-grid');
  if (grid) {
    grid.innerHTML = PRICING_PLANS.map(plan => `
      <div class="plan-card ${plan.featured ? 'featured' : ''}">
        <div class="plan-card-top">
          <div class="plan-name">${esc(plan.name)}</div>
          <span class="plan-badge">${esc(plan.badge || plan.status)}</span>
          <div class="plan-price">
            <span class="plan-price-main">KES ${money(plan.monthly)}</span>
            <span class="plan-price-period">/mo</span>
          </div>
          <div class="plan-price-alt">KES ${money(plan.termly)} termly · KES ${money(plan.annual)} annual</div>
        </div>
        <div class="plan-card-body">
          <div class="plan-limit">Up to ${esc(plan.maxStudents)} learners · ${esc(plan.storageLimit)} storage</div>
          <ul class="plan-feature-list">
            ${plan.features.slice(0, 7).map(feature => `<li>${esc(feature)}</li>`).join('')}
          </ul>
        </div>
        <div class="plan-card-footer">
          <button class="tbl-btn primary" type="button" data-plan-edit="${esc(plan.id)}">Edit</button>
          <button class="tbl-btn" type="button" data-plan-assign="${esc(plan.id)}">Assign</button>
          <span class="badge ${statusCls(plan.status === 'active' ? 'Active' : plan.status === 'draft' ? 'Warning' : 'Offline')}">
            <span class="plan-status-dot ${esc(plan.status)}"></span>${esc(plan.status)}
          </span>
        </div>
      </div>`).join('');
  }

  const assignedInstances = INSTANCES.filter(instance => instance.planId).length;
  const monthlyRevenue = INSTANCES.reduce((sum, instance) => sum + findPlan(instance.planId).monthly, 0);
  const renewalsDue = INSTANCES.filter(instance => new Date(instance.nextRenewal) <= new Date('2026-05-29T00:00:00')).length;

  if ($('p-active-plans')) $('p-active-plans').textContent = PRICING_PLANS.filter(plan => plan.status === 'active').length;
  if ($('p-assigned')) $('p-assigned').textContent = assignedInstances;
  if ($('p-revenue')) $('p-revenue').textContent = `KES ${Math.round(monthlyRevenue / 1000)}K`;
  if ($('p-renewals')) $('p-renewals').textContent = renewalsDue;

  const table = $('plan-assignment-table');
  if (table) {
    table.innerHTML = INSTANCES.map(instance => {
      const plan = findPlan(instance.planId);
      const amount = instance.billingCycle === 'Annual' ? plan.annual : instance.billingCycle === 'Termly' ? plan.termly : plan.monthly;
      return `<tr>
        <td><div class="cell-school"><strong>${esc(instance.name)}</strong><div class="cell-domain">${esc(instance.domain)}</div></div></td>
        <td><span class="version-chip">${esc(plan.name)}</span></td>
        <td>${esc(instance.billingCycle)}</td>
        <td><strong>KES ${money(amount)}</strong></td>
        <td>${fmtDate(instance.nextRenewal)}</td>
        <td><span class="badge ${statusCls(instance.billingStatus)}">${esc(instance.billingStatus)}</span></td>
        <td>
          <div class="action-row">
            <button class="tbl-btn primary" type="button" data-billing-edit="${esc(instance.name)}">Change Plan</button>
            <button class="tbl-btn" type="button" data-billing-renew="${esc(instance.name)}">Mark Paid</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  }

  renderFeatureMatrix();
}

function renderFeatureMatrix() {
  const head = $('feature-matrix-head');
  const body = $('feature-matrix-body');
  if (!head || !body) return;

  head.innerHTML = `<tr><th>Feature</th>${PRICING_PLANS.map(plan => `<th class="feat-plan-head">${esc(plan.name)}</th>`).join('')}</tr>`;
  body.innerHTML = FEATURE_MATRIX.map(feature => `
    <tr>
      <td><strong>${esc(feature)}</strong></td>
      ${PRICING_PLANS.map(plan => {
        const included = plan.features.some(item => item.toLowerCase().includes(feature.toLowerCase().replace('fee tracking', 'fee')));
        return `<td style="text-align:center"><span class="${included ? 'feat-check' : 'feat-cross'}">${included ? 'Yes' : '-'}</span></td>`;
      }).join('')}
    </tr>`).join('');
}

// Navigation
const SECTIONS = ['overview', 'instances', 'storage', 'deployments', 'controls', 'pricing', 'logs'];
const SECTION_LABELS = {
  overview: 'Overview',
  instances: 'Instances',
  storage: 'Storage',
  deployments: 'Deployments',
  controls: 'Controls',
  pricing: 'Pricing Plans',
  logs: 'Audit Log',
};

function showSection(id) {
  SECTIONS.forEach(section => {
    const el = $(`section-${section}`);
    if (el) el.className = section === id ? 'section-visible' : 'section-hidden';
  });
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === id);
  });
  if ($('breadcrumb-active')) $('breadcrumb-active').textContent = SECTION_LABELS[id] || id;
}

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', event => {
    event.preventDefault();
    showSection(el.dataset.section);
  });
});

// Modals
function openModal() {
  $('modal-overlay')?.classList.add('open');
}

function closeModal() {
  $('modal-overlay')?.classList.remove('open');
}

function openPlanModal(plan = null) {
  editingPlanId = plan?.id || null;
  if ($('plan-modal-title')) $('plan-modal-title').textContent = plan ? `Edit ${plan.name}` : 'New Pricing Plan';
  if ($('p-name')) $('p-name').value = plan?.name || '';
  if ($('p-badge')) $('p-badge').value = plan?.badge || '';
  if ($('p-monthly')) $('p-monthly').value = plan?.monthly || '';
  if ($('p-termly')) $('p-termly').value = plan?.termly || '';
  if ($('p-annual')) $('p-annual').value = plan?.annual || '';
  if ($('p-students')) $('p-students').value = plan?.maxStudents || '';
  if ($('p-storage-limit')) $('p-storage-limit').value = plan?.storageLimit || '';
  if ($('p-features')) $('p-features').value = plan?.features?.join('\n') || '';
  if ($('p-status')) $('p-status').value = plan?.status || 'active';
  $('plan-modal-overlay')?.classList.add('open');
}

function closePlanModal() {
  editingPlanId = null;
  $('plan-modal-overlay')?.classList.remove('open');
}

function openConfirm({ title, body, requireText = '', confirmLabel = 'Confirm', onConfirm }) {
  pendingConfirm = { requireText, onConfirm };
  if ($('confirm-title')) $('confirm-title').textContent = title;
  if ($('confirm-body')) $('confirm-body').textContent = body;
  if ($('confirm-ok')) $('confirm-ok').textContent = confirmLabel;
  if ($('confirm-input')) {
    $('confirm-input').value = '';
    $('confirm-input').placeholder = requireText;
  }
  if ($('confirm-input-row')) $('confirm-input-row').style.display = requireText ? '' : 'none';
  $('confirm-overlay')?.classList.add('open');
}

function closeConfirm() {
  pendingConfirm = null;
  $('confirm-overlay')?.classList.remove('open');
}

function savePlan() {
  const name = $('p-name')?.value.trim();
  if (!name) {
    toast('Please enter a plan name.');
    return;
  }

  const plan = {
    id: editingPlanId || slugify(name),
    name,
    badge: $('p-badge')?.value.trim() || 'Plan',
    monthly: Number($('p-monthly')?.value || 0),
    termly: Number($('p-termly')?.value || 0),
    annual: Number($('p-annual')?.value || 0),
    maxStudents: $('p-students')?.value.trim() || 'Custom',
    storageLimit: $('p-storage-limit')?.value.trim() || 'Custom',
    status: $('p-status')?.value || 'active',
    featured: false,
    features: ($('p-features')?.value || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean),
  };

  const existingIndex = PRICING_PLANS.findIndex(item => item.id === plan.id);
  if (existingIndex >= 0) {
    PRICING_PLANS[existingIndex] = { ...PRICING_PLANS[existingIndex], ...plan };
    addAudit({ action: 'Pricing Plan Updated', instance: plan.name, details: 'Demo plan edited locally' });
  } else {
    PRICING_PLANS.push(plan);
    addAudit({ action: 'Pricing Plan Created', instance: plan.name, details: 'Demo plan added locally' });
  }

  renderPricingPlans();
  closePlanModal();
  toast(`${plan.name} saved in demo mode.`);
}

// Controls
async function callControlStub(action) {
  try {
    const response = await fetch(`/api/controls/${encodeURIComponent(action)}`, {
      method: 'POST',
      credentials: 'same-origin',
    });
    if (!response.ok) return false;
    return true;
  } catch (_) {
    return false;
  }
}

function controlLogLines(action, instance) {
  const target = instance?.name || 'All Instances';
  return [
    { type: 'info', text: `[${nowLabel()}] queued ${action} for ${target}` },
    { text: `[${nowLabel()}] checking container state and latest image tag` },
    { text: `[${nowLabel()}] writing audit event to console activity log` },
    { type: 'warn', text: `[${nowLabel()}] demo mode: no production container was changed` },
  ];
}

async function runControl(action, label, options = {}) {
  const instance = selectedInstance();
  const target = options.global ? 'All Instances' : instance.name;

  if (options.confirm) {
    openConfirm({
      title: label,
      body: `${label} will be recorded for ${target}. This demo does not change production, but the real version will require this confirmation before continuing.`,
      requireText: options.requireText ? instance.name : '',
      confirmLabel: label,
      onConfirm: () => runControl(action, label, { ...options, confirm: false }),
    });
    return;
  }

  const allowed = await callControlStub(action);
  if (!allowed) {
    toast('Control API is not available or your role is not allowed.');
  }

  if (action === 'start') instance.status = 'Online';
  if (action === 'stop') instance.status = 'Offline';
  if (action === 'restart' || action === 'redeploy' || action === 'health') instance.status = instance.status === 'Offline' ? 'Offline' : 'Online';
  if (action === 'start-all' || action === 'redeploy-all') {
    INSTANCES.forEach(item => { item.status = 'Online'; });
  }
  if (action === 'stop-all') {
    INSTANCES.forEach(item => { item.status = 'Offline'; });
  }

  renderLogs(controlLogLines(action, options.global ? null : instance));
  addAudit({
    action: label,
    instance: target,
    details: allowed ? 'Protected control endpoint accepted demo request' : 'Demo-only UI event',
    status: action.includes('stop') || action.includes('reset') || action.includes('purge') || action.includes('remove') ? 'Warning' : 'Success',
  });
  renderEverything();
  toast(`${label} recorded for ${target}.`);
}

function handleControlButton(btn) {
  const action = btn.dataset.ctrl;
  const label = btn.dataset.label || action;
  const global = action?.endsWith('-all');
  const destructive = ['stop', 'stop-all', 'restore', 'reset', 'purge', 'remove'].includes(action);
  const requireText = ['reset', 'purge', 'remove'].includes(action);

  if (action === 'logs') {
    renderLogs(controlLogLines('logs', selectedInstance()));
    addAudit({ action: 'Fetch Logs', instance: selectedInstance().name, details: 'Demo log viewer refreshed' });
    toast('Demo logs loaded.');
    return;
  }

  runControl(action, label, { global, confirm: destructive, requireText });
}

function exportLogsCsv() {
  const rows = [['Time', 'Action', 'Instance', 'Performed By', 'Details', 'Status'], ...AUDIT_LOGS.map(log => [
    log.time,
    log.action,
    log.instance,
    log.by,
    log.details || '',
    log.status,
  ])];
  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'trends-core-audit-log.csv';
  link.click();
  URL.revokeObjectURL(url);
  toast('Audit CSV prepared.');
}

// Event wiring
document.body.addEventListener('click', event => {
  const btn = event.target.closest('button');
  if (!btn) return;

  const id = btn.id;
  if (['btn-create', 'btn-create2', 'btn-create3'].includes(id)) {
    openModal();
    return;
  }

  if (id === 'btn-refresh') {
    if ($('last-updated')) $('last-updated').textContent = `Refreshed ${nowLabel()}`;
    renderEverything();
    toast('Demo metrics refreshed.');
    return;
  }

  if (id === 'btn-clear-logs') {
    renderLogs();
    return;
  }

  if (id === 'btn-new-plan') {
    openPlanModal();
    return;
  }

  if (id === 'btn-export-logs') {
    exportLogsCsv();
    return;
  }

  if (id === 'btn-filter-logs') {
    $('log-search')?.focus();
    return;
  }

  const instanceTab = btn.dataset.instance;
  if (instanceTab) {
    selectedInstanceName = instanceTab;
    renderControlInstances();
    renderLogs();
    return;
  }

  const planEdit = btn.dataset.planEdit;
  if (planEdit) {
    openPlanModal(PRICING_PLANS.find(plan => plan.id === planEdit));
    return;
  }

  const planAssign = btn.dataset.planAssign;
  if (planAssign) {
    const plan = findPlan(planAssign);
    toast(`Choose a school from the assignment table to move it to ${plan.name}.`);
    return;
  }

  const billingEdit = btn.dataset.billingEdit;
  if (billingEdit) {
    const instance = INSTANCES.find(item => item.name === billingEdit);
    selectedInstanceName = instance?.name || selectedInstanceName;
    toast('Plan assignment editing will connect to billing workflows in Phase 2.');
    showSection('pricing');
    return;
  }

  const billingRenew = btn.dataset.billingRenew;
  if (billingRenew) {
    const instance = INSTANCES.find(item => item.name === billingRenew);
    if (instance) {
      instance.billingStatus = 'Active';
      addAudit({ action: 'Billing Renewal Marked', instance: instance.name, details: 'Demo renewal status updated locally' });
      renderPricingPlans();
      toast(`${instance.name} marked as paid in demo mode.`);
    }
    return;
  }

  const action = btn.dataset.action;
  const school = btn.dataset.school;
  if (action && school) {
    selectedInstanceName = school;
    handleControlButton({ dataset: { ctrl: action.toLowerCase(), label: action } });
    return;
  }

  if (btn.dataset.ctrl) {
    handleControlButton(btn);
  }
});

document.body.addEventListener('change', event => {
  const toggle = event.target.closest('input[data-module]');
  if (!toggle) return;
  const module = PLATFORM_MODULES.find(item => item.id === toggle.dataset.module);
  if (!module) return;
  module.enabled = toggle.checked;
  addAudit({
    action: toggle.checked ? 'Module Enabled' : 'Module Disabled',
    instance: selectedInstance().name,
    details: `${module.name} toggled in demo mode`,
    status: 'Success',
  });
  toast(`${module.name} ${toggle.checked ? 'enabled' : 'disabled'} for ${selectedInstance().name}.`);
});

function bindModalEvents() {
  $('modal-close')?.addEventListener('click', closeModal);
  $('modal-cancel')?.addEventListener('click', closeModal);
  $('modal-overlay')?.addEventListener('click', event => { if (event.target === $('modal-overlay')) closeModal(); });
  $('modal-submit')?.addEventListener('click', () => {
    const name = $('f-name')?.value.trim();
    if (!name) {
      toast('Please enter a school name.');
      return;
    }
    const planId = $('f-plan')?.value || 'starter';
    const newInstance = {
      name,
      domain: $('f-domain')?.value.trim() || `${slugify(name)}.elimucrown.co.ke`,
      status: 'Pending',
      type: $('f-type')?.value || 'PRIMARY_CBC',
      typeLabel: $('f-type')?.selectedOptions?.[0]?.textContent || 'Junior CBC',
      created: '2026-04-29',
      version: 'pending',
      fe: Number($('f-port-fe')?.value || 3003),
      be: Number($('f-port-be')?.value || 5003),
      db: `trends_core_${slugify(name).replace(/-/g, '_')}`,
      storage: 0,
      dbGb: 0,
      uploads: 0,
      backups: 0,
      containers: 0,
      planId,
      billingCycle: 'Monthly',
      nextRenewal: '2026-05-29',
      billingStatus: 'Pending',
    };
    INSTANCES.push(newInstance);
    selectedInstanceName = newInstance.name;
    addAudit({ action: 'Provision Instance', instance: newInstance.name, details: 'Demo instance added locally', status: 'Warning' });
    renderEverything();
    closeModal();
    toast(`Provisioning "${name}" queued in demo mode.`);
  });

  $('plan-modal-close')?.addEventListener('click', closePlanModal);
  $('plan-modal-cancel')?.addEventListener('click', closePlanModal);
  $('plan-modal-submit')?.addEventListener('click', savePlan);
  $('plan-modal-overlay')?.addEventListener('click', event => { if (event.target === $('plan-modal-overlay')) closePlanModal(); });

  $('confirm-close')?.addEventListener('click', closeConfirm);
  $('confirm-cancel')?.addEventListener('click', closeConfirm);
  $('confirm-overlay')?.addEventListener('click', event => { if (event.target === $('confirm-overlay')) closeConfirm(); });
  $('confirm-ok')?.addEventListener('click', () => {
    if (!pendingConfirm) return;
    const required = pendingConfirm.requireText;
    if (required && $('confirm-input')?.value.trim() !== required) {
      toast('Confirmation text does not match.');
      return;
    }
    const onConfirm = pendingConfirm.onConfirm;
    closeConfirm();
    onConfirm?.();
  });

  $('log-search')?.addEventListener('input', renderAuditLog);
}

function renderEverything() {
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
}

function init() {
  bindModalEvents();
  renderEverything();
  renderLogs();
  if ($('last-updated')) $('last-updated').textContent = `Demo · ${nowLabel()}`;
}

init();
