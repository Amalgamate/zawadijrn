#!/bin/bash
# PHASE 1 QUICK START TEST RUNNER
# Run all Phase 1 tests with one command
# Usage: ./run-phase1-tests.sh

set -e

echo "=============================================
🧪 ZAWADI SMS - PHASE 1 TESTING SUITE
============================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}✓ Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found. Install Node.js 18+${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found. Install npm 9+${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}✗ Node.js 18+ required (found: $(node --version))${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node $(node --version) found${NC}"
echo -e "${GREEN}✓ npm $(npm --version) found${NC}"

# Navigate to server directory
cd "$(dirname "$0")/server" || exit 1

# Check if dependencies installed
if [ ! -d "node_modules" ]; then
    echo -e "\n${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Check if server is running
echo -e "\n${YELLOW}🔍 Checking if API server is running...${NC}"
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  API server not running. Please start it first:${NC}"
    echo -e "    ${GREEN}npm start${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API server is running at http://localhost:5000${NC}"

# Run tests
echo -e "\n${YELLOW}🔒 Running Security Tests...${NC}"
npm run test:security || true

echo -e "\n${YELLOW}⚡ Running Load Tests (Light)...${NC}"
npm run test:load:light || true

echo -e "\n${YELLOW}📊 Running Combined Tests...${NC}"
npm run test:phase1 || true

echo -e "\n${GREEN}=============================================
✅ PHASE 1 TESTING COMPLETE
=============================================${NC}"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo -e "1. Review test results above"
echo -e "2. Check PHASE_1_TESTING_CHECKLIST.md for detailed testing guide"
echo -e "3. Open test results in: ./test-results.json (if generated)"
echo -e "4. Fix any identified issues"
echo -e "5. Re-run tests to verify fixes"

echo -e "\n${YELLOW}📚 Documentation:${NC}"
echo -e "- PHASE_1_TESTING_GUIDE.md - Complete testing strategy"
echo -e "- PHASE_1_TESTING_CHECKLIST.md - Detailed checklist (print and use)"
echo -e "- SECURITY_IMPLEMENTATION_COMPLETE.md - What we're testing"
