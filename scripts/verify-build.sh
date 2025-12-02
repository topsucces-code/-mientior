#!/bin/bash

# Verify Build Script
# Usage: ./scripts/verify-build.sh

echo "🔍 Starting Build Verification..."

# 1. Check dependencies
echo "📦 Checking dependencies..."
npm list --depth=0 > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ Dependency check failed"
  exit 1
fi

# 2. Type check
echo "Typescript checking..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

# 3. Lint
echo "🎨 Linting..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

# 4. Build
echo "🏗️ Building..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Build Verification Passed!"
exit 0
