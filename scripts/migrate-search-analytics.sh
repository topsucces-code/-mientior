#!/bin/bash
set -e

echo "🔍 Search Analytics Migration Script"
echo "====================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  exit 1
fi

# Load environment variables
source .env

# Check if database URL is set
if [ -z "$PRISMA_DATABASE_URL" ]; then
  echo "❌ Error: PRISMA_DATABASE_URL not set in .env"
  exit 1
fi

echo "📊 Creating database backup..."
# Check if pg_dump is available
if command -v pg_dump &> /dev/null; then
  pg_dump $PRISMA_DATABASE_URL > "backup_search_analytics_$(date +%Y%m%d_%H%M%S).sql" || {
    echo "⚠️  Warning: Could not create backup"
    read -p "Continue without backup? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  }
else
  echo "⚠️  Warning: pg_dump not found, skipping backup"
  read -p "Continue without backup? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "🔄 Generating Prisma migration..."
if ! npx prisma migrate dev --name add_search_log_model; then
  echo ""
  echo "❌ Migration failed. This might be due to a broken migration history."
  echo "💡 You can try syncing the schema directly (be careful in production):"
  echo "   npx prisma db push"
  exit 1
fi

echo "✅ Migration completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Review the generated migration in prisma/migrations/"
echo "2. Test the search analytics functionality"
echo "3. Deploy to production with: npx prisma migrate deploy"
