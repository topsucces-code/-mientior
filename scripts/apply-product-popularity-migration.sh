#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Applying Product Popularity Field Migration${NC}"
echo ""

# Check prerequisites
if [ ! -f "prisma/migrations/add-product-popularity-field.sql" ]; then
  echo -e "${RED}❌ Migration file not found: prisma/migrations/add-product-popularity-field.sql${NC}"
  exit 1
fi

if [ -z "$PRISMA_DATABASE_URL" ]; then
  echo -e "${RED}❌ PRISMA_DATABASE_URL environment variable is not set${NC}"
  echo -e "${YELLOW}Please set it in your .env file or export it${NC}"
  exit 1
fi

# Display migration info
echo -e "${YELLOW}This migration will:${NC}"
echo "  • Add popularity column to products table (INTEGER, default 0)"
echo "  • Create index on popularity for efficient sorting/filtering"
echo "  • Enable popularity-based product ranking"
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

  if pg_dump "$PRISMA_DATABASE_URL" -t products -f "$BACKUP_FILE"; then
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
if psql "$PRISMA_DATABASE_URL" -f prisma/migrations/add-product-popularity-field.sql; then
  echo ""
  echo -e "${GREEN}✅ Migration completed successfully!${NC}"
  echo ""

  # Validation queries
  echo -e "${BLUE}🔍 Validating migration...${NC}"
  echo ""

  # Check if column exists
  COLUMN_EXISTS=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'popularity';")
  if [ "$COLUMN_EXISTS" -eq 1 ]; then
    echo -e "Popularity column: ${GREEN}✓ Created${NC}"
  else
    echo -e "Popularity column: ${RED}✗ Not found${NC}"
  fi

  # Check if index exists
  INDEX_EXISTS=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_popularity';")
  if [ "$INDEX_EXISTS" -eq 1 ]; then
    echo -e "Popularity index: ${GREEN}✓ Created${NC}"
  else
    echo -e "Popularity index: ${YELLOW}⚠ Building (may still be in progress)${NC}"
  fi

  # Check total products
  TOTAL_PRODUCTS=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM products;")
  echo -e "Total products: ${GREEN}${TOTAL_PRODUCTS}${NC}"

  # Check default popularity value
  DEFAULT_POPULARITY=$(psql "$PRISMA_DATABASE_URL" -t -c "SELECT COUNT(*) FROM products WHERE popularity = 0;")
  echo -e "Products with default popularity (0): ${GREEN}${DEFAULT_POPULARITY}${NC}"

  echo ""
  echo -e "${GREEN}✅ Validation completed!${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "  1. Generate Prisma Client: npx prisma generate"
  echo "  2. Calculate popularity scores: npm run ranking:calculate"
  echo "  3. Update MeiliSearch ranking: npm run ranking:update-meilisearch"
  echo "  4. Reindex products: npm run search:reindex"
  echo "  5. Or run full sync: npm run ranking:sync"
  echo ""

  # Rollback information
  echo -e "${BLUE}📋 Rollback instructions (if needed):${NC}"
  if [[ $BACKUP_FILE ]]; then
    echo "  1. Restore from backup: psql \$PRISMA_DATABASE_URL < $BACKUP_FILE"
  else
    echo "  1. Drop column: psql \$PRISMA_DATABASE_URL -c \"ALTER TABLE products DROP COLUMN popularity;\""
    echo "  2. Drop index: psql \$PRISMA_DATABASE_URL -c \"DROP INDEX IF EXISTS idx_products_popularity;\""
  fi
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
  echo "  • Check if column already exists"
  exit 1
fi
