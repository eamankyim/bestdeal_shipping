#!/bin/bash

# Check SSL Configuration

echo "=========================================="
echo "DEBUGGING SSL BROWSER ERROR"
echo "=========================================="
echo ""

# Step 1: Check certificate being served
echo "=== Step 1: Certificate Being Served ==="
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | openssl x509 -text -noout | grep -E "Subject:|Subject Alternative Name|DNS:" | head -10

echo ""

# Step 2: Check nginx config
echo "=== Step 2: Nginx Configuration ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -A30 "server_name.*bestdealshippingapp.com" | head -40

echo ""

# Step 3: Verify certificate file in container
echo "=== Step 3: Certificate File in Container ==="
docker exec sabito-nginx ls -la /etc/nginx/ssl/bestdealshippingapp.com.crt
echo ""
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt | openssl x509 -text -noout | grep -E "Subject:|DNS:" | head -5

echo ""

# Step 4: Compare certificates
echo "=== Step 4: Compare Certificates ==="
echo "Server certificate:"
openssl x509 -in /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem -text -noout | grep -E "Subject:|DNS:" | head -3

echo ""
echo "Container certificate:"
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt | openssl x509 -text -noout | grep -E "Subject:|DNS:" | head -3

echo ""

# Step 5: Check certificate common name
echo "=== Step 5: Certificate Common Name ==="
echo "Certificate being served:"
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | openssl x509 -text -noout | grep -E "Subject: CN=|Subject:" | head -2

echo ""
echo "=========================================="


