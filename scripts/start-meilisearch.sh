#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting MeiliSearch Setup${NC}"
echo ""

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  echo -e "${YELLOW}Please install Docker: https://docs.docker.com/get-docker/${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker installed${NC}"

# Check Docker Compose
if ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Docker Compose is not installed${NC}"
  echo -e "${YELLOW}Please install Docker Compose: https://docs.docker.com/compose/install/${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Docker Compose installed${NC}"

# Check .env file
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env file not found${NC}"
  echo -e "${YELLOW}Please create .env from .env.example${NC}"
  exit 1
fi
echo -e "${GREEN}✅ .env file found${NC}"

# Check MEILISEARCH_MASTER_KEY
# Note: This script expects .env to be bash-compatible (simple KEY=VALUE pairs with # comments)
# Use 'set -a' to export all variables automatically, then source .env, then disable with 'set +a'
# This is more defensive than plain 'source .env' and reduces environment-related issues
set -a
source .env
set +a

if [ -z "$MEILISEARCH_MASTER_KEY" ]; then
  echo -e "${RED}❌ MEILISEARCH_MASTER_KEY not set in .env${NC}"
  echo -e "${YELLOW}Generate a key with: openssl rand -base64 32${NC}"
  exit 1
fi
echo -e "${GREEN}✅ MEILISEARCH_MASTER_KEY configured${NC}"

# Check config file
if [ ! -f "meilisearch.config.json" ]; then
  echo -e "${RED}❌ meilisearch.config.json not found${NC}"
  exit 1
fi
echo -e "${GREEN}✅ meilisearch.config.json found${NC}"

echo ""

# Display migration info
echo -e "${YELLOW}This setup will:${NC}"
echo "  1. Start MeiliSearch Docker container"
echo "  2. Wait for MeiliSearch to be ready"
echo "  3. Initialize indexes with configuration"
echo "  4. Display statistics"
echo ""

# Confirm execution
read -p "$(echo -e ${YELLOW}Continue with setup? [y/N]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}⚠️  Setup cancelled${NC}"
  exit 0
fi

echo ""

# Start MeiliSearch
echo -e "${BLUE}🚀 Starting MeiliSearch container...${NC}"
if docker compose up -d meilisearch; then
  echo -e "${GREEN}✅ MeiliSearch container started${NC}"
else
  echo -e "${RED}❌ Failed to start MeiliSearch container${NC}"
  exit 1
fi

echo ""

# Wait for MeiliSearch to be ready
echo -e "${BLUE}⏳ Waiting for MeiliSearch to be ready...${NC}"
MAX_WAIT=30
WAIT_COUNT=0

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  if docker compose ps meilisearch | grep -q "healthy"; then
    echo -e "${GREEN}✅ MeiliSearch is ready${NC}"
    break
  fi

  # Alternative check using curl
  if curl -f http://localhost:7700/health &> /dev/null; then
    echo -e "${GREEN}✅ MeiliSearch is ready${NC}"
    break
  fi

  WAIT_COUNT=$((WAIT_COUNT + 1))
  if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo -e "${RED}❌ MeiliSearch did not become ready in time${NC}"
    echo -e "${YELLOW}Check logs with: docker compose logs meilisearch${NC}"
    exit 1
  fi

  echo -n "."
  sleep 1
done

echo ""

# Initialize indexes
echo -e "${BLUE}🔨 Initializing indexes...${NC}"
if npm run meilisearch:init; then
  echo -e "${GREEN}✅ Indexes initialized${NC}"
else
  echo -e "${RED}❌ Failed to initialize indexes${NC}"
  echo -e "${YELLOW}Check logs above for errors${NC}"
  exit 1
fi

echo ""

# Display statistics
echo -e "${BLUE}📊 Displaying statistics...${NC}"
npm run meilisearch:stats || true

echo ""
echo -e "${GREEN}✅ MeiliSearch setup completed successfully!${NC}"
echo ""

# Next steps
echo -e "${BLUE}📝 Next steps:${NC}"
echo "  1. Check status: npm run meilisearch:status"
echo "  2. Open dashboard: npm run meilisearch:dashboard (http://localhost:7700)"
echo "  3. View logs: npm run meilisearch:logs"
echo "  4. Index your data (see README_MEILISEARCH.md)"
echo ""

# Useful commands
echo -e "${BLUE}💡 Useful commands:${NC}"
echo "  • npm run meilisearch:status     - Check status and health"
echo "  • npm run meilisearch:stats      - View detailed statistics"
echo "  • npm run meilisearch:stop       - Stop the container"
echo "  • npm run meilisearch:logs       - View container logs"
echo "  • npm run meilisearch:reset      - Reset all indexes"
echo ""

# Rollback instructions
echo -e "${BLUE}📋 Rollback instructions (if needed):${NC}"
echo "  1. Stop container: docker compose stop meilisearch"
echo "  2. Remove container: docker compose rm -f meilisearch"
echo "  3. Remove data volume: docker volume rm mientior_meilisearch_data"
echo ""
