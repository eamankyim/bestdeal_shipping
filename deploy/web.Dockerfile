# BestDeal website and HTTPS front door. Build context: repository root
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# The site calls the API on its own address (/api), so no API URL is baked in
ENV CI=false GENERATE_SOURCEMAP=false
RUN npm run build
# Compress the files once, as small as they go, so Caddy can send them without compressing each time
COPY deploy/precompress.js /tmp/precompress.js
RUN node /tmp/precompress.js /app/build

FROM caddy:2-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/build /srv
