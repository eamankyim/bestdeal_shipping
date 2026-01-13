#!/bin/bash

# Verify Complete Separation

echo "=========================================="
echo "VERIFYING COMPLETE SEPARATION"
echo "=========================================="
echo ""

# Step 1: Check Sabito Nginx
echo "=== Step 1: Sabito Nginx Configuration ==="
echo "Sabito domains handled:"
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -A5 "server_name.*sabito" | head -15

echo ""
echo "Best Deal domains in sabito-nginx:"
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -A5 "server_name.*bestdealshippingapp.com" || echo "✓ No Best Deal config in sabito-nginx"

# Step 2: Check Best Deal Nginx
echo ""
echo "=== Step 2: Best Deal Nginx Configuration ==="
echo "Best Deal domains handled:"
docker exec bestdeal_nginx cat /etc/nginx/conf.d/bestdeal.conf | grep -A5 "server_name.*bestdealshippingapp.com" | head -15

echo ""
echo "Proxy configuration:"
docker exec bestdeal_nginx cat /etc/nginx/conf.d/bestdeal.conf | grep -A3 "proxy_pass" | head -10

# Step 3: Verify Ports
echo ""
echo "=== Step 3: Port Configuration ==="
echo "Sabito nginx ports:"
docker ps | grep sabito-nginx | grep -oE "0.0.0.0:[0-9]+->[0-9]+" || echo "Not found"

echo ""
echo "Best Deal nginx ports:"
docker ps | grep bestdeal_nginx | grep -oE "0.0.0.0:[0-9]+->[0-9]+" || echo "Not found"

# Step 4: Test Services
echo ""
echo "=== Step 4: Test Services ==="
echo "Testing Sabito (sabito.app):"
curl -I https://sabito.app 2>&1 | head -5 || echo "Sabito test failed"

echo ""
echo "Testing Best Deal (www.bestdealshippingapp.com:8443):"
curl -k -I https://www.bestdealshippingapp.com:8443 2>&1 | head -5 || echo "Best Deal test failed"

# Step 5: Check Logs
echo ""
echo "=== Step 5: Recent Requests ==="
echo "Sabito nginx recent requests:"
docker logs --tail 10 sabito-nginx 2>&1 | grep -E "sabito.app|GET|POST" | tail -5 || echo "No recent requests"

echo ""
echo "Best Deal nginx recent requests:"
docker logs --tail 10 bestdeal_nginx 2>&1 | grep -E "bestdealshippingapp.com|GET|POST" | tail -5 || echo "No recent requests"

echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "If properly separated:"
echo "  ✓ Sabito nginx only handles sabito.app domains"
echo "  ✓ Best Deal nginx only handles bestdealshippingapp.com domains"
echo "  ✓ No Best Deal config in sabito-nginx"
echo "  ✓ Best Deal proxies to bestdeal_frontend:3000"
echo ""


