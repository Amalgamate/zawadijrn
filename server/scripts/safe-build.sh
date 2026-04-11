#!/bin/bash
# Force Prisma migration deployment
set -e

echo "🔄 Starting migration deployment..."

# Step 1: Run pre-deploy fixes
echo "Step 1: Running pre-deploy migration fixes..."
node scripts/pre-deploy.js

# Step 2: Clear any stuck migrations
echo "Step 2: Checking migration status..."
npx prisma migrate status || true

# Step 3: Deploy all pending migrations
echo "Step 3: Deploying migrations..."
npx prisma migrate deploy --skip-generate

# Step 4: Regenerate Prisma client with actual DB schema
echo "Step 4: Syncing Prisma client with database..."
npx prisma generate

# Step 5: Compile TypeScript
echo "Step 5: Compiling TypeScript..."
npx tsc

echo "✅ Build complete!"
