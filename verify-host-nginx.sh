#!/bin/bash

# Verify Host-Level Nginx Router

echo "=========================================="
echo "VERIFYING HOST NGINX ROUTER"
echo "=========================================="
echo ""

# Step 1: Container Status
echo "=== Step 1: Container Status ==="
echo "Host nginx:"
docker ps | grep host-nginx || echo "⚠ host-nginx not running!"

echo ""
echo "Sabito nginx:"
docker ps | grep sabito-nginx || echo "⚠ sabito-nginx not running!"

echo ""
echo "Best Deal nginx:"
docker ps | grep bestdeal_nginx || echo "⚠ bestdeal-nginx not running!"

# Step 2: Port Status
echo ""
echo "=== Step 2: Port Status ==="
echo "Ports 80/443 (should be host-nginx):"
ss -tulpn | grep -E ":(80|443)" | grep -v ":::" | head -5

echo ""
echo "Internal ports (should be service nginx):"
ss -tulpn | grep -E ":(8444|8445|8085)" | head -5

# Step 3: Network Connectivity
echo ""
echo "=== Step 3: Network Connectivity ==="
echo "Containers on host-network:"
docker network inspect host-network 2>/dev/null | grep -A5 "Containers" | head -15 || echo "⚠ host-network not found!"

echo ""
echo "Testing host nginx connectivity..."
echo "Ping sabito-nginx:"
docker exec host-nginx ping -c 2 sabito-nginx 2>&1 | head -3 || echo "⚠ Cannot reach sabito-nginx"

echo ""
echo "Ping bestdeal-nginx:"
docker exec host-nginx ping -c 2 bestdeal_nginx 2>&1 | head -3 || echo "⚠ Cannot reach bestdeal-nginx"

# Step 4: Host Nginx Config
echo ""
echo "=== Step 4: Host Nginx Configuration ==="
echo "Nginx config test:"
docker exec host-nginx nginx -t 2>&1 | tail -3

echo ""
echo "Router configuration:"
docker exec host-nginx cat /etc/nginx/conf.d/router.conf | grep -A5 "server_name" | head -20

# Step 5: Domain Routing Test
echo ""
echo "=== Step 5: Domain Routing Test ==="
echo "Testing Sabito (sabito.app):"
curl -I https://sabito.app 2>&1 | head -5 || echo "⚠ Sabito test failed"

echo ""
echo "Testing Best Deal (www.bestdealshippingapp.com - without port!):"
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -5 || echo "⚠ Best Deal test failed"

# Step 6: SSL Certificates
echo ""
echo "=== Step 6: SSL Certificates ==="
echo "Sabito certificate:"
echo | openssl s_client -connect sabito.app:443 -servername sabito.app 2>&1 | openssl x509 -text -noout | grep -E "Subject:|DNS:" | head -3 || echo "⚠ Cannot verify certificate"

echo ""
echo "Best Deal certificate:"
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | openssl x509 -text -noout | grep -E "Subject:|DNS:" | head -3 || echo "⚠ Cannot verify certificate"

# Step 7: Check Logs
echo ""
echo "=== Step 7: Recent Requests ==="
echo "Host nginx recent requests:"
docker logs --tail 10 host-nginx 2>&1 | grep -E "GET|POST" | tail -5 || echo "No recent requests"

echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "If everything is working:"
echo "  ✓ All containers running"
echo "  ✓ Host nginx on ports 80/443"
echo "  ✓ Service nginx on internal ports"
echo "  ✓ All containers on host-network"
echo "  ✓ Host nginx can reach service nginx"
echo "  ✓ Domain routing works"
echo "  ✓ SSL certificates correct"
echo "  ✓ Best Deal works without port number!"
echo ""


