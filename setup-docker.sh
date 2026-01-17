#!/bin/bash

# Smart Restaurant Docker Setup Script
# This script helps you set up the Docker environment

set -e

echo "==========================================="
echo "Smart Restaurant Docker Setup"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker is not installed. Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Docker Compose is not available. Please install Docker with Compose V2.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker and Docker Compose are installed${NC}"
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
    read -p "Do you want to overwrite it? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing .env file"
    else
        cp .env.docker.example .env
        echo -e "${GREEN}✓ Created new .env file from template${NC}"
    fi
else
    cp .env.docker.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
fi

echo ""
echo "==========================================="
echo "Configuration"
echo "==========================================="
echo ""
echo "Please configure the following in your .env file:"
echo "1. Database credentials (DB_USERNAME, DB_PASSWORD, DB_ROOT_PASSWORD)"
echo "2. JWT_SECRET (use a strong random string)"
echo "3. Email settings (if needed)"
echo ""

read -p "Do you want to edit the .env file now? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ${EDITOR:-nano} .env
fi

echo ""
echo "==========================================="
echo "Building Docker Images"
echo "==========================================="
echo ""
echo "This may take several minutes..."
echo ""

docker compose build

echo ""
echo -e "${GREEN}✓ Docker images built successfully${NC}"
echo ""

echo "==========================================="
echo "Setup Complete!"
echo "==========================================="
echo ""
echo "To start the application, run:"
echo -e "${BLUE}  docker compose up${NC}"
echo ""
echo "Or start in detached mode:"
echo -e "${BLUE}  docker compose up -d${NC}"
echo ""
echo "To view logs:"
echo -e "${BLUE}  docker compose logs -f${NC}"
echo ""
echo "To stop the application:"
echo -e "${BLUE}  docker compose down${NC}"
echo ""
echo "For more commands, see DOCKER.md or run:"
echo -e "${BLUE}  make help${NC}"
echo ""
echo "Access the applications at:"
echo "  - Admin Frontend: http://localhost:3001"
echo "  - Customer Frontend: http://localhost:4000"
echo "  - Backend API: http://localhost:3000"
echo ""
echo "==========================================="
