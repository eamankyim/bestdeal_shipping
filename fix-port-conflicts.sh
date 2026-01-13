#!/bin/bash

# Fix Port Conflicts Script
# This script reassigns conflicting ports to available ones

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "PORT CONFLICT FIX SCRIPT"
echo "==========================================${NC}"
echo ""

# Step 1: Find available ports
echo -e "${BLUE}=== Finding Available Ports ===${NC}"
echo ""

find_available_port() {
    local start=$1
    local end=$2
    
    for ((port=start; port<=end; port++)); do
        if ! sudo lsof -i :$port > /dev/null 2>&1 && ! sudo ss -tuln | grep -q ":$port "; then
            echo $port
            return 0
        fi
    done
    echo ""
    return 1
}

echo "Available ports for frontend (3000-3020):"
FRONTEND_PORT=$(find_available_port 3000 3020)
if [ -n "$FRONTEND_PORT" ]; then
    echo -e "${GREEN}Found: Port $FRONTEND_PORT${NC}"
else
    echo -e "${RED}No available ports found${NC}"
    exit 1
fi

echo ""
echo "Available ports for backend (4000-4010):"
BACKEND_PORT=$(find_available_port 4000 4010)
if [ -n "$BACKEND_PORT" ]; then
    echo -e "${GREEN}Found: Port $BACKEND_PORT${NC}"
else
    echo -e "${RED}No available ports found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=== Current Port Status ===${NC}"
echo ""

echo "Port 80 (HTTP):"
sudo lsof -i :80 || echo "Not in use"

echo ""
echo "Port 443 (HTTPS):"
sudo lsof -i :443 || echo "Not in use"

echo ""
echo -e "${BLUE}=== Fixing Port Conflicts ===${NC}"
echo ""

# Step 2: Check what needs fixing
echo "1. Checking nginx status..."
if sudo systemctl is-active --quiet nginx; then
    echo -e "${YELLOW}Nginx is running${NC}"
else
    echo -e "${YELLOW}Nginx is not running (this is okay)${NC}"
fi

echo ""
echo "2. Checking Docker containers..."
if docker ps &>/dev/null; then
    echo "Current Docker containers:"
    docker ps --format "table {{.Names}}\t{{.Ports}}"
else
    echo "Docker is not running or not accessible"
fi

echo ""
echo -e "${BLUE}=== Configuration Files to Update ===${NC}"
echo ""

echo "Files that may need port updates:"
echo "  1. ~/bestdeal_shipping/.env"
echo "  2. ~/bestdeal_shipping/frontend/.env"
echo "  3. ~/bestdeal_shipping/docker-compose.prod.yml"
echo "  4. ~/bestdeal_shipping/.github/workflows/deploy-production.yml"
echo "  5. ~/sabito/.env (if exists)"
echo "  6. ~/sabito/frontend/.env (if exists)"
echo "  7. /etc/nginx/sites-enabled/* (nginx configs)"
echo ""

echo -e "${YELLOW}NOTE: This script only identifies conflicts."
echo "Manual configuration updates may be required.${NC}"
echo ""


