#!/bin/bash
set -e

echo "🔍 Applying Facets Indexes Migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
  else
    echo "❌ Error: DATABASE_URL not set and .env file not found"
    exit 1
  fi
fi

# Verify PostgreSQL connection
echo "📡 Testing database connection..."
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1 || {
  echo "❌ Error: Cannot connect to database"
  exit 1
}

# Apply migration
echo "📝 Creating indexes (this may take 1-2 minutes)..."
psql "$DATABASE_URL" -f prisma/facets-indexes-migration.sql

echo "✅ Facets indexes migration completed successfully!"
echo ""
echo "📊 Verify indexes with:"
echo "  psql \$DATABASE_URL -c \"SELECT indexname FROM pg_indexes WHERE tablename IN ('products', 'product_variants') AND indexname LIKE 'idx_%';\""
