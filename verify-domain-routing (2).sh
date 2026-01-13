#!/bin/bash

# Verify Domain Routing

cd ~/bestdeal_shipping

echo "=========================================="
echo "VERIFYING DOMAIN ROUTING"
echo "=========================================="
echo ""

# Step 1: Check nginx configuration
echo "=== Step 1: Check Nginx Configuration ==="
echo "Server name configuration:"
docker exec bestdeal_nginx cat /etc/nginx/conf.d/bestdeal.conf | grep -A5 "server_name.*bestdealshippingapp.com"

echo ""
echo "Proxy configuration:"
docker exec bestdeal_nginx cat /etc/nginx/conf.d/bestdeal.conf | grep -A10 "location /" | head -15

# Step 2: Check domain resolution
echo ""
echo "=== Step 2: Check Domain Resolution ==="
nslookup www.bestdealshippingapp.com | grep -A2 "Name:" || echo "DNS resolution failed"

# Step 3: Test domain access
echo ""
echo "=== Step 3: Test Domain Access ==="
echo "Testing https://www.bestdealshippingapp.com:8443"
curl -k -I https://www.bestdealshippingapp.com:8443 2>&1 | head -10

# Step 4: Check certificate
echo ""
echo "=== Step 4: Check Certificate ==="
echo "Certificate being served:"
echo | openssl s_client -connect www.bestdealshippingapp.com:8443 -servername www.bestdealshippingapp.com 2>&1 | openssl x509 -text -noout | grep -E "Subject:|DNS:" | head -5

# Step 5: Check which nginx is handling the request
echo ""
echo "=== Step 5: Check Which Nginx is Handling Requests ==="
echo "Best Deal nginx (port 8443) - Recent requests:"
docker logs --tail 20 bestdeal_nginx 2>&1 | grep "bestdealshippingapp.com" | tail -5 || echo "No recent requests"

echo ""
echo "Sabito nginx (port 443) - Recent requests:"
docker logs --tail 20 sabito-nginx 2>&1 | grep "bestdealshippingapp.com" | tail -5 || echo "No recent requests"

# Step 6: Test with Host header
echo ""
echo "=== Step 6: Test with Host Header ==="
echo "Simulating browser request with Host header:"
curl -k -H "Host: www.bestdealshippingapp.com" -I https://localhost:8443 2>&1 | head -10

echo ""
echo "=========================================="
echo "VERIFICATION COMPLETE"
echo "=========================================="
echo ""
echo "If domain is configured correctly:"
echo "  ✓ Nginx config shows server_name bestdealshippingapp.com"
echo "  ✓ Proxy passes to bestdeal_frontend:3000"
echo "  ✓ Certificate matches domain"
echo "  ✓ Requests appear in bestdeal_nginx logs"
echo ""


