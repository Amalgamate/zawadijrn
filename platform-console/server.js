const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { promisify } = require('util');
const { execFile } = require('child_process');
const Docker = require('dockerode');
const si = require('systeminformation');

const execFileAsync = promisify(execFile);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const splitAt = trimmed.indexOf('=');
    if (splitAt === -1) continue;
    const key = trimmed.slice(0, splitAt).trim();
    const rawValue = trimmed.slice(splitAt + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, '.env'));

const { USERS, JWT_SECRET, JWT_EXPIRES_IN, ROLE_ACCESS } = require('./auth-config');

const app = express();
const PORT = process.env.PORT || 3100;
const COOKIE_NAME = 'trends_core_token';
const COOKIE_SECURE = process.env.CONSOLE_COOKIE_SECURE === 'true';
const docker = process.env.DOCKER_HOST
  ? new Docker({ host: 'localhost', port: 2375, protocol: 'http' })
  : new Docker();

const APP_VERSION = process.env.CONSOLE_APP_VERSION || 'live';
const INSTANCE_PROVISION_SCRIPT = process.env.CONSOLE_INSTANCE_PROVISION_SCRIPT || '';
const NGINX_SITES_DIR = process.env.CONSOLE_NGINX_SITES_DIR || '/etc/nginx/sites-enabled';

const deploymentLog = [];
const auditLog = [];
const APP_TYPE_SET = new Set(['school', 'odoo', 'wordpress', 'sacco', 'hospital', 'hotel', 'organization']);

const DEFAULT_IMAGE_CATALOG = {
  school: [
    { value: 'latest', label: 'Latest stable', image: 'ghcr.io/amalgamate/zawadi-frontend:latest' },
    { value: 'v1.0.x', label: 'v1.0.x LTS', image: 'ghcr.io/amalgamate/zawadi-frontend:v1.0.x' },
  ],
  odoo: [
    { value: '18.0', label: 'Odoo 18.0', image: 'odoo:18.0' },
    { value: '17.0', label: 'Odoo 17.0', image: 'odoo:17.0' },
    { value: '16.0', label: 'Odoo 16.0', image: 'odoo:16.0' },
  ],
  wordpress: [
    { value: 'latest', label: 'WordPress latest', image: 'wordpress:latest' },
    { value: '6.5', label: 'WordPress 6.5', image: 'wordpress:6.5' },
    { value: '6.4', label: 'WordPress 6.4', image: 'wordpress:6.4' },
  ],
  sacco: [
    { value: 'latest', label: 'Sacco latest', image: 'ghcr.io/amalgamate/sacco-app:latest' },
    { value: 'v1.0', label: 'Sacco v1.0', image: 'ghcr.io/amalgamate/sacco-app:v1.0' },
  ],
  hospital: [
    { value: 'latest', label: 'Hospital latest', image: 'ghcr.io/amalgamate/hospital-app:latest' },
    { value: 'v1.0', label: 'Hospital v1.0', image: 'ghcr.io/amalgamate/hospital-app:v1.0' },
  ],
  hotel: [
    { value: 'latest', label: 'Hotel latest', image: 'ghcr.io/amalgamate/hotel-app:latest' },
    { value: 'v1.0', label: 'Hotel v1.0', image: 'ghcr.io/amalgamate/hotel-app:v1.0' },
  ],
  organization: [
    { value: 'latest', label: 'Organization latest', image: 'ghcr.io/amalgamate/organization-app:latest' },
    { value: 'v1.0', label: 'Organization v1.0', image: 'ghcr.io/amalgamate/organization-app:v1.0' },
  ],
};

const APP_PORT_RANGES = {
  school: { fe: [3000, 3499], be: [5000, 5499], requireBe: true },
  odoo: { fe: [3500, 3999], be: [0, 0], requireBe: false },
  wordpress: { fe: [4000, 4499], be: [0, 0], requireBe: false },
  sacco: { fe: [4500, 4799], be: [5500, 5799], requireBe: true },
  hospital: { fe: [4800, 5099], be: [5800, 6099], requireBe: true },
  hotel: { fe: [5100, 5399], be: [6100, 6399], requireBe: true },
  organization: { fe: [5400, 5699], be: [6400, 6699], requireBe: true },
};

