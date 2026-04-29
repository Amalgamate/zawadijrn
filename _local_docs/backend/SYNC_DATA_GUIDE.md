# 🔄 Data Sync Guide - Trends CORE V1.0

## Overview

Two methods to sync production data to your local instance:

### Method 1: Prisma ORM Sync (Recommended - Easier)
No pg_dump or complex setup needed. Just a database URL.

### Method 2: pg_dump + Restore (Complete backup)
Full database dump for complete schema + data sync.

---

## 📋 Prerequisites

1. **Local PostgreSQL running** on `localhost:5432`
2. **Production database URL** from Render environment
3. **Node.js + dependencies installed**

---

## Getting Production Database URL

### From Render Dashboard:
1. Go to https://dashboard.render.com
2. Select your **Trends CORE V1.0 backend** service
3. Click **Environment** tab
4. Find `DATABASE_URL` (may be called different names)
5. Copy the full URL

It will look like:
```
postgresql://user:password@host:port/database
```

### Common Render patterns:
- **Host**: Usually `dpg-xxxxx.render.com` (not localhost!)
- **Port**: Usually `5432` or a custom port
- **Database**: Usually `zawadi_sms`

---

## Method 1: Sync Using Prisma (EASIEST)

### Step 1: Get Production URL
```powershell
# Set from clipboard or copy from Render:
$env:PROD_DATABASE_URL="postgresql://user:pass@host:5432/zawadi_sms"
```

### Step 2: Run Sync
```powershell
cd server
node sync-prisma.js
```

**What happens:**
- ✅ Reads from production database
- ✅ Clears local database tables
- ✅ Inserts all data (~150k+ records expected)
- ✅ Respects foreign keys

**Time**: Usually 2-5 minutes depending on data size

---

## Method 2: pg_dump Approach

### Step 1: Get Production URL
Same as Method 1 above

### Step 2: Set Environment Variables
```powershell
# Extract components from URL
$env:PROD_DB_HOST="dpg-xxxxx.render.com"
$env:PROD_DB_PORT="5432"
$env:PROD_DB_USER="postgres"
$env:PROD_DB_PASSWORD="your-password-here"
```

### Step 3: Dump Production
```powershell
cd server
node sync-data.js --dump
```

### Step 4: Restore to Local
```powershell
node sync-data.js --restore
```

### Step 5: Verify
```powershell
node sync-data.js --verify
```

---

## After Sync Complete

### Verify Sync Success
```powershell
# Check local database
psql -U postgres -d zawadi_sms -c "SELECT COUNT(*) FROM learners; SELECT COUNT(*) FROM summative_tests; SELECT COUNT(*) FROM summative_results;"
```

### Regenerate Types (if needed)
```powershell
npm run prisma:generate
```

### Test Queries Work (Optional)
```powershell
node check-test-data-fixed.js
```

---

## Troubleshooting

### "Connection refused"
- Verify local PostgreSQL is running: `psql --version`
- Check port: `netstat -ano | findstr :5432`

### "Invalid password"
- Double-check credentials from Render dashboard
- Ensure special characters are properly escaped

### "Disk space"
- Some databases are large (1GB+)
- Ensure `C:\` has >2GB free space

### "Foreign key violations"
- Sync tables in dependency order (already handled)
- If stuck, clear local DB first: `DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`

---

## Quick Reference Commands

```powershell
# Set production URL
$env:PROD_DATABASE_URL="postgresql://user:pass@host:5432/db"

# Full sync (dump + restore)
cd server && node sync-data.js

# Just Prisma method
node sync-prisma.js

# Verify afterward
node sync-data.js --verify

# Check local counts
psql -U postgres -d zawadi_sms -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
```

---

## Next Steps After Sync

1. ✅ Frontend will see production data locally
2. ✅ All SQL queries will run against production data copy
3. ✅ Safe to modify/test locally without affecting production
4. ✅ Can sync again anytime to refresh

---

Need help? Check the logs - they tell you exactly what succeeded/failed.
