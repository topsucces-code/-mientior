#!/bin/bash

# Database Backup Script
# Usage: ./scripts/backup-db.sh

# Configuration
BACKUP_DIR="./backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="mientior"
RETENTION_DAYS=30

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Create backup
echo "📦 Starting backup for $DB_NAME..."
FILENAME="$BACKUP_DIR/$DB_NAME_$TIMESTAMP.sql.gz"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set."
  echo "   Please source your .env file or set the variable."
  exit 1
fi

# Perform dump and compress
# Note: Requires pg_dump to be installed
if pg_dump "$DATABASE_URL" | gzip > "$FILENAME"; then
  echo "✅ Backup created successfully: $FILENAME"
  
  # Print size
  SIZE=$(du -h "$FILENAME" | cut -f1)
  echo "📊 Size: $SIZE"
else
  echo "❌ Error: Backup failed"
  rm -f "$FILENAME"
  exit 1
fi

# Cleanup old backups
echo "🧹 Cleaning up backups older than $RETENTION_DAYS days..."
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "✨ Backup process completed"
