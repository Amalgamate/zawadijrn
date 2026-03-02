# Phase 1B: Performance Optimization Roadmap

**Current Status**: P95 latency at 631ms (light load), need to reach <500ms  
**Target Date**: March 4-5, 2026  
**Optimization Completed**: 36% improvement (bcrypt cost)  
**Remaining Gap**: 26% (light load), 289% (medium load)

---

## 🎯 Performance Targets

| Load Level | Current P95 | Target | Gap | Priority |
|------------|------------|--------|-----|----------|
| Light (100) | 631ms | 500ms | 131ms (26%) | 🔴 HIGH |
| Medium (500) | 1944ms | 500ms | 1444ms (289%) | 🔴 CRITICAL |
| Heavy (1000) | TBD | 500ms | TBD | 🟡 MEDIUM |

---

## 🔍 Diagnosis: What's Causing the Remaining Latency?

### Current Distribution (Estimated)
```
Request Processing Breakdown:
├─ Rate limit check:        20ms (reduced from 40ms)
├─ Request parsing/validation: 30ms
├─ Database query:          250ms ⚠️ (LIKELY BOTTLENECK)
├─ Password hashing (bcrypt 11): 50-100ms ✅ (was 100-200ms)
├─ Response serialization:   30ms
└─ Network/Middleware:       75ms
                          ───────
Total:                      455-505ms ✅ (should be at target!)
```

**Problem**: Actual is 631ms, estimate is 455-505ms → Something is timing out or blocking

### Likely Culprits

1. **Database Connection Pool Exhaustion**
   - Issue: Connections running out under load
   - Symptom: P95 jumps significantly
   - Fix: Tune pool size

2. **Slow Queries**
   - Issue: User lookup query takes >200ms
   - Symptom: Consistent high latency
   - Fix: Add indexes, optimize query

3. **Synchronous Operations**
   - Issue: Blocking I/O in middleware
   - Symptom: Linear scaling with load
   - Fix: Make async/use workers

4. **Response Serialization**
   - Issue: Large JSON response
   - Symptom: Scales with response size
   - Fix: Compress, reduce fields

---

## 📋 Step-by-Step Optimization Plan

### Step 1: APM Profiling (TODAY - 15 mins)

**Goal**: Identify exact bottleneck

**Action 1A: Install APM Monitoring**

```bash
# Option A: Application Insights (Azure) - Lightweight
npm install applicationinsights

# Option B: OpenTelemetry - Framework agnostic
npm install @opentelemetry/auto @opentelemetry/sdk-node

# Option C: Clinic.js - Local profiling
npm install -g clinic
```

**Action 1B: Run Profiling Tests**

```bash
# Local profiling with Clinic.js
clinic doctor --node-args="--max-old-space-size=8192" -- npm run dev &
npm run test:load:light

# Analyze the HTML report
```

**Expected Output**: Breakdown showing where time is spent

---

### Step 2: Database Optimization (MARCH 3 - 2 hours)

#### 2A: Check Connection Pool Status

```bash
# Add to server startup logs
export PGSTATLOG=true

# Run tests and monitor:
SELECT count(*) FROM pg_stat_activity;
SELECT max_conn, client_addr, state FROM pg_stat_activity;
```

**Recommendation**:
```javascript
// In src/config/database.ts
const prisma = new PrismaClient({
  // Tune these based on your load
  connection_limit: 20,           // Default is 10
  pool_timeout: 10,               // seconds
});
```

#### 2B: Optimize User Query

```typescript
// Current (slow):
const user = await prisma.user.findUnique({
  where: { email }
});

// Optimized (fast):
const user = await prisma.user.findUnique({where: { email }});
// Ensure index exists in schema:
// unique = true on email field ✅ (already done)

// Additional optimization:
// Add query result caching
const cachedUser = cache.get(email);
if (!cachedUser) {
  const user = await prisma.user.findUnique({ where: { email } });
  cache.set(email, user, { ttl: 300 }); // 5 min cache
}
```

#### 2C: Check Database Indexes

```sql
-- Check if email index exists
SELECT * FROM pg_indexes WHERE tablename = 'User' AND indexname LIKE '%email%';

-- If missing, create it:
CREATE INDEX idx_user_email ON "User"(email);
```

---

### Step 3: Middleware Optimization (MARCH 3 - 1 hour)

#### 3A: Analyze Middleware Chain

Current order in `src/server.ts`:
```typescript
app.use(helmet());           // Security headers - FAST ✅
app.use(cors(...));          // CORS - FAST ✅
app.use(hideSensitiveHeaders); // Custom - FAST ✅
app.use(securityHeaders);    // Security - FAST ✅
app.use(ipRateLimit(...));   // Rate limiting - CHECK ⚠️
app.use(sanitizeResponse);   // Sanitization - CHECK ⚠️
app.use(express.json());     // Parsing - OK
app.use('/', routes);        // Routes - CHECK ⚠️
```

#### 3B: Optimize Rate Limiting

```typescript
// Current (in ipRateLimit middleware):
const key = req.ip; // This does a reverse DNS lookup per request

// Optimized:
const key = req.socket.remoteAddress; // Direct IP address

// Cache the rate limit check:
const redis = new Redis();
const rateLimitCheck = async (ip) => {
  const key = `rate:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 900); // 15 minutes
  }
  return count <= 1000; // 1000 requests per 15 min
};
```

#### 3C: Benchmark Individual Middleware

```javascript
// Add timing middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (duration > 100) {
      console.log(`[SLOW] ${req.method} ${req.path}: ${duration}ms`);
    }
  });
  next();
});
```

---

### Step 4: Response Optimization (MARCH 3 - 30 mins)

#### 4A: Reduce Response Payload

```typescript
// Instead of returning all user fields:
res.json({
  success: true,
  user: userWithoutPassword,  // ALL fields
  token: accessToken,
  refreshToken,
});

