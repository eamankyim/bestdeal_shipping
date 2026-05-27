#!/bin/bash

# Final Complete Fix - Update router.conf to use sabito-nginx:443

echo "=========================================="
echo "FINAL COMPLETE FIX"
echo "=========================================="
echo ""

# Step 1: Update router.conf to use sabito-nginx:443 (not 8444)
echo "=== Step 1: Update router.conf ==="
cd ~/host-nginx
sed -i 's/sabito-nginx:8444/sabito-nginx:443/g' conf.d/router.conf
echo "✓ Updated router.conf: sabito-nginx:8444 -> sabito-nginx:443"
echo "Updated config:"
grep "sabito-nginx" conf.d/router.conf | head -3

# Step 2: Start sabito-nginx (without external port mapping)
echo ""
echo "=== Step 2: Start sabito-nginx ==="
docker start sabito-nginx
sleep 3
echo "✓ sabito-nginx started"

# Step 3: Verify sabito-nginx is on host-network
echo ""
echo "=== Step 3: Verify Network ==="
docker network inspect host-network | grep -A5 "sabito-nginx" || echo "⚠ sabito-nginx not on host-network"
docker network inspect host-network | grep -A5 "bestdeal_nginx" || echo "⚠ bestdeal_nginx not on host-network"

# Step 4: Connect sabito-nginx to network if not already
echo ""
echo "=== Step 4: Connect to Network ==="
docker network connect host-network sabito-nginx 2>/dev/null && echo "✓ sabito-nginx connected" || echo "⚠ Already connected"
docker network connect host-network bestdeal_nginx 2>/dev/null && echo "✓ bestdeal_nginx connected" || echo "⚠ Already connected"

# Step 5: Restart host-nginx
echo ""
echo "=== Step 5: Restart host-nginx ==="
docker-compose restart host-nginx
sleep 5
echo "✓ host-nginx restarted"

# Step 6: Check host-nginx status
echo ""
echo "=== Step 6: Check host-nginx Status ==="
docker ps | grep host-nginx
echo ""
echo "host-nginx logs:"
docker logs host-nginx --tail 20

# Step 7: Test routing
echo ""
echo "=== Step 7: Test Routing ==="
echo "Testing Best Deal:"
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -5
echo ""
echo "Testing Sabito:"
curl -k -I https://sabito.app 2>&1 | head -5

echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "If sabito-nginx still has ports 80/443 exposed:"
echo "1. Stop sabito-nginx: docker stop sabito-nginx"
echo "2. Update ~/sabito/docker-compose.yml to remove or change port mappings"
echo "3. Restart: cd ~/sabito && docker-compose up -d sabito-nginx"
echo ""


