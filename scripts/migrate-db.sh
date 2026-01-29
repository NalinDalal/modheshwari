#!/bin/bash
# Database migration script for AWS deployment

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running database migrations...${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}ERROR: DATABASE_URL environment variable is not set${NC}"
    echo -e "${YELLOW}You can get it from Terraform output:${NC}"
    echo -e "  cd terraform && terraform output database_url"
    exit 1
fi

echo -e "${YELLOW}Using DATABASE_URL: ${DATABASE_URL:0:20}...${NC}"

# Run Prisma migrations
echo -e "${YELLOW}Deploying migrations...${NC}"
npx prisma migrate deploy --schema=packages/db/schema.prisma

echo -e "${GREEN}Migrations completed successfully!${NC}"

# Optional: Seed the database
read -p "Do you want to seed the database? (yes/no): " SEED
if [ "$SEED" == "yes" ]; then
    echo -e "${YELLOW}Seeding database...${NC}"
    bun run db:seed
    echo -e "${GREEN}Database seeded successfully!${NC}"
fi
