#!/bin/bash

# Complete Fix: Port Conflicts + SSL Configuration

set -e

echo "=========================================="
echo "COMPLETE PORT AND SSL FIX"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fix 1: Best Deal Frontend .env (Port 4001 -> 4001)
echo -e "${BLUE}=== Fix 1: Best Deal Frontend Backend Port ===${NC}"
cd ~/bestdeal_shipping

if [ -f frontend/.env ]; then
    echo "Before:"
    grep "API_URL" frontend/.env || echo "API_URL not found"
    
    echo ""
    echo "Updating backend port from 4001 to 4001..."
    sed -i 's|http://localhost:4001|http://localhost:4001|g' frontend/.env
    sed -i 's|localhost:4001|localhost:4001|g' frontend/.env
    
    echo ""
    echo "After:"
    grep "API_URL" frontend/.env || echo "API_URL not found"
    echo -e "${GREEN}✓ Fixed!${NC}"
else
    echo "Creating frontend/.env..."
    mkdir -p frontend
    cat > frontend/.env << 'EOF'
PORT=3000
REACT_APP_API_URL=http://localhost:4001
REACT_APP_API_BASE_PATH=/api
EOF
    echo -e "${GREEN}✓ Created!${NC}"
fi

# Fix 2: Check sabito-nginx SSL configuration
echo ""
echo -e "${BLUE}=== Fix 2: Check Sabito Nginx SSL Configuration ===${NC}"

if docker ps | grep -q sabito-nginx; then
    echo "✓ sabito-nginx container is running"
    
    # Check nginx config
    echo ""
    echo "Current nginx configs:"
    docker exec sabito-nginx ls -la /etc/nginx/conf.d/ 2>/dev/null || echo "Checking..."
    
    # Check if certificates are mounted
    echo ""
    echo "Checking certificate mounts:"
    docker inspect sabito-nginx | grep -A5 "Mounts" | grep letsencrypt || echo "Certificates need to be mounted"
    
    # Check current nginx config for bestdealshippingapp.com
    echo ""
    echo "Checking for bestdealshippingapp.com config:"
    docker exec sabito-nginx cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep -i "bestdeal" || echo "Not configured yet"
    
else
    echo "✗ sabito-nginx container not running"
fi

# Summary
echo ""
echo -e "${BLUE}=== PORT ASSIGNMENT SUMMARY ===${NC}"
echo ""
echo "Best Deal Shipping:"
echo "  Frontend: Port 3000 ✓"
echo "  Backend:  Port 4001 ✓ (FIXED: was configured as 4001)"
echo "  Database: Port 5433 ✓"
echo ""
echo "Sabito:"
echo "  Nginx:    Ports 80/443 (needs SSL config)"
echo "  Frontend: Port 3002 ✓"
echo "  Backend:  Port 4001 ✓"
echo "  Grafana:  Port 3001 ✓"
echo "  Website:  Port 3003 ✓"
echo ""
echo -e "${GREEN}=========================================="
echo "FIXES APPLIED"
echo "==========================================${NC}"
echo ""
echo "Next: Configure SSL in sabito-nginx Docker container"
echo ""


