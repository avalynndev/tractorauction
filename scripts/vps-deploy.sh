#!/bin/bash

# VPS Deployment Script
# Run this script on your VPS after cloning from GitHub

set -e  # Exit on error

echo "🚀 Starting VPS Deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please restore .env from backup:"
    echo "  cp /root/tractorauction.env.backup .env"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Stop PM2 if running
if pm2 list | grep -q "tractorauction"; then
    echo -e "${YELLOW}Stopping PM2...${NC}"
    pm2 stop tractorauction
fi

# Remove old build cache
echo -e "${YELLOW}Cleaning build cache...${NC}"
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install

# Generate Prisma client
echo -e "${YELLOW}Generating Prisma client...${NC}"
npm run db:generate

# Build application
echo -e "${YELLOW}Building application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Start with PM2
echo -e "${YELLOW}Starting with PM2...${NC}"
pm2 start server.js --name tractorauction --env production
pm2 save

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check status: pm2 status"
echo "  2. View logs: pm2 logs tractorauction"
echo "  3. Visit: https://tractorauction.in"

