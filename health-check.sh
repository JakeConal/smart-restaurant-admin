#!/bin/bash

# Smart Restaurant Docker Health Check Script
# This script checks the health of all services

echo "==================================="
echo "Smart Restaurant Health Check"
echo "==================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker Compose is running
if ! docker-compose ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker Compose is not running${NC}"
    exit 1
fi

echo "Checking services..."
echo ""

# Function to check service health
check_service() {
    local service=$1
    local port=$2
    local url=$3
    
    # Check if container is running
    container_status=$(docker-compose ps -q $service)
    
    if [ -z "$container_status" ]; then
        echo -e "${RED}✗ $service: Container not running${NC}"
        return 1
    fi
    
    # Check if container is healthy
    container_health=$(docker inspect --format='{{.State.Health.Status}}' $(docker-compose ps -q $service) 2>/dev/null)
    
    if [ "$container_health" == "healthy" ]; then
        echo -e "${GREEN}✓ $service: Healthy${NC}"
        return 0
    elif [ "$container_health" == "unhealthy" ]; then
        echo -e "${RED}✗ $service: Unhealthy${NC}"
        return 1
    fi
    
    # If no health check defined, check if container is running
    container_running=$(docker inspect --format='{{.State.Running}}' $(docker-compose ps -q $service) 2>/dev/null)
    
    if [ "$container_running" == "true" ]; then
        # Try to connect to the service
        if [ ! -z "$port" ] && [ ! -z "$url" ]; then
            if curl -f -s -o /dev/null "$url" 2>/dev/null; then
                echo -e "${GREEN}✓ $service: Running and accessible${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠ $service: Running but not accessible at $url${NC}"
                return 1
            fi
        else
            echo -e "${GREEN}✓ $service: Running${NC}"
            return 0
        fi
    else
        echo -e "${RED}✗ $service: Not running${NC}"
        return 1
    fi
}

# Check all services
check_service "db" "3306" ""
check_service "backend" "3000" "http://localhost:3000"
check_service "admin-frontend" "3001" "http://localhost:3001"
check_service "customer-frontend" "4000" "http://localhost:4000"

echo ""
echo "==================================="
echo "Service Details:"
echo "==================================="
docker-compose ps

echo ""
echo "==================================="
echo "Resource Usage:"
echo "==================================="
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose ps -q)

echo ""
echo "Health check complete!"
