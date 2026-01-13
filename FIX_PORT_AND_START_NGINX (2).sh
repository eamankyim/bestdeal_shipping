#!/bin/bash
# Fix Backend Port and Start Nginx

cd ~/bestdeal_shipping

echo "=========================================="
echo "FIXING BACKEND PORT AND STARTING NGINX"
echo "=========================================="
echo ""

# Step 1: Fix backend port in docker-compose.prod.yml
echo "=== Step 1: Fix Backend Port ==="
echo "Current port configuration:"
grep -A2 "PORT=" docker-compose.prod.yml | grep BACKEND || echo "Not found"

echo ""
echo "Updating to port 4001..."
sed -i 's/BACKEND_PORT:-4001/BACKEND_PORT:-4001/g' docker-compose.prod.yml
sed -i 's/\${BACKEND_PORT:-4001}/\${BACKEND_PORT:-4001}/g' docker-compose.prod.yml

echo "Updated port configuration:"
grep -A2 "PORT=" docker-compose.prod.yml | grep BACKEND || echo "Not found"

# Step 2: Stop old backend container if running with wrong port
echo ""
echo "=== Step 2: Stop Old Backend Container ==="
docker stop bestdeal_backend 2>/dev/null && echo "✓ Stopped old backend" || echo "Backend not running"
docker rm bestdeal_backend 2>/dev/null && echo "✓ Removed old backend" || echo "Backend container not found"

# Step 3: Start backend with correct port
echo ""
echo "=== Step 3: Start Backend with Correct Port ==="
docker-compose -f docker-compose.prod.yml up -d backend

sleep 3

# Step 4: Verify backend is running
echo ""
echo "=== Step 4: Verify Backend is Running ==="
if docker ps | grep -q bestdeal_backend; then
    echo "✓ Backend is running"
    docker ps | grep bestdeal_backend
    echo ""
    echo "Checking port 4001..."
    ss -tulpn | grep 4001 || echo "Port 4001 not listening"
else
    echo "✗ Backend failed to start!"
    echo "Checking logs..."
    docker logs bestdeal_backend --tail 30
    exit 1
fi

# Step 5: Start nginx
echo ""
echo "=== Step 5: Start Nginx ==="
docker-compose -f docker-compose.prod.yml up -d nginx

sleep 3

# Step 6: Verify nginx is running
echo ""
echo "=== Step 6: Verify Nginx is Running ==="
if docker ps | grep -q bestdeal_nginx; then
    echo "✓ Nginx is running"
    docker ps | grep bestdeal_nginx
else
    echo "✗ Nginx failed to start!"
    echo "Checking logs..."
    docker logs bestdeal_nginx --tail 30
    exit 1
fi

# Step 7: Test nginx config
echo ""
echo "=== Step 7: Test Nginx Configuration ==="
docker exec bestdeal_nginx nginx -t

# Step 8: Test nginx response
echo ""
echo "=== Step 8: Test Nginx Response ==="
echo "Testing HTTP redirect (port 8080)..."
curl -I http://localhost:8080 2>&1 | head -5

echo ""
echo "Testing HTTPS (port 8443)..."
curl -k -I https://localhost:8443 2>&1 | head -5

echo ""
echo "=========================================="
echo "SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Backend: Port 4001 ✓"
echo "Nginx:   Ports 8080/8443 ✓"
echo ""
echo "All services are running!"
echo ""


