#!/bin/bash

# Watch All Logs When Visiting Page

echo "=========================================="
echo "WATCHING ALL LOGS - Press Ctrl+C to Stop"
echo "=========================================="
echo ""
echo "This will show logs from:"
echo "  - Nginx (bestdeal_nginx)"
echo "  - Frontend (bestdeal_frontend)"
echo "  - Backend (bestdeal_backend)"
echo ""
echo "Visit the page now and watch the logs!"
echo ""

# Option 1: Follow nginx logs (recommended for web requests)
echo "=== Nginx Logs (shows all HTTP requests) ==="
docker logs -f --timestamps bestdeal_nginx

# Option 2: Follow all logs in parallel
# docker logs -f --timestamps bestdeal_nginx & \
# docker logs -f --timestamps bestdeal_frontend & \
# docker logs -f --timestamps bestdeal_backend & \
# wait


