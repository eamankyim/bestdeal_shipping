#!/bin/bash

# Recopy and Verify SSL Certificate

set -e

echo "=========================================="
echo "RECOPY AND VERIFY SSL CERTIFICATE"
echo "=========================================="
echo ""

cd ~/sabito

# Step 1: Stop nginx
echo "=== Step 1: Stopping Nginx ==="
docker stop sabito-nginx
echo "✓ Nginx stopped"

# Step 2: Recopy certificates
echo ""
echo "=== Step 2: Recopying Certificates ==="
cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem ssl/bestdealshippingapp.com.crt
cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem ssl/bestdealshippingapp.com.key
chmod 644 ssl/bestdealshippingapp.com.crt
chmod 600 ssl/bestdealshippingapp.com.key
echo "✓ Certificates recopied"

# Step 3: Verify certificates match
echo ""
echo "=== Step 3: Verifying Certificates Match ==="
echo "Server certificate domains:"
openssl x509 -in /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem -text -noout | grep -A2 "Subject Alternative Name" | grep DNS

echo ""
echo "Container certificate domains:"
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt 2>/dev/null | openssl x509 -text -noout | grep -A2 "Subject Alternative Name" | grep DNS || echo "Cannot read - need to start container first"

# Step 4: Start nginx
echo ""
echo "=== Step 4: Starting Nginx ==="
docker start sabito-nginx
sleep 3
echo "✓ Nginx started"

# Step 5: Verify certificate in container now
echo ""
echo "=== Step 5: Verifying Certificate in Container ==="
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt | openssl x509 -text -noout | grep -A2 "Subject Alternative Name" | grep DNS

# Step 6: Test nginx config
echo ""
echo "=== Step 6: Testing Nginx Config ==="
docker exec sabito-nginx nginx -t

echo ""
echo "=========================================="
echo "CERTIFICATE RECOPIED"
echo "=========================================="
echo ""
echo "Test in browser:"
echo "  https://www.bestdealshippingapp.com"
echo "  https://bestdealshippingapp.com"
echo ""


