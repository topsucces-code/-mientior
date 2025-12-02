#!/bin/bash

# Marketplace Phase 1 Migration Script
# This script applies the marketplace schema changes and verifies the setup

set -e

echo "🚀 Marketplace Phase 1 Migration"
echo "================================"
echo ""

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Backup database (optional but recommended)
echo "📦 Step 1: Database Backup"
read -p "Do you want to backup the database first? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating backup..."
    npm run db:backup || echo "⚠️  Backup script not found, skipping..."
fi

# Format Prisma schema
echo ""
echo "📝 Step 2: Format Prisma Schema"
npx prisma format

# Generate migration
echo ""
echo "🔄 Step 3: Generate Migration"
npx prisma migrate dev --name add_marketplace_phase1 --create-only

echo ""
echo "📋 Migration file created. Please review it before applying."
read -p "Do you want to apply the migration now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Apply migration
    echo ""
    echo "⚡ Step 4: Apply Migration"
    npx prisma migrate deploy
    
    # Generate Prisma Client
    echo ""
    echo "🔨 Step 5: Generate Prisma Client"
    npx prisma generate
    
    # Verify schema
    echo ""
    echo "✅ Step 6: Verify Schema"
    npx prisma validate
    
    echo ""
    echo "🎉 Migration Complete!"
    echo ""
    echo "Next steps:"
    echo "1. Review PHASE_1_IMPLEMENTATION_COMPLETE.md"
    echo "2. Test commission calculation with sample orders"
    echo "3. Set up payout cron job"
    echo "4. Update checkout flow for multi-vendor support"
    echo ""
    echo "To open Prisma Studio and inspect the new tables:"
    echo "  npx prisma studio"
else
    echo ""
    echo "⏸️  Migration not applied. To apply later, run:"
    echo "  npx prisma migrate deploy"
fi
