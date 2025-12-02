#!/bin/bash

# ================================================================
# APPLY TRIGRAM SEARCH MIGRATION SCRIPT
# ================================================================
# This script applies the pg_trgm fuzzy search migration to the
# PostgreSQL database. It includes safety checks, optional backup,
# and comprehensive validation.
#
# Usage:
#   bash scripts/apply-trigram-search-migration.sh
#
# Prerequisites:
#   - PostgreSQL with pg_trgm extension available
#   - PRISMA_DATABASE_URL environment variable set
#   - psql command-line tool installed
# ================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Migration file path
MIGRATION_FILE="prisma/trigram-search-migration.sql"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}TRIGRAM FUZZY SEARCH MIGRATION${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# ================================================================
# SECTION 1: Pre-flight Checks
# ================================================================

echo -e "${YELLOW}[1/6] Running pre-flight checks...${NC}"

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}✗ Migration file not found: $MIGRATION_FILE${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Migration file found${NC}"

# Check if PRISMA_DATABASE_URL is set
if [ -z "$PRISMA_DATABASE_URL" ]; then
  echo -e "${RED}✗ PRISMA_DATABASE_URL environment variable is not set${NC}"
  echo -e "${YELLOW}Please set it in your .env file or export it:${NC}"
  echo -e "  export PRISMA_DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
  exit 1
fi
echo -e "${GREEN}✓ Database URL configured${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
  echo -e "${RED}✗ psql command not found${NC}"
  echo -e "${YELLOW}Please install PostgreSQL client tools${NC}"
  exit 1
fi
echo -e "${GREEN}✓ psql client available${NC}"

# Test database connection
if ! psql "$PRISMA_DATABASE_URL" -c "SELECT 1" &> /dev/null; then
  echo -e "${RED}✗ Cannot connect to database${NC}"
  echo -e "${YELLOW}Please check your PRISMA_DATABASE_URL and database server${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"

echo ""

# ================================================================
# SECTION 2: Display Migration Summary
# ================================================================

echo -e "${YELLOW}[2/6] Migration Summary${NC}"
echo -e "${BLUE}This migration will:${NC}"
echo -e "  • Enable the pg_trgm extension for fuzzy text search"
echo -e "  • Create 6 trigram indexes (3 GIN + 3 GIST) on:"
echo -e "    - Product.name (for product suggestions)"
echo -e "    - Category.name (for category suggestions)"
echo -e "    - Tag.name (for tag suggestions)"
echo -e "  • Configure similarity thresholds for optimal autocomplete"
echo ""

# ================================================================
# SECTION 3: Backup Confirmation
# ================================================================

echo -e "${YELLOW}[3/6] Database Backup${NC}"
read -p "Would you like to create a backup before proceeding? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  BACKUP_FILE="backup_trigram_migration_$(date +%Y%m%d_%H%M%S).sql"
  echo -e "${BLUE}Creating backup: $BACKUP_FILE${NC}"

  pg_dump "$PRISMA_DATABASE_URL" \
    --table='"Product"' \
    --table='"Category"' \
    --table='"Tag"' \
    --no-owner \
    --no-acl \
    > "$BACKUP_FILE"

  if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo -e "  Location: $BACKUP_FILE"
  else
    echo -e "${RED}✗ Backup failed${NC}"
    read -p "Continue without backup? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}⚠ Proceeding without backup${NC}"
fi

echo ""

# ================================================================
# SECTION 4: User Confirmation
# ================================================================

echo -e "${YELLOW}[4/6] Final Confirmation${NC}"
read -p "Apply the trigram search migration now? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Migration cancelled${NC}"
  exit 0
fi

echo ""

# ================================================================
# SECTION 5: Execute Migration
# ================================================================

echo -e "${YELLOW}[5/6] Executing migration...${NC}"
echo ""

if psql "$PRISMA_DATABASE_URL" -f "$MIGRATION_FILE"; then
  echo ""
  echo -e "${GREEN}✓ Migration executed successfully${NC}"
else
  echo ""
  echo -e "${RED}✗ Migration failed${NC}"
  echo -e "${YELLOW}Troubleshooting:${NC}"
  echo -e "  • Check that PostgreSQL version is 9.1 or higher"
  echo -e "  • Ensure pg_trgm extension is available (contrib package)"
  echo -e "  • Verify database user has CREATE EXTENSION privileges"
  echo -e "  • Check database logs for detailed error messages"
  echo ""
  if [ -f "$BACKUP_FILE" ]; then
    echo -e "${YELLOW}To restore from backup:${NC}"
    echo -e "  psql \$PRISMA_DATABASE_URL < $BACKUP_FILE"
  fi
  exit 1
fi

echo ""

# ================================================================
# SECTION 6: Post-Migration Validation
# ================================================================

echo -e "${YELLOW}[6/6] Validating migration...${NC}"

# Check pg_trgm extension
EXTENSION_CHECK=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_extension WHERE extname = 'pg_trgm'")
if [ "$EXTENSION_CHECK" -eq 1 ]; then
  echo -e "${GREEN}✓ pg_trgm extension is active${NC}"
else
  echo -e "${RED}✗ pg_trgm extension not found${NC}"
  exit 1
fi

# Count trigram indexes
INDEX_COUNT=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE '%_trgm%'")
echo -e "${GREEN}✓ Created $INDEX_COUNT trigram indexes${NC}"

# Get statistics
PRODUCT_COUNT=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Product\"")
CATEGORY_COUNT=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Category\"")
TAG_COUNT=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Tag\"")

echo -e "${GREEN}✓ Indexed records:${NC}"
echo -e "  • Products: $PRODUCT_COUNT"
echo -e "  • Categories: $CATEGORY_COUNT"
echo -e "  • Tags: $TAG_COUNT"

# Test a simple similarity query
TEST_RESULT=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT similarity('test', 'testing')")
if [ -n "$TEST_RESULT" ]; then
  echo -e "${GREEN}✓ Similarity function working (test score: $TEST_RESULT)${NC}"
else
  echo -e "${RED}✗ Similarity function test failed${NC}"
  exit 1
fi

echo ""

# ================================================================
# SUCCESS MESSAGE AND NEXT STEPS
# ================================================================

echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}✓ MIGRATION COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Check migration status:"
echo -e "     ${YELLOW}npm run db:trigram-search:status${NC}"
echo ""
echo -e "  2. Test fuzzy search queries:"
echo -e "     ${YELLOW}npm run db:trigram-search:test${NC}"
echo ""
echo -e "  3. Analyze query performance:"
echo -e "     ${YELLOW}npm run db:trigram-search:analyze${NC}"
echo ""
echo -e "  4. Configure similarity threshold in .env:"
echo -e "     ${YELLOW}SEARCH_SIMILARITY_THRESHOLD=0.3${NC}"
echo ""
echo -e "${BLUE}Documentation:${NC}"
echo -e "  See README_TRIGRAM_SEARCH.md for detailed usage guide"
echo ""
echo -e "${GREEN}Fuzzy search is now ready to use! 🚀${NC}"
echo ""

# ================================================================
# CLEANUP RECOMMENDATION
# ================================================================

if [ -f "$BACKUP_FILE" ]; then
  echo -e "${YELLOW}Note: Backup file created - $BACKUP_FILE${NC}"
  echo -e "You can safely delete it after verifying the migration works correctly."
  echo ""
fi
