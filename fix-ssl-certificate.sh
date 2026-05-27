#!/bin/bash

# Fix SSL Certificate Mismatch

set -e

echo "=========================================="
echo "FIXING SSL CERTIFICATE"
echo "=========================================="
echo ""

# Step 1: Check certificate domains
echo "=== Step 1: Check Certificate Domains ==="
openssl x509 -in /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem -text -noout | grep -A5 "Subject Alternative Name"

echo ""
echo "=== Step 2: Recopy Certificate ==="
cd ~/sabito

# Stop nginx temporarily
docker stop sabito-nginx

# Recopy certificates (ensuring we have the latest)
cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem ssl/bestdealshippingapp.com.crt
cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem ssl/bestdealshippingapp.com.key
chmod 644 ssl/bestdealshippingapp.com.crt
chmod 600 ssl/bestdealshippingapp.com.key

echo "✓ Certificates recopied"
ls -la ssl/ | grep bestdeal

echo ""
echo "=== Step 3: Verify Certificate in Container ==="
docker start sabito-nginx
sleep 2

# Check certificate in container
echo "Certificate in container:"
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt | openssl x509 -text -noout | grep -A5 "Subject Alternative Name" || echo "Cannot read"

echo ""
echo "=== Step 4: Test Configuration ==="
docker exec sabito-nginx nginx -t

echo ""
echo "✓ SSL certificate fixed!"
echo ""
echo "Test again:"
echo "  curl -k -I https://www.bestdealshippingapp.com"
echo ""