// Return only what's needed:
res.json({
  success: true,
  user: {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
  },
  token: accessToken,
  refreshToken,
});
```

#### 4B: Enable Compression

```bash
npm install compression

// In src/server.ts
import compression from 'compression';
app.use(compression()); // GZIP responses
```

---

### Step 5: Cache Implementation (MARCH 3 - 2 hours)

#### 5A: Add Redis (If Not Already Present)

```bash
# Install Redis client
npm install redis

# Start Redis locally
docker run -d -p 6379:6379 redis:latest
```

#### 5B: Cache User Lookups

```typescript
// src/services/cache.service.ts
import { createClient } from 'redis';

export class CacheService {
  private client = createClient();

  async cacheUser(email: string, user: User, ttl = 300) {
    await this.client.setEx(
      `user:${email}`,
      ttl,
      JSON.stringify(user)
    );
  }

  async getUser(email: string): Promise<User | null> {
    const cached = await this.client.get(`user:${email}`);
    return cached ? JSON.parse(cached) : null;
  }
}

// In auth.controller.ts
async login(req, res) {
  const { email, password } = req.body;

  // Check cache first
  let user = await cache.getUser(email);

  // If not cached, query database
  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await cache.cacheUser(email, user);
    }
  }

  // ... rest of login logic
}
```

---

## 🧪 Testing & Validation

### Validation After Each Step

```bash
# After Step 1 (APM):
npm run test:load:light
# Check APM dashboard for bottleneck identification

# After Step 2 (DB):
npm run test:load:light
# Expected improvement: 200-350ms → 100-150ms

# After Step 3 (Middleware):
npm run test:load:light
# Expected improvement: 10-50ms additional

# After Step 4 (Response):
npm run test:load:light
# Expected improvement: 10-30ms additional

# After Step 5 (Cache):
npm run test:load:light
# Expected improvement: 100-200ms additional
```

### Target Achievements

```
Baseline:           P95 = 631ms (Light Load)
After DB Opt:       P95 = 450-480ms ✅ Goal!
After Cache:        P95 = 250-300ms ✅ Excellent!

Medium Load (500):
Baseline:           P95 = 1944ms
After DB Opt:       P95 = 1500-1600ms (Goal by March 5)
After Full Opt:     P95 = 800-1000ms (Nice to have)
```

---

## ⏱️ Timeline

```
March 2 (Evening):  ✅ Initial optimization complete (36% improvement)
March 3 (Morning):  [ ] APM profiling & diagnosis
March 3 (Midday):   [ ] Database optimization
March 3 (Afternoon):[ ] Middleware & response optimization
March 3 (Evening):  [ ] Cache implementation
March 4 (Morning):  [ ] Validation testing
March 4 (Afternoon):[ ] Final tweaks & sign-off preparations
March 5 (Final):    [ ] Go/No-Go decision
```

---

## 📊 Expected Results

### Light Load (100 users, 1000 requests)

| Step | P95 Latency | Expected | Status |
|------|------------|----------|--------|
| Current | 631ms | - | ✅ Baseline |
| After DB | 450ms | <500ms | ✅ Goal |
| After Full | 280ms | <200ms | ✅ Optimal |

### Medium Load (500 users, 2500 requests)

| Step | P95 Latency | Expected | Status |
|------|------------|----------|--------|
| Current | 1944ms | - | Baseline |
| After DB | 1500ms | ~1500ms | Partial |
| After Full | 900ms | <1000ms | Stretch |

---

## 🔧 Implementation Checklist

### Pre-Implementation
- [ ] Backup database
- [ ] Ensure all tests passing
- [ ] Create feature branch
- [ ] Set up monitoring

### APM & Profiling
- [ ] Install monitoring tool
- [ ] Run baseline benchmarks
- [ ] Identify bottleneck
- [ ] Document findings

### Database
- [ ] Check/create indexes
- [ ] Tune connection pool
- [ ] Optimize queries
- [ ] Test performance

### Caching
- [ ] Install Redis
- [ ] Implement cache layer
- [ ] Set TTL policies
- [ ] Test hit rate

### Validation
- [ ] Re-run security tests
- [ ] Re-run load tests
- [ ] Verify no regressions
- [ ] Update documentation

### Deployment
- [ ] Merge to main branch
- [ ] Deploy to staging
- [ ] Run full UAT
- [ ] Deploy to production

---

## 📚 Resources

### Performance Tools
- Clinic.js: https://github.com/davidmarkclements/node-clinic
- DataDog: https://www.datadoghq.com/
- New Relic: https://newrelic.com/
- Artillery: https://artillery.io/

### Database
- Prisma Docs: https://www.prisma.io/docs/
- PostgreSQL Tuning: https://wiki.postgresql.org/wiki/Performance_Optimization

### Node.js
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
- Express Performance: https://expressjs.com/en/advanced/best-practice-performance.html

---

## ❓ Quick Reference

### Check Database Slow Log
```bash
# In psql
SELECT query, calls, total_time FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;
```

### Monitor Active Connections
```bash
# In psql
SELECT usename, application_name, state, query 
FROM pg_stat_activity;
```

### Check Current Cache Hit Rate
```bash
redis-cli INFO stats | grep hits
```

### Load Test with Different Rates
```bash
# Slow load
npm run test:load  # 100-500 users

# Custom load (modify test:load:light)
ts-node tests/load-testing.test.ts --users=50 --duration=60
```

---

**Status**: Optimization roadmap ready for implementation  
**Next Action**: Begin APM profiling on March 3  
**Goal**: Reach P95 <500ms by March 4  
**Final**: Production deployment ready by March 15
