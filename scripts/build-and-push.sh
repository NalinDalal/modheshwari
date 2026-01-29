#!/bin/bash
# Build and push Docker images to AWS ECR

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building and pushing Docker images to ECR...${NC}"

# Get AWS account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-east-1}

if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}Failed to get AWS account ID. Please ensure AWS CLI is configured.${NC}"
    exit 1
fi

echo -e "${YELLOW}Account ID: $ACCOUNT_ID${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"

# ECR repository URLs
BACKEND_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/modheshwari-backend"
FRONTEND_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/modheshwari-frontend"
WEBSOCKET_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/modheshwari-websocket"

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build images
echo -e "${YELLOW}Building backend image...${NC}"
docker build -t modheshwari-backend -f apps/be/Dockerfile .

echo -e "${YELLOW}Building frontend image...${NC}"
docker build -t modheshwari-frontend -f apps/web/Dockerfile .

echo -e "${YELLOW}Building websocket image...${NC}"
docker build -t modheshwari-websocket -f apps/ws/Dockerfile .

# Tag images
echo -e "${YELLOW}Tagging images...${NC}"
docker tag modheshwari-backend:latest "$BACKEND_REPO:latest"
docker tag modheshwari-frontend:latest "$FRONTEND_REPO:latest"
docker tag modheshwari-websocket:latest "$WEBSOCKET_REPO:latest"

# Push images
echo -e "${YELLOW}Pushing backend image...${NC}"
docker push "$BACKEND_REPO:latest"

echo -e "${YELLOW}Pushing frontend image...${NC}"
docker push "$FRONTEND_REPO:latest"

echo -e "${YELLOW}Pushing websocket image...${NC}"
docker push "$WEBSOCKET_REPO:latest"

echo -e "${GREEN}All images pushed successfully!${NC}"
echo -e "${YELLOW}Updating ECS services...${NC}"

# Update ECS services to use new images
aws ecs update-service --cluster modheshwari-cluster --service modheshwari-backend-service --force-new-deployment --region "$REGION" || true
aws ecs update-service --cluster modheshwari-cluster --service modheshwari-frontend-service --force-new-deployment --region "$REGION" || true
aws ecs update-service --cluster modheshwari-cluster --service modheshwari-websocket-service --force-new-deployment --region "$REGION" || true

echo -e "${GREEN}Deployment complete!${NC}"
