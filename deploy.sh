#!/bin/bash

# ============================================
# Build and Deploy Script
# ============================================

set -e

echo "🚀 Starting build and deploy process..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | xargs)

echo -e "${BLUE}📦 Building Docker image...${NC}"
docker-compose build --no-cache

echo -e "${BLUE}🔄 Stopping old container...${NC}"
docker-compose down

echo -e "${BLUE}🚀 Starting new container...${NC}"
docker-compose up -d

echo -e "${BLUE}⏳ Waiting for container to be healthy...${NC}"
sleep 10

# Check health
if docker-compose ps | grep -q "healthy"; then
    echo -e "${GREEN}✅ Deploy successful!${NC}"
    echo -e "${GREEN}🌐 Application available at: https://kanban.seudominio.com${NC}"
else
    echo -e "${RED}❌ Container is not healthy. Check logs:${NC}"
    docker-compose logs --tail=50
    exit 1
fi

echo -e "${BLUE}📊 Container status:${NC}"
docker-compose ps

echo -e "${GREEN}✨ Deploy completed!${NC}"
