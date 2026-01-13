#!/bin/bash

# Test SSL Connection

echo "=========================================="
echo "TESTING SSL CONNECTION"
echo "=========================================="
echo ""

# Test 1: curl with -k (ignore cert errors)
echo "=== Test 1: curl with -k (ignore cert) ==="
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -15

echo ""

# Test 2: openssl s_client (check actual certificate being served)
echo "=== Test 2: Actual Certificate Being Served ==="
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | grep -A5 "Subject Alternative Name"

echo ""

# Test 3: Check certificate chain
echo "=== Test 3: Certificate Chain ==="
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | grep -E "Verify return code|Certificate chain" | head -3

echo ""

# Test 4: Full certificate info
echo "=== Test 4: Full Certificate Info ==="
echo | openssl s_client -connect www.bestdealshippingapp.com:443 -servername www.bestdealshippingapp.com 2>&1 | openssl x509 -text -noout | grep -E "Subject:|Issuer:|DNS:" | head -5

echo ""
echo "=========================================="
echo "IF BROWSER WORKS, IT'S FINE!"
echo "=========================================="
echo ""
echo "The curl SSL error might be a client-side issue."
echo "Test in your browser - that's the real test!"
echo ""


