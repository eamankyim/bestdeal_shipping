#!/bin/bash

# Completely Remove Best Deal Config from Sabito Nginx

cd ~/sabito

echo "=========================================="
echo "COMPLETELY REMOVING BEST DEAL FROM SABITO NGINX"
echo "=========================================="
echo ""

# Step 1: Backup config
echo "=== Step 1: Backup Config ==="
cp nginx/conf.d/sabito.conf nginx/conf.d/sabito.conf.backup.$(date +%Y%m%d-%H%M%S)
echo "✓ Backup created"

# Step 2: Show current Best Deal config
echo ""
echo "=== Step 2: Current Best Deal Config in Sabito Nginx ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -B5 -A20 "server_name.*bestdealshippingapp.com" | head -30

# Step 3: Remove Best Deal config completely
echo ""
echo "=== Step 3: Remove Best Deal Config ==="
# Remove HTTP redirect block for Best Deal
sed -i '/server_name bestdealshippingapp.com www.bestdealshippingapp.com;/,/^}$/d' nginx/conf.d/sabito.conf

# Also remove any Best Deal redirect blocks
sed -i '/# Best Deal Shipping/,/^}$/d' nginx/conf.d/sabito.conf

# Remove any remaining Best Deal server blocks
sed -i '/server_name.*bestdealshippingapp/,/^}$/d' nginx/conf.d/sabito.conf

echo "✓ Best Deal config removed"

# Step 4: Verify removal
echo ""
echo "=== Step 4: Verify Best Deal Config Removed ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -A5 "server_name.*bestdealshippingapp.com" || echo "✓ No Best Deal config found"

# Step 5: Test nginx config
echo ""
echo "=== Step 5: Test Nginx Config ==="
docker exec sabito-nginx nginx -t

# Step 6: Reload nginx
echo ""
echo "=== Step 6: Reload Nginx ==="
docker exec sabito-nginx nginx -s reload
echo "✓ Nginx reloaded"

# Step 7: Final verification
echo ""
echo "=== Step 7: Final Verification ==="
echo "Best Deal config in sabito-nginx:"
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf | grep -A5 "server_name.*bestdealshippingapp.com" || echo "✓ No Best Deal config found - Complete separation achieved!"

echo ""
echo "=========================================="
echo "REMOVAL COMPLETE!"
echo "=========================================="
echo ""
echo "Sabito nginx now only handles Sabito domains."
echo "Best Deal is completely separate."
echo ""


