#!/bin/bash
# Quick Fix: Port 4001 Conflict

echo "=========================================="
echo "FIXING PORT 4001 CONFLICT"
echo "=========================================="

cd ~/bestdeal_shipping

# Check what's using port 4001
echo ""
echo "=== Checking what's using port 4001 ==="
lsof -i :4001 2>/dev/null || echo "Port 4001 check failed (may not be installed)"
ss -tulpn | grep :4001 || echo "No process found on port 4001"

# Check current .env
echo ""
echo "=== Current .env file ==="
cat .env 2>/dev/null | grep -E "BACKEND_PORT|PORT" || echo "No BACKEND_PORT found in .env"

# Set BACKEND_PORT to 4001
echo ""
echo "=== Setting BACKEND_PORT=4001 in .env ==="
# Remove existing BACKEND_PORT line if any
grep -v "^BACKEND_PORT=" .env > .env.tmp 2>/dev/null || true
# Add correct BACKEND_PORT
echo "BACKEND_PORT=4001" >> .env.tmp
mv .env.tmp .env

# Verify
echo ""
echo "=== Updated .env ==="
cat .env | grep BACKEND_PORT

# Stop and restart containers
echo ""
echo "=== Stopping containers ==="
docker-compose -f docker-compose.prod.yml down

echo ""
echo "=== Starting containers ==="
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Waiting for containers to start ==="
sleep 5

# Verify port mapping
echo ""
echo "=== Verifying port mapping ==="
docker port bestdeal_backend 2>/dev/null || echo "Backend container not running yet"

echo ""
echo "=== Container status ==="
docker ps | grep bestdeal

echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="

