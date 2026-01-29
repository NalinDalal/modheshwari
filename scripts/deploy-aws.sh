#!/bin/bash
# Deploy script for AWS infrastructure using Terraform

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting AWS deployment...${NC}"

# Change to terraform directory
cd "$(dirname "$0")/../terraform"

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Initialize Terraform
echo -e "${YELLOW}Initializing Terraform...${NC}"
terraform init

# Validate Terraform configuration
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
terraform validate

# Plan the deployment
echo -e "${YELLOW}Planning deployment...${NC}"
terraform plan -out=tfplan

# Ask for confirmation
read -p "Do you want to apply this plan? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Apply the deployment
echo -e "${YELLOW}Applying deployment...${NC}"
terraform apply tfplan

# Get outputs
echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}Getting deployment outputs...${NC}"
terraform output

echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Build and push Docker images using scripts/build-and-push.sh"
echo -e "2. Run database migrations"
echo -e "3. Update ECS services to use the new images"
