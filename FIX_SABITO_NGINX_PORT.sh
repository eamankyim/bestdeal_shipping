#!/bin/bash

# Fix sabito-nginx to use internal port 8444

echo "=========================================="
echo "FIXING SABITO-NGINX TO INTERNAL PORT"
echo "=========================================="
echo ""

# Step 1: Find sabito docker-compose.yml
echo "=== Step 1: Find sabito docker-compose.yml ==="
SABITO_COMPOSE=""
if [ -f ~/sabito/docker-compose.yml ]; then
    SABITO_COMPOSE=~/sabito/docker-compose.yml
    echo "✓ Found: ~/sabito/docker-compose.yml"
elif [ -f ~/sabito/docker-compose.yaml ]; then
    SABITO_COMPOSE=~/sabito/docker-compose.yaml
    echo "✓ Found: ~/sabito/docker-compose.yaml"
else
    echo "⚠ Cannot find sabito docker-compose.yml"
    echo "Searching..."
    find ~ -name "docker-compose.yml" -path "*/sabito/*" 2>/dev/null | head -1
    SABITO_COMPOSE=$(find ~ -name "docker-compose.yml" -path "*/sabito/*" 2>/dev/null | head -1)
fi

if [ -z "$SABITO_COMPOSE" ]; then
    echo "✗ Cannot find sabito docker-compose.yml"
    echo "Please provide the path manually"
    exit 1
fi

echo "Using: $SABITO_COMPOSE"
cd $(dirname "$SABITO_COMPOSE")

# Step 2: Backup current config
echo ""
echo "=== Step 2: Backup Current Config ==="
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
echo "✓ Backup created"

# Step 3: Check current sabito-nginx configuration
echo ""
echo "=== Step 3: Current sabito-nginx Configuration ==="
grep -A15 "sabito-nginx" docker-compose.yml | head -20 || echo "⚠ Check service name (might be 'nginx')"

# Step 4: Update sabito-nginx ports to internal 8444
echo ""
echo "=== Step 4: Update sabito-nginx Ports ==="
echo "⚠ Attempting to update ports to internal 8444..."
echo "Current ports section:"
grep -A5 "ports:" docker-compose.yml | grep -A5 "sabito-nginx" | head -10 || grep -A5 "ports:" docker-compose.yml | head -10

# Try to update ports - remove external port mapping or change to 8444:443
# This is tricky without knowing exact format, so let's show what needs to be changed
echo ""
echo "⚠ Manual update needed:"
echo "Change sabito-nginx ports from:"
echo "  ports:"
echo "    - \"80:80\""
echo "    - \"443:443\""
echo ""
echo "To (internal port only):"
echo "  ports:"
echo "    - \"8444:443\""
echo ""
echo "Or remove ports section entirely (if using internal network only)"

# Step 5: Show the file content for manual editing
echo ""
echo "=== Step 5: sabito-nginx Service Configuration ==="
echo "Current sabito-nginx service:"
grep -A20 "sabito-nginx:" docker-compose.yml || grep -A20 "nginx:" docker-compose.yml | head -25

echo ""
echo "=========================================="
echo "MANUAL UPDATE REQUIRED"
echo "=========================================="
echo ""
echo "Please edit: $SABITO_COMPOSE"
echo "Update sabito-nginx ports to internal port 8444"
echo ""


