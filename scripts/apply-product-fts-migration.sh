#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Applying Product Full-Text Search Migration${NC}"
echo ""

# Check prerequisites
if [ ! -f "prisma/product-fts-migration.sql" ]; then
  echo -e "${RED}❌ Migration file not found: prisma/product-fts-migration.sql${NC}"
  exit 1
fi

if [ -z "$PRISMA_DATABASE_URL" ]; then
  echo -e "${RED}❌ PRISMA_DATABASE_URL environment variable is not set${NC}"
  echo -e "${YELLOW}Please set it in your .env file or export it${NC}"
  exit 1
fi

# Display migration info
echo -e "${YELLOW}This migration will:${NC}"
echo "  • Add search_vector and search_vector_simple columns to products table"
echo "  • Create triggers for automatic tsvector updates"
echo "  • Create GIN indexes for fast full-text search"
echo "  • Populate search vectors for all existing products"
echo ""

# Confirm execution
read -p "$(echo -e ${YELLOW}Continue with migration? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⚠️  Migration cancelled${NC}"
  exit 0
fi

echo ""

# Optional backup step
read -p "$(echo -e ${YELLOW}Create database backup before migration? [y/N]:${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}📦 Creating backup...${NC}"
  BACKUP_DIR="backups"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/products_table_backup_$(date +%Y%m%d_%H%M%S).sql"

  if pg_dump "$PRISMA_DATABASE_URL" -t products -t product_variants -f "$BACKUP_FILE"; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
  else
    echo -e "${RED}❌ Backup failed!${NC}"
    read -p "$(echo -e ${YELLOW}Continue without backup? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}⚠️  Migration cancelled${NC}"
      exit 0
    fi
  fi
fi

echo ""
echo -e "${BLUE}📦 Executing migration...${NC}"

# Execute migration
if psql "$PRISMA_DATABASE_URL" -f prisma/product-fts-migration.sql; then
  echo ""
  echo -e "${GREEN}✅ Migration completed successfully!${NC}"
  echo ""

  # Validation queries
  echo -e "${BLUE}🔍 Validating migration...${NC}"
  echo ""

  # Check total products
  TOTAL_PRODUCTS=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM products;")
  echo -e "Total products: ${GREEN}${TOTAL_PRODUCTS}${NC}"

  # Check indexed products
  INDEXED_PRODUCTS=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM products WHERE search_vector IS NOT NULL;")
  echo -e "Indexed products: ${GREEN}${INDEXED_PRODUCTS}${NC}"

  # Calculate coverage
  if [ "$TOTAL_PRODUCTS" -gt 0 ]; then
    COVERAGE=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT ROUND((COUNT(*) FILTER (WHERE search_vector IS NOT NULL)::NUMERIC / COUNT(*) * 100), 2) FROM products;")
    echo -e "Coverage: ${GREEN}${COVERAGE}%${NC}"
  fi

  # Check indexes
  echo ""
  echo -e "${BLUE}Checking indexes:${NC}"
  psql "$PRISMA_DATABASE_URL" -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE 'idx_product_search%';"

  echo ""
  echo -e "${GREEN}✅ Validation completed!${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Run: npm run db:product-search:status"
  echo "  2. Test search: npm run db:product-search:test"
  echo "  3. Clear cache: npm run db:product-search:clear-cache"
  echo ""

  # Rollback information
  echo -e "${BLUE}📋 Rollback instructions (if needed):${NC}"
  if [[ $BACKUP_FILE ]]; then
    echo "  1. Restore from backup: psql \$PRISMA_DATABASE_URL < $BACKUP_FILE"
  else
    echo "  1. Drop columns: psql \$PRISMA_DATABASE_URL -c \"ALTER TABLE products DROP COLUMN search_vector, DROP COLUMN search_vector_simple;\""
  fi
  echo "  2. Drop triggers: psql \$PRISMA_DATABASE_URL -c \"DROP TRIGGER IF EXISTS product_search_vector_update ON products;\""
  echo "  3. Drop function: psql \$PRISMA_DATABASE_URL -c \"DROP FUNCTION IF EXISTS update_product_search_vector();\""
  echo ""
else
  echo ""
  echo -e "${RED}❌ Migration failed!${NC}"
  echo -e "${YELLOW}Please check the error messages above${NC}"
  echo ""
  echo -e "${BLUE}Troubleshooting:${NC}"
  echo "  • Verify PRISMA_DATABASE_URL is correct"
  echo "  • Check PostgreSQL connection"
  echo "  • Ensure you have necessary permissions"
  echo "  • Check if columns already exist"
  exit 1
fi
