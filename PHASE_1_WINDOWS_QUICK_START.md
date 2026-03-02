# Phase 1 Testing - Windows Quick Start

## 🚀 Quick Start (One Command)

### Option 1: Batch File (Easiest)
```bash
run-phase1-tests.bat
```

This automatically:
- ✅ Checks prerequisites (Node.js 18+, npm 9+)
- ✅ Verifies API server is running
- ✅ Installs dependencies if needed
- ✅ Runs all security tests
- ✅ Runs light load tests
- ✅ Shows results with color-coded output

### Option 2: PowerShell One-Liner
```powershell
cd server; npm run test:phase1
```

---

## 📋 Step-by-Step Instructions

### Step 1: Start the API Server
```bash
# In the root project directory
cd server
npm start
```
**Wait until you see**: "Server running on http://localhost:5000"

### Step 2: Run Tests (in new terminal)
```bash
# Option A - Easiest (Windows batch file)
run-phase1-tests.bat

# Option B - Manual npm commands
cd server
npm run test:security      # Just security tests
npm run test:load:light    # Just light load test
npm run test:phase1        # All tests combined
```

### Step 3: Review Results
After tests complete, you'll see:
- ✅ PASS or ⚠️ FAIL for each test
- Performance metrics (latency, throughput, error rate)
- Recommendations for any failures

---

## 🧪 Individual Test Commands

```bash
# From server directory:

# Run only security validation tests
npm run test:security

# Run only light load test (100 concurrent users)
npm run test:load:light

# Run all load tests (light + medium)
npm run test:load

# Run everything together
npm run test:phase1
```

---

## 📊 What Gets Tested

### Security Tests (6 tests)
- ✅ Rate limiting enabled
- ✅ Input validation working
- ✅ Authentication required
- ✅ Security headers present
- ✅ No stack traces exposed
- ✅ CORS properly configured

### Load Tests (Light Level)
- ✅ 100 concurrent users
- ✅ P95 latency < 500ms
- ✅ Error rate < 5%
- ✅ Graceful handling under load
- ✅ Rate-limit headers working

---

## ✅ Success Criteria

### ALL Tests Should Show:
- **Security**: All 6 tests = PASS ✅
- **Load**: P95 latency < 500ms ✅
- **Load**: Error rate < 5% ✅
- **No console errors** in output

### If Tests Fail:
1. **API server not running?**
   ```bash
   npm start  # Run in server directory
   ```

2. **npm dependencies missing?**
   ```bash
   npm install  # Run in server directory
   ```

3. **Port 5000 in use?**
   ```bash
   # Find what's using port 5000
   netstat -ano | find "5000"
   
   # Kill the process (Windows)
   taskkill /PID <PID> /F
   ```

---

## 📝 Next Steps After Testing

1. **Review Results**
   - Check output for PASS/FAIL on all tests
   - Note any failed security validations

2. **Manual Acceptance Testing**
   - Open `PHASE_1_TESTING_CHECKLIST.md`
   - Follow 6 user role workflows
   - Mark tests as PASS/FAIL

3. **Document Findings**
   - Fill in bug tracking section
   - Note any issues found

4. **Re-test If Issues Found**
   ```bash
   npm run test:phase1
   ```

5. **Sign-Off**
   - Complete go/no-go decision in checklist
   - Get sign-offs from QA Lead, Dev Lead, Product Manager

---

## 🔧 Troubleshooting

### Issue: "npm: command not found"
```bash
# Install Node.js with npm from https://nodejs.org/
# Requires v18+ and npm 9+

# Verify installation
node --version
npm --version
```

### Issue: "Cannot find module 'ts-node'"
```bash
cd server
npm install
```

### Issue: "ECONNREFUSED 127.0.0.1:5000"
The API server isn't running.
```bash
# Terminal 1: Start API server
cd server
npm start

# Terminal 2: Run tests (after server starts)
npm run test:phase1
```

### Issue: "Port 5000 already in use"
```bash
# Find process using port 5000
netstat -ano | find "5000"

# Kill it (replace PID with actual process ID)
taskkill /PID 5000 /F
```

### Issue: Tests timeout
The API server might be too slow. Check:
1. Server logs for errors
2. Database connection status
3. System resources (RAM, CPU)

---

## 📊 Understanding Test Output

### Security Test Output Example
```
✅ PASS - Rate Limiting Test (125ms)
   Rate-limit headers detected in response

✅ PASS - Input Validation Test (118ms)
   Invalid inputs properly rejected (400 status)

✅ PASS - Authentication Test (112ms)
   Unauthorized requests properly blocked (401)

⚠️ WARN - Security Headers Test (150ms)
   Only 2 of 5 expected security headers found
```

### Load Test Output Example
```
📊 Load Test Results - Light Level
Concurrent Users: 100
Requests per User: 10
Total Requests: 1000

Metrics:
  Min Latency: 45ms
  Avg Latency: 156ms
  P95 Latency: 320ms ✅
  P99 Latency: 450ms ✅
  Max Latency: 890ms

  Throughput: 145 req/sec
  Success Rate: 99.2% ✅
  Error Rate: 0.8% ✅
  429 (Rate Limited): 8

✅ PASS - Light load test completed successfully
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `PHASE_1_TESTING_GUIDE.md` | Complete testing strategy & methodology |
| `PHASE_1_TESTING_CHECKLIST.md` | Detailed 75+ item checklist for QA team |
| `SECURITY_IMPLEMENTATION_COMPLETE.md` | What's been implemented & secured |
| `run-phase1-tests.bat` | Windows batch file automation |
| `run-phase1-tests.sh` | Linux/Mac shell script automation |

---

## 🎯 Testing Window

- **Start Date**: March 2, 2026
- **End Date**: March 16, 2026
- **Duration**: 2 weeks
- **Sign-Off Deadline**: March 16, 2026

---

## ❓ Questions?

Refer to:
1. **For testing strategy**: `PHASE_1_TESTING_GUIDE.md`
2. **For detailed checklist**: `PHASE_1_TESTING_CHECKLIST.md`
3. **For technical issues**: Check server logs in `server/` directory

---

**Status**: Phase 1 testing infrastructure ready for execution ✅
