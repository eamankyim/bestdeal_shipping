#!/bin/bash

# Complete SSL Setup for Best Deal in Sabito Nginx

set -e

echo "=========================================="
echo "COMPLETE BEST DEAL SSL SETUP"
echo "=========================================="
echo ""

cd ~/sabito

# Step 1: Backup current config
echo "=== Step 1: Backup Current Config ==="
cp nginx/conf.d/sabito.conf nginx/conf.d/sabito.conf.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Step 2: Copy SSL certificates
echo ""
echo "=== Step 2: Copy SSL Certificates ==="
cp /etc/letsencrypt/live/bestdealshippingapp.com/fullchain.pem ssl/bestdealshippingapp.com.crt
cp /etc/letsencrypt/live/bestdealshippingapp.com/privkey.pem ssl/bestdealshippingapp.com.key
chmod 644 ssl/bestdealshippingapp.com.crt
chmod 600 ssl/bestdealshippingapp.com.key
echo "✓ Certificates copied to ssl/ directory"

# Step 3: Show current config
echo ""
echo "=== Step 3: Current Nginx Config ==="
cat nginx/conf.d/sabito.conf

echo ""
echo "=========================================="
echo "READY FOR CONFIGURATION"
echo "=========================================="
echo ""
echo "The nginx config is at: ~/sabito/nginx/conf.d/sabito.conf"
echo "SSL certificates are at: ~/sabito/ssl/bestdealshippingapp.com.crt and .key"
echo ""
echo "Next: Add Best Deal domain configuration to sabito.conf"
echo ""


