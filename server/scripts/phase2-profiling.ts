/**
 * Phase 2: Database Performance Profiling
 * 
 * This script profiles the database performance using HTTP load testing
 * and captures metrics for optimization analysis.
 * 
 * Usage:
 *   node -r ts-node/register scripts/phase2-profiling.ts
 *   
 * Or with Clinic.js:
 *   clinic doctor -- node -r ts-node/register scripts/phase2-profiling.ts
 */

import http from 'http';
import { performance } from 'perf_hooks';

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
}

interface ProfileResult {
  endpoint: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
}

const BASE_URL = 'http://localhost:5000';
const TEST_DURATION_MS = 30000; // 30 second profile
const CONCURRENT_REQUESTS = 10;

const metrics: RequestMetrics[] = [];

/**
 * Perform a single HTTP request
 */
function makeRequest(method: string, path: string, body?: string): Promise<RequestMetrics> {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const url = new URL(path, BASE_URL);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body && { 'Content-Length': Buffer.byteLength(body) }),
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const duration = performance.now() - startTime;
        resolve({
          method,
          path,
          statusCode: res.statusCode || 500,
          duration,
          timestamp: Date.now(),
        });
      });
    });

    req.on('error', () => {
      const duration = performance.now() - startTime;
      resolve({
        method,
        path,
        statusCode: 0,
        duration,
        timestamp: Date.now(),
      });
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

/**
 * Run continuous requests for a duration
 */
async function profileEndpoint(
  method: string,
  path: string,
  body?: string,
  durationMs: number = TEST_DURATION_MS
): Promise<ProfileResult> {
  console.log(`\n🔍 Profiling: ${method} ${path}`);
  console.log(`⏱️  Duration: ${durationMs}ms | Concurrency: ${CONCURRENT_REQUESTS}`);

  const startTime = performance.now();
  const endpointMetrics: RequestMetrics[] = [];
  let completed = 0;

  while (performance.now() - startTime < durationMs) {
    const promises = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      promises.push(
        makeRequest(method, path, body).then((metric) => {
          endpointMetrics.push(metric);
          completed++;
        })
      );
    }
    await Promise.all(promises);

    // Progress indicator
    const elapsed = Math.round((performance.now() - startTime) / 1000);
    process.stdout.write(`\r⏳ Elapsed: ${elapsed}s | Requests: ${completed}`);
  }

  console.log('\n');

  // Calculate percentiles
  const durations = endpointMetrics.map((m) => m.duration).sort((a, b) => a - b);

  const calculate = (percentile: number) => {
    const index = Math.ceil((percentile / 100) * durations.length) - 1;
    return durations[Math.max(0, index)];
  };

  const totalTime = performance.now() - startTime;
  const successCount = endpointMetrics.filter((m) => m.statusCode >= 200 && m.statusCode < 300).length;

  const result: ProfileResult = {
    endpoint: `${method} ${path}`,
    totalRequests: endpointMetrics.length,
    successCount,
    errorCount: endpointMetrics.length - successCount,
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p50: calculate(50),
    p95: calculate(95),
    p99: calculate(99),
    requestsPerSecond: (endpointMetrics.length / totalTime) * 1000,
  };

  return result;
}

/**
 * Profile common endpoints
 */
async function runPhase2Profiling() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           Phase 2: Database Performance Profiling              ║
║                                                                ║
║ Collecting performance baselines before optimization           ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Test endpoints
  const endpoints = [
    { method: 'POST', path: '/api/auth/login', body: JSON.stringify({ email: 'test@example.com', password: 'Test123!@#' }) },
    { method: 'GET', path: '/api/users', body: undefined },
    { method: 'GET', path: '/api/schools', body: undefined },
  ];

  const results: ProfileResult[] = [];

  for (const endpoint of endpoints) {
    const result = await profileEndpoint(endpoint.method, endpoint.path, endpoint.body, 20000);
    results.push(result);
  }

  // Print summary table
  console.log(`
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              PROFILING RESULTS SUMMARY                                                    ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
`);

  results.forEach((result) => {
    console.log(`
📊 ${result.endpoint}
   Success Rate: ${((result.successCount / result.totalRequests) * 100).toFixed(2)}% (${result.successCount}/${result.totalRequests})
   P50: ${result.p50.toFixed(2)}ms
   P95: ${result.p95.toFixed(2)}ms
   P99: ${result.p99.toFixed(2)}ms
   Average: ${result.avgDuration.toFixed(2)}ms
   Min/Max: ${result.minDuration.toFixed(2)}ms / ${result.maxDuration.toFixed(2)}ms
   Throughput: ${result.requestsPerSecond.toFixed(2)} req/s
`);
  });

  // Identify bottleneck
  console.log(`
╔════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                            BOTTLENECK ANALYSIS                                                           ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
`);

  const slowest = results.reduce((a, b) => (a.p95 > b.p95 ? a : b));
  console.log(`
🐌 Slowest Endpoint: ${slowest.endpoint}
   P95 Latency: ${slowest.p95.toFixed(2)}ms (target: <500ms)
   Gap: ${(slowest.p95 - 500).toFixed(2)}ms over target (${((slowest.p95 / 500 - 1) * 100).toFixed(0)}% worse)

💡 Recommendation: 
   This endpoint needs optimization focus in Phase 2.
   Check database query execution plan with EXPLAIN ANALYZE.
   Consider adding caching or query optimization.
`);

  console.log(`
✅ Phase 2 Profiling Complete
   Run with Clinic.js for detailed analysis:
   clinic doctor -- node -r ts-node/register scripts/phase2-profiling.ts
   Then open the generated HTML report for CPU/memory flamegraphs.
`);
}

// Run profiling
runPhase2Profiling().catch(console.error);
