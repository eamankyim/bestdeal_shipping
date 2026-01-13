#!/bin/bash

# Complete Fix: Remove sabito-nginx external ports and add resolver to host-nginx

echo "=========================================="
echo "COMPLETE FIX - SABITO PORTS + RESOLVER"
echo "=========================================="
echo ""

# Step 1: Stop sabito-nginx
echo "=== Step 1: Stop sabito-nginx ==="
docker stop sabito-nginx
echo "✓ Stopped"

# Step 2: Show sabito docker-compose.yml for manual edit
echo ""
echo "=== Step 2: Show sabito-nginx Configuration ==="
cd ~/sabito
if [ ! -f docker-compose.yml ]; then
    echo "⚠ Cannot find docker-compose.yml"
    exit 1
fi

# Backup
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Show current sabito-nginx config
echo ""
echo "Current sabito-nginx service configuration:"
grep -A20 "sabito-nginx:" docker-compose.yml || grep -A20 "nginx:" docker-compose.yml | head -25

echo ""
echo "⚠ MANUAL UPDATE REQUIRED:"
echo "Edit ~/sabito/docker-compose.yml and comment out or remove the ports section for sabito-nginx"
echo ""
echo "Example change:"
echo "  ports:"
echo "    - \"80:80\""
echo "    - \"443:443\""
echo ""
echo "To:"
echo "  # ports:"
echo "  #   - \"80:80\""
echo "  #   - \"443:443\""
echo ""
read -p "Press Enter after updating docker-compose.yml..."

# Step 3: Add resolver to host-nginx nginx.conf
echo ""
echo "=== Step 3: Add Resolver to host-nginx ==="
cd ~/host-nginx

# Check if resolver exists
if ! grep -q "resolver 127.0.0.11" nginx.conf; then
    # Add resolver to http block (after http { line)
    sed -i '/^http {/a\    resolver 127.0.0.11 valid=30s;' nginx.conf
    echo "✓ Added resolver to nginx.conf"
    
    # Show the change
    echo "Updated nginx.conf (first 20 lines):"
    head -20 nginx.conf | grep -A5 "resolver"
else
    echo "✓ Resolver already exists in nginx.conf"
fi

# Step 4: Restart sabito-nginx
echo ""
echo "=== Step 4: Restart sabito-nginx ==="
cd ~/sabito
docker-compose up -d sabito-nginx
sleep 3
echo "✓ sabito-nginx restarted"

# Verify sabito-nginx ports
echo ""
echo "sabito-nginx ports:"
docker inspect sabito-nginx | grep -A10 '"Ports"' | head -15

# Step 5: Restart host-nginx
echo ""
echo "=== Step 5: Restart host-nginx ==="
cd ~/host-nginx
docker-compose restart host-nginx
sleep 5
echo "✓ host-nginx restarted"

# Step 6: Verify
echo ""
echo "=== Step 6: Verify ==="
echo "Container status:"
docker ps | grep -E "host-nginx|sabito-nginx|bestdeal_nginx"

echo ""
echo "Ports 80/443:"
ss -tulpn | grep -E ":(80|443)" | grep docker-proxy

echo ""
echo "host-nginx logs:"
docker logs host-nginx --tail 20

# Step 7: Test
echo ""
echo "=== Step 7: Test Routing ==="
echo "Testing Sabito:"
curl -k -I https://sabito.app 2>&1 | head -5
echo ""
echo "Testing Best Deal:"
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -5

echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "If host-nginx still can't resolve sabito-nginx, check:"
echo "1. Both containers on host-network: docker network inspect host-network"
echo "2. Resolver in nginx.conf: grep resolver ~/host-nginx/nginx.conf"
echo "3. host-nginx logs: docker logs host-nginx"
echo ""


