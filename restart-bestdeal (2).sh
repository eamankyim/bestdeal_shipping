#!/bin/bash

# Restart All ShipEASE Containers

set -e

cd ~/shipease_shipping

echo "=========================================="
echo "RESTARTING ALL BEST DEAL CONTAINERS"
echo "=========================================="
echo ""

# Step 1: Stop all containers
echo "=== Step 1: Stopping All ShipEASE Containers ==="
docker-compose -f docker-compose.prod.yml down
echo "✓ All containers stopped"

# Step 2: Wait a moment
echo ""
echo "=== Step 2: Waiting ==="
sleep 2
echo "✓ Ready"

# Step 3: Start all containers
echo ""
echo "=== Step 3: Starting All ShipEASE Containers ==="
docker-compose -f docker-compose.prod.yml up -d
echo "✓ All containers starting"

# Step 4: Wait for containers to start
echo ""
echo "=== Step 4: Waiting for Containers to Start ==="
sleep 5
echo "✓ Containers should be running"

# Step 5: Verify all containers are running
echo ""
echo "=== Step 5: Verifying All Containers Are Running ==="
docker ps | grep shipease || echo "No ShipEASE containers found!"

echo ""
echo "=== Container Status ==="
docker-compose -f docker-compose.prod.yml ps

# Step 6: Check logs
echo ""
echo "=== Step 6: Recent Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail 20

echo ""
echo "=========================================="
echo "RESTART COMPLETE!"
echo "=========================================="
echo ""
echo "All ShipEASE containers have been restarted."
echo ""
echo "Containers:"
echo "  - shipease_postgres (Database)"
echo "  - shipease_backend (API - Port 4001)"
echo "  - shipease_frontend (Frontend - Port 3000)"
echo "  - shipease_nginx (Nginx - Ports 8080/8443)"
echo ""


