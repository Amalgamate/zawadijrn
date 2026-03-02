@echo off
REM PHASE 1 QUICK START TEST RUNNER (Windows)
REM Run all Phase 1 tests with one command
REM Usage: run-phase1-tests.bat

setlocal enabledelayedexpansion

echo.
echo =============================================
echo 🧪 ZAWADI SMS - PHASE 1 TESTING SUITE
echo =============================================
echo.

REM Check prerequisites
echo ✓ Checking prerequisites...

where node >nul 2>nul
if errorlevel 1 (
    echo ✗ Node.js not found. Install Node.js 18+
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo ✗ npm not found. Install npm 9+
    exit /b 1
)

for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node %NODE_VERSION% found
for /f "tokens=1" %%i in ('npm --version') do echo ✓ npm %%i found

REM Navigate to server directory
cd server
if errorlevel 1 (
    echo Error: Could not change to server directory
    exit /b 1
)

REM Check if dependencies installed
if not exist node_modules (
    echo.
    echo 📦 Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: Failed to install dependencies
        exit /b 1
    )
)

REM Check if server is running
echo.
echo 🔍 Checking if API server is running...
powershell -Command "$null = (Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -ErrorAction SilentlyContinue); if ($?) { exit 0 } else { exit 1 }"
if errorlevel 1 (
    echo ⚠️  API server not running. Please start it first:
    echo    npm start
    exit /b 1
)
echo ✓ API server is running at http://localhost:5000

REM Run tests
echo.
echo 🔒 Running Security Tests...
call npm run test:security
if errorlevel 1 echo ⚠️ Security tests had issues

echo.
echo ⚡ Running Load Tests (Light)...
call npm run test:load:light
if errorlevel 1 echo ⚠️ Load tests had issues

echo.
echo 📊 Running Combined Tests...
call npm run test:phase1
if errorlevel 1 echo ⚠️ Combined tests had issues

echo.
echo =============================================
echo ✅ PHASE 1 TESTING COMPLETE
echo =============================================
echo.

echo 📋 Next Steps:
echo 1. Review test results above
echo 2. Check PHASE_1_TESTING_CHECKLIST.md for detailed testing guide
echo 3. Fix any identified issues
echo 4. Re-run tests to verify fixes
echo.

echo 📚 Documentation:
echo - PHASE_1_TESTING_GUIDE.md - Complete testing strategy
echo - PHASE_1_TESTING_CHECKLIST.md - Detailed checklist
echo - SECURITY_IMPLEMENTATION_COMPLETE.md - What we're testing
echo.

pause
