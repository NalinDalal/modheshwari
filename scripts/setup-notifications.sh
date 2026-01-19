#!/bin/bash

# Notification System Setup Script
# Run this to set up the complete notification infrastructure

set -e

echo " Setting up Notification System..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"

# Step 1: Copy environment variables
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cp .env.notification.example .env
    echo -e "${GREEN}✅ .env file created. Please configure it with your credentials.${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists. Skipping...${NC}"
fi

# Step 2: Start Kafka infrastructure
echo -e "${YELLOW}🚀 Starting Kafka infrastructure...${NC}"
docker-compose -f docker-compose.kafka.yml up -d

# Wait for Kafka to be ready
echo -e "${YELLOW}⏳ Waiting for Kafka to be ready...${NC}"
sleep 10

# Check Kafka status
if docker-compose -f docker-compose.kafka.yml ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Kafka is running${NC}"
else
    echo -e "${RED}❌ Kafka failed to start${NC}"
    exit 1
fi

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd apps/be
npm install kafkajs nodemailer firebase-admin
npm install -D @types/nodemailer
cd ../..

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 4: Update database schema
echo -e "${YELLOW}🗄️  Updating database schema...${NC}"
cd packages/db
npx prisma migrate dev --name add-notification-features
cd ../..

echo -e "${GREEN}✅ Database schema updated${NC}"

# Step 5: Display next steps
echo ""
echo -e "${GREEN}✅ Notification System setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure .env file with your:"
echo "   - Email provider credentials (SMTP/SendGrid/SES)"
echo "   - Firebase service account (for push notifications)"
echo ""
echo "2. Start the notification workers:"
echo "   npm run worker:notifications"
echo ""
echo "3. View Kafka UI:"
echo "   http://localhost:8080"
echo ""
echo "4. Read the documentation:"
echo "   cat NOTIFICATION_SYSTEM.md"
echo ""
echo -e "${YELLOW}📝 Don't forget to add these to .env:${NC}"
echo "   - SMTP_USER and SMTP_PASS (for email)"
echo "   - FIREBASE_SERVICE_ACCOUNT (for push notifications)"
