#!/bin/bash

# Codebase Analysis Script
# Identifies files that need migration to new utilities

set -e

echo "🔍 Analyzing Mientior Codebase..."
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
total_files=0
process_env_files=0
console_files=0
direct_response_files=0
any_type_files=0

# Create temporary files for results
temp_dir=$(mktemp -d)
process_env_list="$temp_dir/process_env.txt"
console_list="$temp_dir/console.txt"
response_list="$temp_dir/response.txt"
any_type_list="$temp_dir/any_type.txt"

echo "📊 Scanning TypeScript files in src/..."
echo ""

# Find all TypeScript files
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  ((total_files++))
  
  # Check for process.env usage
  if grep -q "process\.env\." "$file" 2>/dev/null; then
    echo "$file" >> "$process_env_list"
    ((process_env_files++))
  fi
  
  # Check for console.* usage
  if grep -q "console\.\(log\|error\|warn\|info\)" "$file" 2>/dev/null; then
    echo "$file" >> "$console_list"
    ((console_files++))
  fi
  
  # Check for direct NextResponse.json usage (excluding new utilities)
  if grep -q "NextResponse\.json" "$file" 2>/dev/null && \
     ! echo "$file" | grep -q "src/lib/api-response.ts"; then
    echo "$file" >> "$response_list"
    ((direct_response_files++))
  fi
  
  # Check for 'any' type usage
  if grep -q ": any" "$file" 2>/dev/null || \
     grep -q "<any>" "$file" 2>/dev/null; then
    echo "$file" >> "$any_type_list"
    ((any_type_files++))
  fi
done

# Count files
process_env_count=$(wc -l < "$process_env_list" 2>/dev/null || echo "0")
console_count=$(wc -l < "$console_list" 2>/dev/null || echo "0")
response_count=$(wc -l < "$response_list" 2>/dev/null || echo "0")
any_type_count=$(wc -l < "$any_type_list" 2>/dev/null || echo "0")

# Display summary
echo "📈 SUMMARY"
echo "=========="
echo ""
echo -e "${BLUE}Total TypeScript files:${NC} $total_files"
echo ""
echo -e "${RED}Files using process.env:${NC} $process_env_count"
echo -e "${RED}Files using console.*:${NC} $console_count"
echo -e "${YELLOW}Files using NextResponse.json:${NC} $response_count"
echo -e "${YELLOW}Files using 'any' type:${NC} $any_type_count"
echo ""

# Calculate migration progress
total_issues=$((process_env_count + console_count + response_count))
echo -e "${BLUE}Total files needing migration:${NC} $total_issues"
echo ""

# Priority files (API routes)
echo "🎯 PRIORITY: API Routes"
echo "======================="
echo ""

api_routes=$(find src/app/api -name "route.ts" 2>/dev/null | wc -l)
echo -e "${BLUE}Total API routes:${NC} $api_routes"

# Check how many API routes need migration
api_needs_migration=0
find src/app/api -name "route.ts" 2>/dev/null | while read file; do
  if grep -q "process\.env\.\|console\.\|NextResponse\.json" "$file" 2>/dev/null; then
    ((api_needs_migration++))
  fi
done

echo ""

# Detailed lists
if [ "$process_env_count" -gt 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}FILES USING process.env (Need env.ts):${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  head -20 "$process_env_list"
  if [ "$process_env_count" -gt 20 ]; then
    echo "... and $((process_env_count - 20)) more files"
  fi
fi

if [ "$console_count" -gt 0 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}FILES USING console.* (Need logger.ts):${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  head -20 "$console_list"
  if [ "$console_count" -gt 20 ]; then
    echo "... and $((console_count - 20)) more files"
  fi
fi

if [ "$response_count" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}FILES USING NextResponse.json (Need api-response.ts):${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  head -20 "$response_list"
  if [ "$response_count" -gt 20 ]; then
    echo "... and $((response_count - 20)) more files"
  fi
fi

echo ""
echo "💡 RECOMMENDATIONS"
echo "=================="
echo ""
echo "1. Start with API routes (highest priority)"
echo "2. Replace process.env with env from @/lib/env"
echo "3. Replace console.* with logger from @/lib/logger"
echo "4. Replace NextResponse.json with apiSuccess/apiError"
echo "5. Add request validation with validateRequest"
echo ""
echo "📚 See MIGRATION_EXAMPLE.md for detailed guide"
echo ""

# Cleanup
rm -rf "$temp_dir"

echo "✅ Analysis complete!"
