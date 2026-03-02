import express from 'express';
import request from 'supertest';
import { authenticate } from '../middleware/auth.middleware';
import { enforceSchoolConsistency, requireTenant } from '../middleware/tenant.middleware';
import { generateAccessToken } from '../utils/jwt.util';

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true }));
  // apply auth and consistency middlewares
  app.use(authenticate);
  app.use(requireTenant);
  // app.use(enforceSchoolConsistency); // Global removed, but we use it below
  
  // Test route that expects :schoolId
  app.get('/config/term/:schoolId', enforceSchoolConsistency, (req, res) => {
    // Return the tenant schoolId to verify resolution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenant = (req as any).tenant || {};
    return res.json({ success: true, tenant });
  });
  return app;
};

describe('schoolId consistency middleware', () => {
  const userBase = {
    id: 'u1',
    email: 'u1@example.com',
    role: 'ADMIN' as any,
  };

  it('accepts matching JWT and param schoolId', async () => {
    const token = generateAccessToken({ ...userBase, schoolId: 'S1' });
    const app = buildApp();
    const res = await request(app)
      .get('/config/term/S1')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.tenant.schoolId).toBe('S1');
  });

  it('rejects mismatched JWT and param schoolId', async () => {
    const token = generateAccessToken({ ...userBase, schoolId: 'S1' });
    const app = buildApp();
    const res = await request(app)
      .get('/config/term/S2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403); // Changed from 400 to 403
    expect(res.body.success).toBe(false);
  });

  it('allows access for user without schoolId (e.g. SUPER_ADMIN) via param', async () => {
    // Simulating SUPER_ADMIN (or user without schoolId)
    const token = generateAccessToken({ ...userBase, role: 'SUPER_ADMIN', schoolId: null });
    const app = buildApp();
    const res = await request(app)
      .get('/config/term/S3')
      .set('Authorization', `Bearer ${token}`);
    
    // requireTenant bypasses SUPER_ADMIN
    // enforceSchoolConsistency sees no tenant.schoolId, so it uses param S3
    expect(res.status).toBe(200);
    expect(res.body.tenant.schoolId).toBe('S3');
  });

  it('ignores header X-School-Id (deprecated)', async () => {
    const token = generateAccessToken({ ...userBase, role: 'SUPER_ADMIN', schoolId: null });
    const app = buildApp();
    const res = await request(app)
      .get('/config/term/S4')
      .set('Authorization', `Bearer ${token}`)
      .set('X-School-Id', 'S999'); // Should be ignored
    
    expect(res.status).toBe(200);
    expect(res.body.tenant.schoolId).toBe('S4'); // Uses param
  });
});
