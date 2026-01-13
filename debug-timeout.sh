#!/bin/bash

# Debug Timeout Error

echo "=========================================="
echo "DEBUGGING TIMEOUT ERROR"
echo "=========================================="
echo ""

# Step 1: DNS Check
echo "=== Step 1: DNS Resolution ==="
echo "bestdealshippingapp.com:"
nslookup bestdealshippingapp.com | grep -A2 "Name:" || echo "DNS not resolving!"
echo ""
echo "www.bestdealshippingapp.com:"
nslookup www.bestdealshippingapp.com | grep -A2 "Name:" || echo "DNS not resolving!"
echo ""
echo "Server IP:"
SERVER_IP=$(curl -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "$SERVER_IP"
echo ""

# Step 2: Docker Containers
echo "=== Step 2: Docker Containers ==="
docker ps | grep -E "bestdeal|sabito-nginx" || echo "No containers running!"
echo ""

# Step 3: Port Status
echo "=== Step 3: Port Status ==="
echo "Checking ports 80, 443, 3000, 4001:"
ss -tulpn | grep -E ":(80|443|3000|4001)" || echo "Ports not listening!"
echo ""

# Step 4: Nginx Status
echo "=== Step 4: Nginx Status ==="
if docker ps | grep -q sabito-nginx; then
    echo "✓ sabito-nginx is running"
    echo ""
    echo "Nginx error logs (last 20 lines):"
    docker logs sabito-nginx 2>&1 | tail -20 | grep -i "error\|warn" || echo "No errors in logs"
    echo ""
    echo "Nginx config test:"
    docker exec sabito-nginx nginx -t 2>&1 | tail -5
else
    echo "✗ sabito-nginx is not running!"
fi
echo ""

# Step 5: Test Direct Access
echo "=== Step 5: Direct Access Tests ==="
echo "Frontend (port 3000):"
curl -I http://localhost:3000 2>&1 | head -3 || echo "✗ Frontend not responding!"
echo ""
echo "Backend (port 4001):"
curl -I http://localhost:4001 2>&1 | head -3 || echo "✗ Backend not responding!"
echo ""
echo "Nginx HTTP (port 80):"
curl -I http://localhost 2>&1 | head -3 || echo "✗ Nginx HTTP not responding!"
echo ""
echo "Nginx HTTPS (port 443):"
curl -k -I https://localhost 2>&1 | head -3 || echo "✗ Nginx HTTPS not responding!"
echo ""

# Step 6: Check Firewall
echo "=== Step 6: Firewall Status ==="
if command -v ufw &> /dev/null; then
    ufw status | head -10
elif command -v iptables &> /dev/null; then
    iptables -L -n | grep -E "80|443" | head -5 || echo "No firewall rules for ports 80/443"
else
    echo "Cannot check firewall"
fi

echo ""
echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "If DNS doesn't resolve, update your domain's A record to point to:"
echo "$SERVER_IP"
echo ""


