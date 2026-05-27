#!/bin/bash

# Check Docker Network Configuration

echo "=========================================="
echo "CHECKING DOCKER NETWORK CONFIGURATION"
echo "=========================================="
echo ""

# Step 1: Check backend status
echo "=== Step 1: Backend Container Status ==="
docker ps -a | grep bestdeal_backend

echo ""

# Step 2: Check backend logs
echo "=== Step 2: Backend Logs (Last 30 lines) ==="
docker logs bestdeal_backend --tail 30 2>&1 || echo "Cannot read logs"

echo ""

# Step 3: Check Docker networks
echo "=== Step 3: Docker Networks ==="
echo "Bridge network containers:"
docker network inspect bridge | grep -A5 '"Name":' | grep -E "bestdeal|sabito"

echo ""

# Step 4: Check container IPs
echo "=== Step 4: Container IP Addresses ==="
echo "bestdeal_frontend IP:"
docker inspect bestdeal_frontend 2>/dev/null | grep -A3 '"IPAddress"' | grep '"IPAddress"' || echo "Cannot get IP"

echo ""
echo "bestdeal_backend IP:"
docker inspect bestdeal_backend 2>/dev/null | grep -A3 '"IPAddress"' | grep '"IPAddress"' || echo "Cannot get IP"

echo ""
echo "sabito-nginx IP:"
docker inspect sabito-nginx 2>/dev/null | grep -A3 '"IPAddress"' | grep '"IPAddress"' || echo "Cannot get IP"

echo ""

# Step 5: Check if containers can reach host
echo "=== Step 5: Network Connectivity Test ==="
echo "From nginx container to 172.17.0.1:"
docker exec sabito-nginx ping -c 2 -W 2 172.17.0.1 2>&1 | head -5 || echo "Cannot ping"

echo ""

# Step 6: Check docker-compose network config
echo "=== Step 6: Docker Compose Network Config ==="
cd ~/bestdeal_shipping
grep -A5 "networks:" docker-compose.prod.yml || echo "No network config found"

echo ""
echo "=========================================="


