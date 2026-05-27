#!/bin/bash

# Restart Nginx Container

echo "=========================================="
echo "RESTARTING NGINX CONTAINER"
echo "=========================================="
echo ""

# Step 1: Stop nginx
echo "=== Step 1: Stopping Nginx ==="
docker stop sabito-nginx
echo "✓ Nginx stopped"

# Step 2: Wait a moment
echo ""
echo "=== Step 2: Waiting ==="
sleep 2
echo "✓ Ready"

# Step 3: Start nginx
echo ""
echo "=== Step 3: Starting Nginx ==="
docker start sabito-nginx
echo "✓ Nginx started"

# Step 4: Wait for nginx to fully start
echo ""
echo "=== Step 4: Waiting for Nginx to Start ==="
sleep 5
echo "✓ Nginx should be running now"

# Step 5: Verify nginx is running
echo ""
echo "=== Step 5: Verifying Nginx Status ==="
docker ps | grep sabito-nginx

# Step 6: Test nginx config
echo ""
echo "=== Step 6: Testing Nginx Config ==="
docker exec sabito-nginx nginx -t

echo ""
echo "=========================================="
echo "NGINX RESTARTED"
echo "=========================================="
echo ""
echo "Test in browser:"
echo "  https://www.bestdealshippingapp.com"
echo ""


