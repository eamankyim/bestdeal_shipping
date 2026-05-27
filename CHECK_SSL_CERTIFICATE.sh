#!/bin/bash

# Check SSL Certificate Details

echo "=========================================="
echo "CHECKING SSL CERTIFICATE"
echo "=========================================="
echo ""

# Check certificate on server
echo "=== Step 1: Certificate on Server ==="
ls -la /etc/letsencrypt/live/bestdealshippingapp.com/

echo ""
echo "=== Step 2: Certificate Details ==="
openssl x509 -in /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem -text -noout | grep -E "Subject:|DNS:|Issuer:" | head -10

echo ""
echo "=== Step 3: Certificate Subject Alternative Names ==="
openssl x509 -in /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem -text -noout | grep -A5 "Subject Alternative Name"

echo ""
echo "=== Step 4: Certificate in Docker Container ==="
docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt | openssl x509 -text -noout | grep -E "Subject:|DNS:" | head -10

echo ""
echo "=== Step 5: Compare Certificates ==="
echo "Server certificate size:"
wc -c /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem
echo ""
echo "Container certificate size:"
docker exec sabito-nginx wc -c /etc/nginx/ssl/bestdealshippingapp.com.crt 2>/dev/null || echo "Cannot check"

echo ""
echo "=== Step 6: Verify Certificate Match ==="
echo "Checking if certificates are identical..."
if diff <(cat /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem) <(docker exec sabito-nginx cat /etc/nginx/ssl/bestdealshippingapp.com.crt 2>/dev/null) > /dev/null 2>&1; then
    echo "✓ Certificates match"
else
    echo "✗ Certificates don't match - need to recopy"
fi


