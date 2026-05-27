#!/bin/bash

# Identify Docker Containers and Their Ports

echo "=========================================="
echo "DOCKER CONTAINERS PORT MAPPING"
echo "=========================================="
echo ""

echo "=== All Running Containers ==="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Container Details ==="
docker ps --format "{{.Names}}" | while read container; do
    echo ""
    echo "Container: $container"
    echo "Image: $(docker inspect --format='{{.Config.Image}}' $container 2>/dev/null)"
    echo "Ports:"
    docker inspect --format='{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} -> {{(index $conf 0).HostPort}}{{"\n"}}{{end}}' $container 2>/dev/null
    echo "Status: $(docker inspect --format='{{.State.Status}}' $container 2>/dev/null)"
done

echo ""
echo "=== Best Deal Containers ==="
<<<<<<< HEAD
docker ps --format "{{.Names}}" | grep -i "shipease\|best_deal" | while read container; do
=======
docker ps --format "{{.Names}}" | grep -i "bestdeal\|best_deal" | while read container; do
>>>>>>> origin/master
    echo ""
    echo "Container: $container"
    docker port $container 2>/dev/null || echo "  No port mappings"
done

echo ""
echo "=== Sabito Containers ==="
docker ps --format "{{.Names}}" | grep -i "sabito" | while read container; do
    echo ""
    echo "Container: $container"
    docker port $container 2>/dev/null || echo "  No port mappings"
done

echo ""
echo "=== Nginx Containers ==="
docker ps --format "{{.Names}}" | grep -i "nginx" | while read container; do
    echo ""
    echo "Container: $container"
    docker port $container 2>/dev/null || echo "  No port mappings"
    echo "  This is using ports 80/443!"
done

echo ""
echo "=========================================="
echo "PORT ASSIGNMENT SUMMARY"
echo "=========================================="
echo ""
echo "Port 80/443: Nginx container (Docker)"
echo "Port 3000: Best Deal Frontend (Docker)"
echo "Port 3001: Unknown (need to identify)"
echo "Port 3002: Unknown (need to identify)"
echo "Port 3003: Unknown (need to identify)"
echo "Port 4001: Best Deal Backend (Docker)"
echo "Port 4001: Unknown (need to identify)"
echo "Port 5432: PostgreSQL (Docker)"
echo "Port 5433: Best Deal PostgreSQL (Docker)"
echo "Port 6379: Redis (Docker)"
echo "Port 9090: Unknown (need to identify)"
echo ""


