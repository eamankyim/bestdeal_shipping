#!/bin/bash

# Restore Nginx Config and Fix Syntax Error

cd ~/sabito

echo "=========================================="
echo "RESTORING NGINX CONFIG FROM BACKUP"
echo "=========================================="
echo ""

# Step 1: Find backup file
echo "=== Step 1: Find Backup File ==="
BACKUP_FILE=$(ls -t nginx/conf.d/sabito.conf.backup* 2>/dev/null | head -1)

if [ -n "$BACKUP_FILE" ]; then
    echo "Found backup: $BACKUP_FILE"
    echo "✓ Backup found"
else
    echo "⚠ No backup found in nginx/conf.d/"
    echo "Checking migration backup..."
    MIGRATION_BACKUP=$(ls -t ~/nginx-migration-backup-*/sabito-nginx.conf 2>/dev/null | head -1)
    if [ -n "$MIGRATION_BACKUP" ]; then
        BACKUP_FILE="$MIGRATION_BACKUP"
        echo "Found migration backup: $BACKUP_FILE"
    else
        echo "✗ No backup found!"
        exit 1
    fi
fi

# Step 2: Restore from backup
echo ""
echo "=== Step 2: Restore from Backup ==="
cp "$BACKUP_FILE" nginx/conf.d/sabito.conf
echo "✓ Config restored"

# Step 3: Test nginx config
echo ""
echo "=== Step 3: Test Nginx Config ==="
docker exec sabito-nginx nginx -t

# Step 4: Reload nginx
echo ""
echo "=== Step 4: Reload Nginx ==="
docker exec sabito-nginx nginx -s reload
echo "✓ Nginx reloaded"

# Step 5: Show how to manually remove Best Deal
echo ""
echo "=========================================="
echo "CONFIG RESTORED!"
echo "=========================================="
echo ""
echo "Next step: Manually remove Best Deal config"
echo ""
echo "To manually remove Best Deal:"
echo "1. Edit: nano ~/sabito/nginx/conf.d/sabito.conf"
echo "2. Find and remove server blocks with:"
echo "   server_name bestdealshippingapp.com www.bestdealshippingapp.com;"
echo "3. Remove the entire server block (from 'server {' to '}')"
echo "4. Test: docker exec sabito-nginx nginx -t"
echo "5. Reload: docker exec sabito-nginx nginx -s reload"
echo ""


