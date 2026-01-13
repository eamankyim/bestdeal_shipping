#!/bin/bash
# Update host-nginx to route directly to backend/frontend

echo "=========================================="
echo "UPDATING HOST-NGINX TO ROUTE DIRECTLY"
echo "=========================================="

cd ~/host-nginx

# Backup current configuration
echo ""
echo "=== Backing up current configuration ==="
cp conf.d/router.conf conf.d/router.conf.backup.$(date +%Y%m%d_%H%M%S)

# Update router.conf to route directly
echo ""
echo "=== Updating router.conf ==="

# Create new router.conf with direct routing
cat > conf.d/router.conf << 'EOF'
# Sabito Application
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name sabito.app www.sabito.app api.sabito.app app.sabito.app;
    
    ssl_certificate /etc/nginx/ssl/sabito.crt;
    ssl_certificate_key /etc/nginx/ssl/sabito.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        set $sabito_upstream sabito-nginx:443;
        proxy_pass https://$sabito_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Best Deal Shipping Application - Direct Routing
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name shipeaseshippingapp.com www.shipeaseshippingapp.com;
    
    ssl_certificate /etc/nginx/ssl/shipeaseshippingapp.com.crt;
    ssl_certificate_key /etc/nginx/ssl/shipeaseshippingapp.com.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Frontend - Route directly to frontend container
    location / {
        set $frontend_upstream shipease_frontend:3000;
        proxy_pass http://$frontend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API - Route directly to backend container
    location /api {
        set $backend_upstream shipease_backend:4001;
        proxy_pass http://$backend_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeouts for API calls
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
    }
}

# HTTP Redirects
server {
    listen 80;
    listen [::]:80;
    server_name sabito.app www.sabito.app api.sabito.app app.sabito.app;
    return 301 https://$host$request_uri;
}

server {
    listen 80;
    listen [::]:80;
    server_name shipeaseshippingapp.com www.shipeaseshippingapp.com;
    return 301 https://$host$request_uri;
}
EOF

echo "✅ Configuration updated"

# Connect backend and frontend to host-network
echo ""
echo "=== Connecting services to host-network ==="
docker network connect host-network shipease_backend 2>/dev/null || echo "Backend already on network"
docker network connect host-network shipease_frontend 2>/dev/null || echo "Frontend already on network"

# Test configuration
echo ""
echo "=== Testing nginx configuration ==="
docker exec host-nginx nginx -t

# Reload nginx
if [ $? -eq 0 ]; then
    echo ""
    echo "=== Reloading host-nginx ==="
    docker exec host-nginx nginx -s reload
    echo "✅ host-nginx reloaded"
else
    echo "❌ Configuration test failed!"
    exit 1
fi

echo ""
echo "=========================================="
echo "UPDATE COMPLETE"
echo "=========================================="
echo ""
echo "✅ host-nginx now routes directly to:"
echo "   - Frontend: shipease_frontend:3000"
echo "   - Backend:  shipease_backend:4001"
echo ""
echo "Test: curl -k https://shipeaseshippingapp.com/api/health"

