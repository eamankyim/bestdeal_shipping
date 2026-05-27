#!/bin/bash

# Deep Port Scan and Configuration Fix Script
# This script scans all processes, identifies port conflicts, and fixes them

set -e

echo "=========================================="
echo "DEEP PORT SCAN AND CONFIGURATION FIX"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Scan All Listening Ports
echo -e "${BLUE}=== STEP 1: Scanning All Listening Ports ===${NC}"
echo ""
echo "All listening ports:"
sudo ss -tulpn | grep LISTEN | sort -k5

echo ""
echo "Ports 80, 443 (HTTP/HTTPS):"
sudo ss -tulpn | grep -E ":(80|443)" | grep LISTEN

echo ""
echo "Application ports (3000-6000):"
sudo ss -tulpn | grep LISTEN | grep -E ":(300[0-9]|400[0-9]|500[0-9])"

echo ""
echo -e "${BLUE}=== STEP 2: Finding What's Using Each Port ===${NC}"
echo ""

# Function to get process info for a port
get_port_info() {
    local port=$1
    echo -e "${YELLOW}Port $port:${NC}"
    sudo lsof -i :$port 2>/dev/null || sudo ss -tulpn | grep ":$port " | grep LISTEN
    echo ""
}

# Check critical ports
get_port_info 80
get_port_info 443
get_port_info 3000
get_port_info 3001
get_port_info 3002
get_port_info 3003
get_port_info 4001
get_port_info 5000

echo -e "${BLUE}=== STEP 3: Scanning All Node/Process Processes ===${NC}"
echo ""

# Find all node processes
echo "Node processes:"
ps aux | grep node | grep -v grep || echo "No node processes found"

echo ""

# Find all Docker containers
echo "Docker containers and their ports:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not running or not installed"

echo ""

# Find all PM2 processes
echo "PM2 processes:"
pm2 list 2>/dev/null || echo "PM2 not running"

echo ""

# Find all nginx processes
echo "Nginx processes:"
ps aux | grep nginx | grep -v grep || echo "No nginx processes found"

echo ""
echo -e "${BLUE}=== STEP 4: Checking Nginx Configuration ===${NC}"
echo ""

echo "All nginx config files:"
sudo ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "No nginx configs found"

echo ""
echo "Nginx server_name configurations:"
sudo grep -r "server_name" /etc/nginx/sites-enabled/ 2>/dev/null || echo "No server_name found"

echo ""
echo "Nginx listen directives:"
sudo grep -r "listen" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "#" || echo "No listen directives found"

echo ""
echo -e "${BLUE}=== STEP 5: Checking Docker Compose Configs ===${NC}"
echo ""

# Find docker-compose files
echo "Docker compose files:"
find ~ -name "docker-compose*.yml" -o -name "docker-compose*.yaml" 2>/dev/null || echo "No docker-compose files found"

echo ""
echo -e "${BLUE}=== STEP 6: Finding Available Ports ===${NC}"
echo ""

echo "Checking available ports in range 3000-6010:"
for port in {3000..6010}; do
    if ! sudo lsof -i :$port > /dev/null 2>&1 && ! sudo ss -tuln | grep -q ":$port "; then
        echo -e "${GREEN}Port $port: AVAILABLE${NC}"
    fi
done | head -20

echo ""
echo -e "${BLUE}=== STEP 7: Port Usage Summary ===${NC}"
echo ""

# Create summary
echo "Port Usage Summary:"
echo "==================="
echo ""

# Function to create port summary
summarize_port() {
    local port=$1
    local usage=$(sudo lsof -i :$port 2>/dev/null | tail -n +2 | awk '{print $1, $2}' | head -1)
    if [ -n "$usage" ]; then
        echo "Port $port: IN USE - $usage"
    else
        local ss_info=$(sudo ss -tulpn | grep ":$port " | grep LISTEN | awk '{print $5, $7}')
        if [ -n "$ss_info" ]; then
            echo "Port $port: IN USE - $ss_info"
        else
            echo "Port $port: AVAILABLE"
        fi
    fi
}

summarize_port 80
summarize_port 443
summarize_port 3000
summarize_port 3001
summarize_port 3002
summarize_port 3003
summarize_port 4001
summarize_port 5000

echo ""
echo -e "${BLUE}=== STEP 8: Recommended Port Configuration ===${NC}"
echo ""

echo "Recommended Port Assignment:"
echo "=============================="
echo ""
echo "Best Deal Shipping:"
echo "  - Frontend: Port 3000"
echo "  - Backend:  Port 4001"
echo "  - Database: Port 5433"
echo ""
echo "Sabito:"
echo "  - Frontend: Port 3001 (or 3004-3010 if available)"
echo "  - Backend:  Port 5000"
echo ""
echo "Nginx (Reverse Proxy):"
echo "  - HTTP:  Port 80"
echo "  - HTTPS: Port 443"
echo ""

echo -e "${GREEN}=========================================="
echo "SCAN COMPLETE"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review the output above"
echo "2. Identify port conflicts"
echo "3. Reconfigure conflicting services to use available ports"
echo "4. Update nginx configuration if needed"
echo ""


