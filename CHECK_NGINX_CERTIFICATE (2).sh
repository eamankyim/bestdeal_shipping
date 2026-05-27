#!/bin/bash

# Check What Certificate Nginx Is Actually Serving

echo "=========================================="
echo "CHECKING NGINX CERTIFICATE"
echo "=========================================="
echo ""

# Step 1: Check certificate being served
echo "=== Step 1: Certificate Being Served ==="
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | openssl x509 -text -noout | grep -E "Subject: CN=|Subject:|DNS:" | head -10

echo ""

# Step 2: Check nginx config for Best Deal
echo "=== Step 2: Nginx Configuration ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -B5 -A30 "server_name.*bestdealshippingapp.com"

echo ""

# Step 3: Verify certificate file in container
echo "=== Step 3: Certificate File in Container ==="
docker exec sabito-nginx ls -la /etc/nginx/ssl/bestdealshippingapp.com.crt 2>/dev/null || echo "✗ Certificate file not found!"
echo ""
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt 2>/dev/null | openssl x509 -text -noout | grep -E "Subject:|DNS:" | head -5 || echo "✗ Cannot read certificate!"

echo ""

# Step 4: Check if certificate matches
echo "=== Step 4: Compare Certificates ==="
echo "Certificate being served:"
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | openssl x509 -text -noout | grep -E "Subject: CN=|DNS:" | head -3

echo ""
echo "Container certificate file:"
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt 2>/dev/null | openssl x509 -text -noout | grep -E "Subject: CN=|DNS:" | head -3 || echo "Cannot read!"

echo ""

# Step 5: Check nginx error logs
echo "=== Step 5: Nginx Error Logs (Last 20 lines) ==="
docker logs sabito-nginx 2>&1 | tail -20 | grep -i "ssl\|certificate\|error" || echo "No SSL errors in logs"

echo ""
echo "=========================================="


