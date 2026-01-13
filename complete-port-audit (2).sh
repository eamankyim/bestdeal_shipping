#!/bin/bash

# Complete Port Audit Script
# Deep scan of all processes, ports, and configurations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${CYAN}=========================================="
echo "  COMPLETE PORT AUDIT AND CONFIGURATION"
echo "==========================================${NC}"
echo ""

# Function to print section header
section() {
    echo ""
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Function to check if port is available
check_port() {
    local port=$1
    if sudo lsof -i :$port > /dev/null 2>&1 || sudo ss -tuln | grep -q ":$port "; then
        echo -e "${RED}Port $port: IN USE${NC}"
        sudo lsof -i :$port 2>/dev/null || sudo ss -tulpn | grep ":$port " | grep LISTEN
        return 1
    else
        echo -e "${GREEN}Port $port: AVAILABLE${NC}"
        return 0
    fi
}

# Step 1: All Listening Ports
section "STEP 1: ALL LISTENING PORTS"
sudo ss -tulpn | grep LISTEN | sort -k5 | awk '{printf "%-10s %-10s %-30s %s\n", $1, $2, $5, $7}'
echo ""
echo "Total listening ports: $(sudo ss -tulpn | grep LISTEN | wc -l)"

# Step 2: Critical Ports Status
section "STEP 2: CRITICAL PORTS STATUS"
check_port 80
check_port 443
check_port 22
check_port 3000
check_port 3001
check_port 3002
check_port 3003
check_port 4001
check_port 5000

# Step 3: Port Usage by Process
section "STEP 3: PORT USAGE BY PROCESS"

echo "Ports 80/443 usage:"
sudo lsof -i :80 -i :443 2>/dev/null | tail -n +2 | awk '{printf "%-10s %-8s %-20s %s\n", $2, $1, $9, $10}' || echo "Not in use"

echo ""
echo "Application ports (3000-6000):"
for port in {3000..6000}; do
    usage=$(sudo lsof -i :$port 2>/dev/null | tail -n +2 | head -1)
    if [ -n "$usage" ]; then
        pid=$(echo $usage | awk '{print $2}')
        cmd=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
        echo "Port $port: PID $pid ($cmd)"
    fi
done | head -20

# Step 4: All Running Processes
section "STEP 4: ALL RUNNING SERVICES"

echo "Node.js processes:"
ps aux | grep -E "node|npm|pm2" | grep -v grep | awk '{printf "%-8s %-20s %s\n", $2, $11, $12}'

echo ""
echo "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not accessible"

echo ""
echo "PM2 processes:"
pm2 list 2>/dev/null || echo "PM2 not running"

echo ""
echo "Nginx processes:"
ps aux | grep nginx | grep -v grep || echo "No nginx processes"

# Step 5: Configuration Files
section "STEP 5: CONFIGURATION FILES CHECK"

echo "Best Deal Shipping configuration:"
if [ -f ~/bestdeal_shipping/.env ]; then
    echo "  ✓ ~/bestdeal_shipping/.env exists"
    grep -E "PORT|API_URL" ~/bestdeal_shipping/.env 2>/dev/null | head -5
else
    echo "  ✗ ~/bestdeal_shipping/.env not found"
fi

if [ -f ~/bestdeal_shipping/frontend/.env ]; then
    echo "  ✓ ~/bestdeal_shipping/frontend/.env exists"
    grep -E "PORT|API_URL" ~/bestdeal_shipping/frontend/.env 2>/dev/null | head -5
else
    echo "  ✗ ~/bestdeal_shipping/frontend/.env not found"
fi

echo ""
echo "Sabito configuration:"
if [ -f ~/sabito/.env ]; then
    echo "  ✓ ~/sabito/.env exists"
    grep -E "PORT|API_URL" ~/sabito/.env 2>/dev/null | head -5
else
    echo "  ✗ ~/sabito/.env not found"
fi

if [ -f ~/sabito/frontend/.env ]; then
    echo "  ✓ ~/sabito/frontend/.env exists"
    grep -E "PORT|API_URL" ~/sabito/frontend/.env 2>/dev/null | head -5
else
    echo "  ✗ ~/sabito/frontend/.env not found"
fi

# Step 6: Nginx Configuration
section "STEP 6: NGINX CONFIGURATION"

if [ -d /etc/nginx/sites-enabled ]; then
    echo "Enabled nginx configs:"
    ls -la /etc/nginx/sites-enabled/
    
    echo ""
    echo "Server name configurations:"
    sudo grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null || echo "None found"
    
    echo ""
    echo "Listen directives:"
    sudo grep -r "listen" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "#" | head -10 || echo "None found"
else
    echo "Nginx not configured or not installed"
fi

# Step 7: Docker Compose Configs
section "STEP 7: DOCKER COMPOSE CONFIGURATIONS"

echo "Docker compose files found:"
find ~/bestdeal_shipping ~/sabito -name "docker-compose*.yml" -o -name "docker-compose*.yaml" 2>/dev/null | while read file; do
    echo "  ✓ $file"
    grep -E "ports:|PORT" "$file" | head -3 || echo ""
done

# Step 8: Available Ports
section "STEP 8: AVAILABLE PORTS IN RANGE"

echo "Checking available ports (3000-6010):"
available_count=0
for port in {3000..6010}; do
    if ! sudo lsof -i :$port > /dev/null 2>&1 && ! sudo ss -tuln | grep -q ":$port "; then
        echo -e "${GREEN}Port $port: AVAILABLE${NC}"
        ((available_count++))
        if [ $available_count -ge 20 ]; then
            echo "... (showing first 20 available)"
            break
        fi
    fi
done

# Step 9: Recommended Port Assignment
section "STEP 9: RECOMMENDED PORT ASSIGNMENT"

echo "Recommended Configuration:"
echo "=========================="
echo ""
echo "Best Deal Shipping:"
echo "  Frontend: Port 3000"
echo "  Backend:  Port 4001"
echo "  Database: Port 5433"
echo ""
echo "Sabito:"
echo "  Frontend: Check available port (3004+)"
echo "  Backend:  Port 5000"
echo ""
echo "Nginx (Reverse Proxy):"
echo "  HTTP:  Port 80"
echo "  HTTPS: Port 443"
echo ""

# Step 10: Summary
section "STEP 10: CONFLICT SUMMARY"

echo "Checking for conflicts..."
conflicts=0

# Check for port conflicts
for port in 80 443 3000 3001 3002 3003 4001 5000; do
    if sudo lsof -i :$port > /dev/null 2>&1 || sudo ss -tuln | grep -q ":$port "; then
        processes=$(sudo lsof -i :$port 2>/dev/null | wc -l)
        ss_processes=$(sudo ss -tulpn | grep ":$port " | wc -l)
        if [ $processes -gt 1 ] || [ $ss_processes -gt 1 ]; then
            echo -e "${RED}CONFLICT: Port $port has multiple processes${NC}"
            ((conflicts++))
        fi
    fi
done

if [ $conflicts -eq 0 ]; then
    echo -e "${GREEN}No port conflicts detected!${NC}"
else
    echo -e "${RED}Found $conflicts potential conflicts${NC}"
fi

echo ""
echo -e "${CYAN}=========================================="
echo "  AUDIT COMPLETE"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review the conflicts above"
echo "2. Update configuration files with recommended ports"
echo "3. Restart services with new port assignments"
echo ""