function pushAudit(action, instance, by, details, status = 'Success') {
  auditLog.unshift({
    time: new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) + ' EAT',
    action,
    instance,
    by,
    details,
    status,
  });
  if (auditLog.length > 500) auditLog.length = 500;
}

if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET) throw new Error('CONSOLE_JWT_SECRET is required in production.');
  if (USERS.length === 0) throw new Error('At least one console user must be configured in production.');
}

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'zawadi-platform-console' });
});

function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    return res.status(401).json({ error: 'Session expired' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for your role.' });
    }
    next();
  };
}

app.post('/api/login', (req, res) => {
  if (!JWT_SECRET || USERS.length === 0) {
    return res.status(503).json({ error: 'Console authentication is not configured.' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = USERS.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

  const payload = { email: user.email, role: user.role, name: user.name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Strict',
    secure: COOKIE_SECURE,
    maxAge: 8 * 60 * 60 * 1000,
  });

  return res.json({ ok: true, user: { email: user.email, role: user.role, name: user.name }, access: ROLE_ACCESS[user.role] || [] });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  return res.json({ user: { email: req.user.email, role: req.user.role, name: req.user.name }, access: ROLE_ACCESS[req.user.role] || [] });
});

function humanizeInstanceName(raw) {
  if (!raw) return 'Unknown Instance';
  const clean = raw.replace(/^\//, '').replace(/^trends[-_]?core[-_]?/i, '').replace(/^zawadi[-_]?/i, '');
  return clean
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase()) || raw;
}

function mapContainersToInstances(containers) {
  const grouped = new Map();

  for (const c of containers) {
    const cname = (c.Names?.[0] || c.Id || '').replace(/^\//, '');
    const composeProject = c.Labels?.['com.docker.compose.project'] || '';
    const matched = cname.match(/(.*?)(?:[-_])?(frontend|backend|db|database|redis|worker)(?:[-_]?\d+)?$/i);
    const keyBase = composeProject || (matched ? matched[1].replace(/[-_]+$/, '') : cname);
    const key = keyBase || cname;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        name: humanizeInstanceName(key),
        domain: '',
        status: 'Online',
        created: new Date((c.Created || Date.now() / 1000) * 1000).toISOString().slice(0, 10),
        version: (c.Image || '').split(':').pop() || APP_VERSION,
        fe: null,
        be: null,
        db: key,
        storage: 0,
        dbGb: 0,
        uploads: 0,
        backups: 0,
        containers: 0,
        runningContainers: 0,
        containerIds: [],
        composeProject: composeProject || key,
        hasFrontend: false,
        hasBackend: false,
        hasDatabase: false,
      });
    }

    const inst = grouped.get(key);
    const descriptor = `${cname} ${c.Image || ''}`.toLowerCase();
    inst.containers += 1;
    inst.containerIds.push(c.Id);
    if (c.State === 'running') inst.runningContainers += 1;
    if (c.State !== 'running') inst.status = inst.runningContainers === 0 ? 'Offline' : 'Degraded';

    if (/(^|[-_])(frontend|fe|web|ui)($|[-_])/.test(descriptor)) inst.hasFrontend = true;
    if (/(^|[-_])(backend|be|api|server)($|[-_])/.test(descriptor)) inst.hasBackend = true;
    if (/(^|[-_])(db|database|postgres|mysql|mariadb)($|[-_])/.test(descriptor)) inst.hasDatabase = true;

    const ports = c.Ports || [];
    for (const p of ports) {
      if (p.PublicPort >= 3000 && p.PublicPort < 4000 && !inst.fe) inst.fe = p.PublicPort;
      if (p.PublicPort >= 5000 && p.PublicPort < 6000 && !inst.be) inst.be = p.PublicPort;
    }

    const sizeBytes = Math.max(0, Number(c.SizeRw || 0));
    inst.storage += sizeBytes / (1024 ** 3);
    if (/db|postgres|mysql|mariadb/i.test(c.Image || cname)) inst.dbGb += sizeBytes / (1024 ** 3);
    else if (/upload|file|storage/i.test(c.Image || cname)) inst.uploads += sizeBytes / (1024 ** 3);
    else inst.backups += sizeBytes / (1024 ** 3);
  }

  const list = Array.from(grouped.values()).map(i => ({
    ...i,
    storage: Number(i.storage.toFixed(2)),
    dbGb: Number(i.dbGb.toFixed(2)),
    uploads: Number(i.uploads.toFixed(2)),
    backups: Number(i.backups.toFixed(2)),
  }));

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function parseNginxDomainMap() {
  const mapping = { byFePort: {}, byBePort: {} };
  if (!fs.existsSync(NGINX_SITES_DIR)) return mapping;

  const files = fs.readdirSync(NGINX_SITES_DIR);
  for (const name of files) {
    const filePath = path.join(NGINX_SITES_DIR, name);
    let text = '';
    try {
      text = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const serverMatch = text.match(/server_name\s+([^;]+);/);
    if (!serverMatch) continue;
    const domain = (serverMatch[1] || '')
      .split(/\s+/)
      .map(x => x.trim())
      .find(x => x && !x.startsWith('www.'));
    if (!domain) continue;

    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const hit = line.match(/proxy_pass\s+http:\/\/127\.0\.0\.1:(\d+)/);
      if (!hit) continue;
      const p = Number(hit[1]);
      if (p >= 3000 && p < 4000) mapping.byFePort[p] = domain;
      if (p >= 5000 && p < 6000) mapping.byBePort[p] = domain;
    }
  }
  return mapping;
}

function listKnownDomains(runtimeInstances = []) {
  const known = new Set();
  for (const instance of runtimeInstances) {
    const domain = String(instance?.domain || '').trim().toLowerCase();
    if (domain) known.add(domain);
  }
  const nginxMap = parseNginxDomainMap();
  Object.values(nginxMap.byFePort || {}).forEach(domain => {
    const normalized = String(domain || '').trim().toLowerCase();
    if (normalized) known.add(normalized);
  });
  Object.values(nginxMap.byBePort || {}).forEach(domain => {
    const normalized = String(domain || '').trim().toLowerCase();
    if (normalized) known.add(normalized);
  });
  return known;
}

function isPortValid(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function isPortInRange(value, range) {
  if (!Array.isArray(range) || range.length !== 2) return false;
  const port = Number(value);
  const min = Number(range[0]);
  const max = Number(range[1]);
  return Number.isInteger(port) && port >= min && port <= max;
}

function isDomainLike(value) {
  const domain = String(value || '').trim().toLowerCase();
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain);
}

function validateImageForAppType(appType, image) {
  const normalized = String(image || '').toLowerCase();
  if (!normalized) return false;
  if (appType === 'odoo') return normalized.includes('odoo');
  if (appType === 'wordpress') return normalized.includes('wordpress');
  if (appType === 'sacco') return normalized.includes('sacco');
  if (appType === 'hospital') return normalized.includes('hospital');
  if (appType === 'hotel') return normalized.includes('hotel');
  if (appType === 'organization') return normalized.includes('organization');
  if (appType === 'school') return normalized.includes('zawadi') || normalized.includes('trends') || normalized.includes('ghcr.io/amalgamate');
  return false;
}

async function fetchDockerHubTags(repo, limit = 6) {
  const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags?page_size=${limit}`;
  const response = await fetch(url, { method: 'GET' });
  if (!response.ok) throw new Error(`dockerhub ${repo} ${response.status}`);
  const body = await response.json();
  return (body?.results || [])
    .map(tag => String(tag?.name || '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

async function buildImageCatalog() {
  const catalog = JSON.parse(JSON.stringify(DEFAULT_IMAGE_CATALOG));
  try {
    const [odooTags, wordpressTags] = await Promise.all([
      fetchDockerHubTags('library/odoo', 8),
      fetchDockerHubTags('library/wordpress', 8),
    ]);

    if (odooTags.length) {
      catalog.odoo = odooTags.map(tag => ({
        value: tag,
        label: `Odoo ${tag}`,
        image: `odoo:${tag}`,
      }));
    }
    if (wordpressTags.length) {
      catalog.wordpress = wordpressTags.map(tag => ({
        value: tag,
        label: `WordPress ${tag}`,
        image: `wordpress:${tag}`,
      }));
    }
  } catch (_) {
    // fall back to defaults silently
  }
  return catalog;
}

async function collectRuntime() {
  const [containers, mem, disk, load, dockerDf] = await Promise.all([
    docker.listContainers({ all: true, size: true }),
    si.mem(),
    si.fsSize(),
    si.currentLoad(),
    docker.df().catch(() => null),
  ]);

  const instances = mapContainersToInstances(containers);
  const nginxMap = parseNginxDomainMap();
  for (const i of instances) {
    i.domain = (i.fe && nginxMap.byFePort[i.fe]) || (i.be && nginxMap.byBePort[i.be]) || i.domain || '';
  }

  // Prefer real Docker volume usage per compose project when available.
  if (dockerDf && Array.isArray(dockerDf.Volumes)) {
    const volumeBytesByProject = {};
    for (const v of dockerDf.Volumes) {
      const project = v?.Labels?.['com.docker.compose.project'] || '';
      const size = Number(v?.UsageData?.Size || 0);
      if (!project || !Number.isFinite(size) || size <= 0) continue;
      volumeBytesByProject[project] = (volumeBytesByProject[project] || 0) + size;
    }

    for (const i of instances) {
      const bytes = volumeBytesByProject[i.composeProject] || 0;
      if (bytes > 0) {
        i.storage = Number((bytes / (1024 ** 3)).toFixed(2));
        // For now treat volume storage as DB bucket unless specialized buckets are tracked.
        i.dbGb = i.storage;
        i.uploads = 0;
        i.backups = 0;
      }
    }
  }

  const totalDiskBytes = disk.reduce((sum, d) => sum + Number(d.size || 0), 0);
  const usedDiskBytes = disk.reduce((sum, d) => sum + Number(d.used || 0), 0);

  const metrics = {
    liveSchools: instances.filter(i => i.hasFrontend && i.hasBackend && i.hasDatabase).length,
    containersHealthy: `${instances.reduce((s, i) => s + i.runningContainers, 0)}/${Math.max(1, instances.reduce((s, i) => s + i.containers, 0))}`,
    storageUsedGb: dockerDf
      ? Number((((Number(dockerDf.LayersSize || 0) + (dockerDf.Volumes || []).reduce((s, v) => s + Number(v?.UsageData?.Size || 0), 0)) / (1024 ** 3))).toFixed(2))
      : Number(instances.reduce((s, i) => s + i.storage, 0).toFixed(2)),
    cpuLoadPercent: Math.round(load.currentLoad || 0),
    memoryUsedPercent: Math.round((mem.used / Math.max(mem.total, 1)) * 100),
    diskTotalGb: Number((totalDiskBytes / (1024 ** 3)).toFixed(1)),
    diskUsedGb: Number((usedDiskBytes / (1024 ** 3)).toFixed(1)),
  };

  return { instances, metrics };
}

app.get('/api/runtime', requireAuth, async (_req, res) => {
  try {
    const runtime = await collectRuntime();
    res.json({
      ok: true,
      ...runtime,
      deployments: deploymentLog.slice(0, 50),
      auditLogs: auditLog.slice(0, 200),
      mode: 'live',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: `Runtime fetch failed: ${error.message}` });
  }
});

app.get('/api/catalog/images', requireAuth, requireRole('super_admin', 'platform_owner'), async (req, res) => {
  const appType = String(req.query.appType || '').toLowerCase();
  const catalog = await buildImageCatalog();
  if (appType) {
    if (!APP_TYPE_SET.has(appType)) {
      return res.status(400).json({ error: 'Unsupported appType.' });
    }
    return res.json({ ok: true, appType, versions: catalog[appType] || [] });
  }
  return res.json({ ok: true, catalog });
});

app.post('/api/instances/preflight', requireAuth, requireRole('super_admin'), async (req, res) => {
  const {
    appType = 'school',
    domain,
    fePort,
    bePort,
    image = '',
  } = req.body || {};

  const normalizedAppType = String(appType || 'school').toLowerCase();
  const appRange = APP_PORT_RANGES[normalizedAppType] || APP_PORT_RANGES.school;
  const issues = [];
  const warnings = [];

  if (!APP_TYPE_SET.has(normalizedAppType)) {
    issues.push('Unsupported app type.');
  }

  const normalizedDomain = String(domain || '').trim().toLowerCase();
  if (!isDomainLike(normalizedDomain)) {
    issues.push('Domain format is invalid.');
  }

  if (!isPortValid(fePort)) {
    issues.push('Frontend/HTTP port is invalid.');
  } else if (!isPortInRange(fePort, appRange.fe)) {
    issues.push(`Frontend/HTTP port must be in range ${appRange.fe[0]}-${appRange.fe[1]} for ${normalizedAppType}.`);
  }

  if (appRange.requireBe) {
    if (!isPortValid(bePort)) {
      issues.push('Backend/secondary port is invalid.');
    } else if (!isPortInRange(bePort, appRange.be)) {
      issues.push(`Backend/secondary port must be in range ${appRange.be[0]}-${appRange.be[1]} for ${normalizedAppType}.`);
    }
    if (Number(fePort) === Number(bePort)) issues.push('Port conflict: frontend and backend ports cannot be the same.');
  }

  if (APP_TYPE_SET.has(normalizedAppType) && image && !validateImageForAppType(normalizedAppType, image)) {
    issues.push(`Image "${image}" does not look valid for app type "${normalizedAppType}".`);
  }

  try {
    const { instances } = await collectRuntime();
    const usedPorts = new Set();
    for (const instance of instances) {
      if (Number.isFinite(Number(instance.fe))) usedPorts.add(Number(instance.fe));
      if (Number.isFinite(Number(instance.be))) usedPorts.add(Number(instance.be));
    }

    if (usedPorts.has(Number(fePort))) issues.push(`Port ${fePort} is already in use.`);
    if (appRange.requireBe && usedPorts.has(Number(bePort))) issues.push(`Port ${bePort} is already in use.`);

    const domains = listKnownDomains(instances);
    if (domains.has(normalizedDomain)) issues.push(`Domain "${normalizedDomain}" is already in use.`);
  } catch (error) {
    warnings.push(`Live runtime preflight unavailable: ${error.message}`);
  }

  return res.json({
    ok: true,
    valid: issues.length === 0,
    issues,
    warnings,
  });
});

app.get('/api/instances/:key/logs', requireAuth, requireRole('super_admin', 'platform_owner'), async (req, res) => {
  try {
    const { instances } = await collectRuntime();
    const target = instances.find(i => i.key === req.params.key || i.name === req.params.key);
    if (!target) return res.status(404).json({ error: 'Instance not found' });

    const chunks = [];
    for (const cid of target.containerIds.slice(0, 5)) {
      const container = docker.getContainer(cid);
      const raw = await container.logs({ stdout: true, stderr: true, tail: 120, timestamps: true });
      chunks.push(raw.toString('utf8'));
    }
    res.json({ ok: true, logs: chunks.join('\n') });
  } catch (error) {
    res.status(500).json({ error: `Unable to fetch logs: ${error.message}` });
  }
});

async function applyInstanceAction(instanceKey, action) {
  const { instances } = await collectRuntime();
  const target = instances.find(i => i.key === instanceKey || i.name === instanceKey);
  if (!target) {
    const err = new Error('Instance not found');
    err.code = 404;
    throw err;
  }

  for (const cid of target.containerIds) {
    const container = docker.getContainer(cid);
    if (action === 'start') await container.start().catch(() => undefined);
    if (action === 'stop') await container.stop({ t: 10 }).catch(() => undefined);
    if (action === 'drop') await container.remove({ force: true }).catch(() => undefined);
    if (action === 'restart' || action === 'redeploy') await container.restart({ t: 10 }).catch(() => undefined);
  }

  return target;
}

app.post('/api/instances/:key/:action', requireAuth, requireRole('super_admin'), async (req, res) => {
  const action = String(req.params.action || '').toLowerCase();
  if (!['start', 'stop', 'drop', 'restart', 'redeploy', 'health'].includes(action)) {
    return res.status(400).json({ error: 'Unsupported action' });
  }

  try {
    const target = action === 'health' ? (await collectRuntime()).instances.find(i => i.key === req.params.key || i.name === req.params.key) : await applyInstanceAction(req.params.key, action);
    if (!target) return res.status(404).json({ error: 'Instance not found' });

    pushAudit(action.toUpperCase(), target.name, req.user.email, `Action ${action} executed on ${target.name}`, action === 'stop' || action === 'drop' ? 'Warning' : 'Success');
    res.json({ ok: true, target: target.name, action });
  } catch (error) {
    const code = error.code || 500;
    res.status(code).json({ error: error.message || 'Action failed' });
  }
});

app.post('/api/instances/create', requireAuth, requireRole('super_admin'), async (req, res) => {
  const {
    appType = 'school',
    name,
    domain,
    type,
    institutionType,
    planId,
    version = 'latest',
    image = '',
    adminEmail = '',
    notes = '',
    fePort,
    bePort,
    db,
  } = req.body || {};

  const normalizedAppType = String(appType || 'school').toLowerCase();
  const appRange = APP_PORT_RANGES[normalizedAppType] || APP_PORT_RANGES.school;
  if (!APP_TYPE_SET.has(normalizedAppType)) {
    return res.status(400).json({ error: 'Unsupported appType.' });
  }

  if (!name || !domain || !fePort) {
    return res.status(400).json({ error: 'name, domain, and fePort are required' });
  }
  if (appRange.requireBe && !bePort) {
    return res.status(400).json({ error: 'bePort is required for this app type' });
  }

  if (!INSTANCE_PROVISION_SCRIPT) {
    return res.status(501).json({
      error: 'Instance provisioning script not configured',
      hint: 'Set CONSOLE_INSTANCE_PROVISION_SCRIPT on the server to enable real provisioning.',
    });
  }

  const payload = JSON.stringify({
    appType: normalizedAppType,
    name,
    domain,
    type: type || institutionType || 'PRIMARY_CBC',
    planId: planId || 'professional',
    version,
    image,
    adminEmail,
    notes,
    fePort,
    bePort: appRange.requireBe ? bePort : 0,
    db,
    requestedBy: req.user.email
  });

  try {
    const { stdout, stderr } = await execFileAsync(INSTANCE_PROVISION_SCRIPT, [payload], { timeout: 8 * 60 * 1000 });
    pushAudit('PROVISION', name, req.user.email, `Provision script executed for ${name} (${normalizedAppType})`, 'Warning');
    res.json({ ok: true, output: stdout?.trim(), warning: stderr?.trim() || null });
  } catch (error) {
    res.status(500).json({ error: `Provision failed: ${error.message}` });
  }
});

// Backward compatibility endpoint used by current app.js control handler
app.post('/api/controls/:action', requireAuth, requireRole('super_admin'), async (req, res) => {
  const action = String(req.params.action || '').toLowerCase();
  if (action === 'start-all' || action === 'stop-all' || action === 'redeploy-all') {
    try {
      const { instances } = await collectRuntime();
      for (const i of instances) {
        if (action === 'start-all') await applyInstanceAction(i.key, 'start');
        if (action === 'stop-all') await applyInstanceAction(i.key, 'stop');
        if (action === 'redeploy-all') await applyInstanceAction(i.key, 'redeploy');
      }
      pushAudit(action.toUpperCase(), 'All Instances', req.user.email, `Bulk action ${action} completed`, 'Warning');
      return res.json({ ok: true, action, status: 'done' });
    } catch (error) {
      return res.status(500).json({ error: `Bulk action failed: ${error.message}` });
    }
  }

  return res.json({ ok: true, action, status: 'accepted' });
});

app.get('/api/audit-logs', requireAuth, (req, res) => {
  res.json({ ok: true, logs: auditLog.slice(0, 200) });
});

app.get('/api/deployments', requireAuth, (_req, res) => {
  res.json({ ok: true, deployments: deploymentLog.slice(0, 50) });
});

app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Trends CORE Control Panel  →  http://localhost:${PORT}`);
  console.log(`Users configured: ${USERS.map(u => `${u.email} (${u.role})`).join(', ') || 'none'}`);
  console.log(`JWT expires: ${JWT_EXPIRES_IN} · Secure cookie: ${COOKIE_SECURE}`);
  console.log(`Host metrics: ${os.hostname()} · docker host ${process.env.DOCKER_HOST ? 'tcp://localhost:2375' : '/var/run/docker.sock'}`);
});

module.exports = { requireAuth, requireRole };
