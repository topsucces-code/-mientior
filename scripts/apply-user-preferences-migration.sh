#!/bin/bash

# Apply User Preferences Migration Script
# Safely adds the preferences column to the users table
#
# Usage:
#   ./scripts/apply-user-preferences-migration.sh [--dry-run]
#
# Options:
#   --dry-run    Preview changes without applying them

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATION_FILE="$PROJECT_ROOT/prisma/add-user-preferences-migration.sql"

# Parse arguments
DRY_RUN=false
for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  User Preferences Migration Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}Error: Migration file not found at $MIGRATION_FILE${NC}"
    exit 1
fi

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
elif [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)
fi

# Check database URL
if [ -z "$PRISMA_DATABASE_URL" ] && [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: No database URL found. Set PRISMA_DATABASE_URL or DATABASE_URL in .env${NC}"
    exit 1
fi

DB_URL="${PRISMA_DATABASE_URL:-$DATABASE_URL}"

echo -e "${YELLOW}Database:${NC} ${DB_URL%%@*}@***"
echo ""

# Test database connectivity
echo -e "${BLUE}Testing database connectivity...${NC}"
if ! psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to database${NC}"
    echo "Please check your database URL and ensure PostgreSQL is running."
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Check current state
echo -e "${BLUE}Checking current schema...${NC}"
COLUMN_EXISTS=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences');" | tr -d ' ')

if [ "$COLUMN_EXISTS" = "t" ]; then
    echo -e "${YELLOW}⚠ preferences column already exists in users table${NC}"
    echo "Migration has already been applied."
    exit 0
fi

echo -e "${GREEN}✓ preferences column does not exist - migration needed${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}=== DRY RUN MODE ===${NC}"
    echo "The following SQL would be executed:"
    echo ""
    cat "$MIGRATION_FILE"
    echo ""
    echo -e "${YELLOW}No changes were made to the database.${NC}"
    echo "Run without --dry-run to apply the migration."
    exit 0
fi

# Create backup
echo -e "${BLUE}Creating backup of users table structure...${NC}"
BACKUP_FILE="$PROJECT_ROOT/prisma/backups/users_backup_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "$(dirname "$BACKUP_FILE")"

pg_dump "$DB_URL" --table=users --schema-only > "$BACKUP_FILE" 2>/dev/null || {
    echo -e "${YELLOW}⚠ Could not create schema backup (non-critical)${NC}"
}

if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup created at: $BACKUP_FILE${NC}"
fi
echo ""

# Apply migration
echo -e "${BLUE}Applying migration...${NC}"
if psql "$DB_URL" -f "$MIGRATION_FILE"; then
    echo ""
    echo -e "${GREEN}✓ Migration applied successfully${NC}"
else
    echo ""
    echo -e "${RED}✗ Migration failed${NC}"
    echo ""
    echo "Rollback instructions:"
    echo "  If the column was partially created, run:"
    echo "    ALTER TABLE users DROP COLUMN IF EXISTS preferences;"
    exit 1
fi

# Verify migration
echo ""
echo -e "${BLUE}Verifying migration...${NC}"
VERIFY_EXISTS=$(psql "$DB_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences');" | tr -d ' ')

if [ "$VERIFY_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ Migration verified: preferences column exists${NC}"
else
    echo -e "${RED}✗ Verification failed: preferences column not found${NC}"
    exit 1
fi

# Update Prisma client
echo ""
echo -e "${BLUE}Regenerating Prisma client...${NC}"
cd "$PROJECT_ROOT"
npx prisma generate > /dev/null 2>&1 && echo -e "${GREEN}✓ Prisma client regenerated${NC}" || echo -e "${YELLOW}⚠ Could not regenerate Prisma client - run 'npx prisma generate' manually${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Migration completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run personalization:calculate' to calculate initial preferences"
echo "  2. Or use the admin API: POST /api/admin/personalization/recalculate"
echo ""
