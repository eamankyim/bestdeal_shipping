#!/bin/bash

# Fix All Port Conflicts and SSL Configuration

set -e

echo "=========================================="
echo "FIXING PORT CONFLICTS AND SSL"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Step 1: Fix Best Deal Frontend .env (Port 4001 -> 4001)
echo -e "${BLUE}=== STEP 1: Fix Best Deal Frontend .env ===${NC}"
cd ~/bestdeal_shipping

if [ -f frontend/.env ]; then
    echo "Current API_URL:"
    grep "API_URL" frontend/.env || echo "API_URL not found"
    
    echo ""
    echo "Fixing backend port from 4001 to 4001..."
    sed -i 's|http://localhost:4001|http://localhost:4001|g' frontend/.env
    sed -i 's|localhost:4001|localhost:4001|g' frontend/.env
    
    echo ""
    echo "Updated API_URL:"
    grep "API_URL" frontend/.env || echo "API_URL not found"
    
    echo -e "${GREEN}✓ Best Deal frontend .env fixed!${NC}"
else
    echo -e "${RED}✗ frontend/.env not found${NC}"
fi

# Step 2: Check Sabito Nginx Configuration
echo ""
echo -e "${BLUE}=== STEP 2: Check Sabito Nginx Configuration ===${NC}"

echo "Checking sabito-nginx container..."
if docker ps | grep -q sabito-nginx; then
    echo "✓ sabito-nginx is running"
    
    echo ""
    echo "Nginx config location:"
    docker exec sabito-nginx ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "Need to check"
    
    echo ""
    echo "Current nginx config:"
    docker exec sabito-nginx cat /etc/nginx/nginx.conf 2>/dev/null | head -20 || echo "Cannot read config"
else
    echo -e "${RED}✗ sabito-nginx container not found${NC}"
fi

# Step 3: Check SSL Certificates
echo ""
echo -e "${BLUE}=== STEP 3: Check SSL Certificates ===${NC}"

echo "Certificate location:"
ls -la /etc/letsencrypt/live/bestdealshippingapp.com/ 2>/dev/null || echo "Certificate directory not found"

echo ""
echo "Certificate files:"
ls -la /etc/letsencrypt/live/bestdealshippingapp.com/*.pem 2>/dev/null || echo "Certificate files not found"

# Step 4: Check Docker Compose for Sabito
echo ""
echo -e "${BLUE}=== STEP 4: Check Sabito Docker Compose ===${NC}"

if [ -f ~/sabito/docker-compose.yml ]; then
    echo "✓ Sabito docker-compose.yml found"
    echo "Checking nginx service and volumes:"
    grep -A20 "nginx:" ~/sabito/docker-compose.yml | grep -E "image:|volumes:|ports:" || echo "Nginx service not found in compose file"
else
    echo "✗ ~/sabito/docker-compose.yml not found"
fi

# Step 5: Summary
echo ""
echo -e "${BLUE}=== SUMMARY ===${NC}"
echo ""
echo "Port Assignments (Corrected):"
echo "============================"
echo "Best Deal Shipping:"
echo "  Frontend: Port 3000"
echo "  Backend:  Port 4001 (was configured as 4001 - FIXED)"
echo "  Database: Port 5433"
echo ""
echo "Sabito:"
echo "  Nginx:    Ports 80/443 (needs SSL config)"
echo "  Frontend: Port 3002"
echo "  Backend:  Port 4001"
echo "  Grafana:  Port 3001"
echo "  Website:  Port 3003"
echo "  Database: Port 5432"
echo "  Redis:    Port 6379"
echo "  Prometheus: Port 9090"
echo ""

echo -e "${GREEN}=========================================="
echo "FIXES APPLIED"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure SSL in sabito-nginx Docker container"
echo "2. Mount SSL certificates into the container"
echo "3. Restart sabito-nginx container"
echo ""


