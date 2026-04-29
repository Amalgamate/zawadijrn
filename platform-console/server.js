// ── Trends CORE Control Panel — Auth Server ───────────────────────────────
// Wraps the static console with JWT-based login.
// Run:  node server.js   (port 3100 by default)
//
// Dependencies:  npm install express jsonwebtoken cookie-parser

const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

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

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(__dirname, '.env'));

const { USERS, JWT_SECRET, JWT_EXPIRES_IN, ROLE_ACCESS } = require('./auth-config');

const app = express();
const PORT = process.env.PORT || 3100;
const COOKIE_NAME = 'trends_core_token';
const COOKIE_SECURE = process.env.CONSOLE_COOKIE_SECURE === 'true';

if (process.env.NODE_ENV === 'production') {
  if (!JWT_SECRET) {
    throw new Error('CONSOLE_JWT_SECRET is required in production.');
  }
  if (USERS.length === 0) {
    throw new Error('At least one console user must be configured in production.');
  }
}

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'zawadi-platform-console' });
});

// ── Auth middleware ────────────────────────────────────────────────────────
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

// ── Role guard middleware factory ─────────────────────────────────────────
// Usage: router.get('/api/controls/…', requireAuth, requireRole('super_admin'), handler)
// Keeps Phase 2 API routes enforceable server-side, not just hidden in the UI.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for your role.' });
    }
    next();
  };
}

// ── POST /api/login ────────────────────────────────────────────────────────
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

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const payload = { email: user.email, role: user.role, name: user.name };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'Strict',
    secure: COOKIE_SECURE,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
  });

  return res.json({
    ok: true,
    user: { email: user.email, role: user.role, name: user.name },
    access: ROLE_ACCESS[user.role] || [],
  });
});

// ── POST /api/logout ───────────────────────────────────────────────────────
app.post('/api/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.json({ ok: true });
});

// ── GET /api/me ────────────────────────────────────────────────────────────
// Frontend calls this on load to restore session state (role + access list).
app.get('/api/me', requireAuth, (req, res) => {
  return res.json({
    user: { email: req.user.email, role: req.user.role, name: req.user.name },
    access: ROLE_ACCESS[req.user.role] || [],
  });
});

// ── Phase 2: role-protected API routes (scaffold) ─────────────────────────
// These are stubs that demonstrate server-side role enforcement.
// Wire real logic here when Phase 2 controls are implemented.
app.post('/api/controls/:action',
  requireAuth,
  requireRole('super_admin'),
  (req, res) => {
    // Only super_admin reaches here — platform_owner gets 403 at middleware
    res.json({ ok: true, action: req.params.action, status: 'stub — Phase 2 pending' });
  }
);

// ── Static files (the control panel UI) ───────────────────────────────────
app.use(express.static(path.join(__dirname)));

// ── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Trends CORE Control Panel  →  http://localhost:${PORT}`);
  console.log(`Users configured: ${USERS.map(u => `${u.email} (${u.role})`).join(', ') || 'none'}`);
  console.log(`JWT expires: ${JWT_EXPIRES_IN} · Secure cookie: ${COOKIE_SECURE}`);
});

module.exports = { requireAuth, requireRole }; // for testing
