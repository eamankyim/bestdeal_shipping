#!/bin/bash

# Fix All Issues with Host Nginx Setup

set -e

echo "=========================================="
echo "FIXING ALL ISSUES"
echo "=========================================="
echo ""

# Step 1: Stop sabito-nginx temporarily (it's blocking ports 80/443)
echo "=== Step 1: Stop sabito-nginx (temporarily) ==="
docker stop sabito-nginx
echo "✓ sabito-nginx stopped (will restart on internal ports)"

# Step 2: Fix router.conf container name (bestdeal-nginx -> bestdeal_nginx)
echo ""
echo "=== Step 2: Fix Router Config Container Names ==="
cd ~/host-nginx

# Fix container name from bestdeal-nginx to bestdeal_nginx
sed -i 's/bestdeal-nginx/bestdeal_nginx/g' conf.d/router.conf

echo "✓ Container name fixed (bestdeal-nginx -> bestdeal_nginx)"

# Step 3: Connect bestdeal_nginx to host-network
echo ""
echo "=== Step 3: Connect bestdeal_nginx to Network ==="
docker network connect host-network bestdeal_nginx 2>/dev/null && echo "✓ bestdeal_nginx connected" || echo "⚠ Already connected or error"

# Step 4: Start host-nginx
echo ""
echo "=== Step 4: Start host-nginx ==="
docker-compose up -d host-nginx
sleep 5
echo "✓ host-nginx started"

# Step 5: Check host-nginx status
echo ""
echo "=== Step 5: Check host-nginx Status ==="
docker ps | grep host-nginx

echo ""
echo "host-nginx logs:"
docker logs host-nginx --tail 20

# Step 6: Update sabito-nginx to internal port 8444
echo ""
echo "=== Step 6: Update sabito-nginx to Internal Port ==="
echo "Checking sabito-nginx docker-compose location..."

if [ -f ~/sabito/docker-compose.yml ]; then
    cd ~/sabito
    echo "Found docker-compose.yml at ~/sabito"
    
    # Backup
    cp docker-compose.yml docker-compose.yml.backup
    
    # Update sabito-nginx to use internal port 8444
    # This depends on how sabito-nginx is configured
    echo "⚠ Need to manually update sabito-nginx ports to 8444"
    echo "Current sabito-nginx config:"
    grep -A10 "sabito-nginx" docker-compose.yml | head -15 || echo "Check sabito-nginx service name"
else
    echo "⚠ Cannot find sabito docker-compose.yml"
    echo "sabito-nginx may need manual port update"
fi

# Step 7: Connect sabito-nginx to host-network and restart
echo ""
echo "=== Step 7: Connect sabito-nginx to Network ==="
docker network connect host-network sabito-nginx 2>/dev/null && echo "✓ sabito-nginx connected" || echo "⚠ Connection issue"

# Note: sabito-nginx needs to be updated to internal port 8444
# For now, we'll start it and update manually
echo ""
echo "⚠ IMPORTANT: sabito-nginx needs to be updated to use internal port 8444"
echo "   Current: ports 80/443 (conflicts with host-nginx)"
echo "   Needed: internal port 8444 (no external mapping)"

# Step 8: Test routing
echo ""
echo "=== Step 8: Test Routing ==="
echo "Testing Best Deal:"
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -5 || echo "⚠ Still testing..."

echo ""
echo "=========================================="
echo "FIX COMPLETE (PARTIAL)"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update sabito-nginx to use internal port 8444"
echo "2. Restart sabito-nginx"
echo "3. Verify both sites work"
echo ""


