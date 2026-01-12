#!/bin/bash

# Create Complete Backups Before Migration

set -e

BACKUP_DIR=~/nginx-migration-backup-$(date +%Y%m%d-%H%M%S)
mkdir -p $BACKUP_DIR

echo "=========================================="
echo "CREATING BACKUPS FOR SAFE MIGRATION"
echo "=========================================="
echo ""
echo "Backup directory: $BACKUP_DIR"
echo ""

# Step 1: Backup sabito-nginx config
echo "=== Step 1: Backup Sabito Nginx Config ==="
docker exec sabito-nginx cat /etc/nginx/conf.d/sabito.conf > $BACKUP_DIR/sabito-nginx.conf
echo "✓ Backup saved: $BACKUP_DIR/sabito-nginx.conf"

# Step 2: Backup SSL certificates
echo ""
echo "=== Step 2: Backup SSL Certificates ==="
cp -r ~/sabito/ssl $BACKUP_DIR/ssl 2>/dev/null && echo "✓ SSL certificates backed up" || echo "⚠ No SSL directory found"

# Step 3: Backup docker-compose files
echo ""
echo "=== Step 3: Backup Docker Compose Files ==="
if [ -f ~/bestdeal_shipping/docker-compose.prod.yml ]; then
    cp ~/bestdeal_shipping/docker-compose.prod.yml $BACKUP_DIR/bestdeal-docker-compose.yml
    echo "✓ Best Deal docker-compose backed up"
fi

if [ -f ~/sabito/docker-compose.yml ]; then
    cp ~/sabito/docker-compose.yml $BACKUP_DIR/sabito-docker-compose.yml
    echo "✓ Sabito docker-compose backed up"
fi

# Step 4: Backup current container status
echo ""
echo "=== Step 4: Backup Container Status ==="
docker ps > $BACKUP_DIR/containers-running.txt
docker ps -a > $BACKUP_DIR/containers-all.txt
echo "✓ Container status saved"

# Step 5: Backup port status
echo ""
echo "=== Step 5: Backup Port Status ==="
ss -tulpn | grep -E ":(80|443|3000|4001)" > $BACKUP_DIR/ports-listening.txt
echo "✓ Port status saved"

# Step 6: Test current services
echo ""
echo "=== Step 6: Test Current Services ==="
echo "Testing Sabito..."
curl -k -I https://sabito.app 2>&1 | head -3 > $BACKUP_DIR/test-sabito-before.txt || echo "Sabito test failed" > $BACKUP_DIR/test-sabito-before.txt

echo "Testing Best Deal..."
curl -k -I https://www.bestdealshippingapp.com 2>&1 | head -3 > $BACKUP_DIR/test-bestdeal-before.txt || echo "Best Deal test failed" > $BACKUP_DIR/test-bestdeal-before.txt

echo "✓ Service tests saved"

# Step 7: Create rollback script
echo ""
echo "=== Step 7: Create Rollback Script ==="
cat > $BACKUP_DIR/rollback.sh << 'ROLLBACKEOF'
#!/bin/bash
# Rollback Script - Restore Previous Configuration

set -e

echo "=========================================="
echo "ROLLING BACK TO PREVIOUS CONFIGURATION"
echo "=========================================="

# Restore sabito-nginx config
if [ -f sabito-nginx.conf ]; then
    echo "Restoring sabito-nginx config..."
    docker exec sabito-nginx sh -c "cat > /etc/nginx/conf.d/sabito.conf" < sabito-nginx.conf
    docker exec sabito-nginx nginx -t
    docker exec sabito-nginx nginx -s reload
    echo "✓ sabito-nginx config restored"
fi

# Stop Best Deal nginx if it exists
echo ""
echo "Stopping Best Deal nginx (if running)..."
docker stop bestdeal-nginx 2>/dev/null && echo "✓ Stopped" || echo "Not running"
docker rm bestdeal-nginx 2>/dev/null && echo "✓ Removed" || echo "Not found"

# Restore docker-compose if needed
if [ -f bestdeal-docker-compose.yml ]; then
    echo ""
    echo "Restore docker-compose? (y/n)"
    read -r response
    if [ "$response" = "y" ]; then
        cp bestdeal-docker-compose.yml ~/bestdeal_shipping/docker-compose.prod.yml
        cd ~/bestdeal_shipping && docker-compose -f docker-compose.prod.yml up -d
        echo "✓ docker-compose restored"
    fi
fi

echo ""
echo "=========================================="
echo "ROLLBACK COMPLETE"
echo "=========================================="
ROLLBACKEOF

chmod +x $BACKUP_DIR/rollback.sh
echo "✓ Rollback script created: $BACKUP_DIR/rollback.sh"

echo ""
echo "=========================================="
echo "BACKUP COMPLETE!"
echo "=========================================="
echo ""
echo "Backup location: $BACKUP_DIR"
echo ""
echo "To rollback, run:"
echo "  cd $BACKUP_DIR"
echo "  ./rollback.sh"
echo ""
ls -la $BACKUP_DIR
echo ""


